/**
 * dsh-usage-dashboard · Host 侧
 *
 * 只读聚合 ~/.dsh 本地数据，向 Client 暴露 /usage-dashboard 系列端点。
 *
 * 数据源（全部只读，写入为零）：
 *   ~/.dsh/storages/session_projcache/sessions/session-<uuid>.json
 *       会话投影：token 四桶（uncachedInput/output/cacheRead/cacheWrite）、
 *       modelSelection.lastUsed、agentPreset、sessionStats.turns、identity.createdAt/cwd
 *   ~/.dsh/sessions/<cwd转写>/session-<uuid>/session.v4.jsonl.zstd
 *       工具调用：tool/call 事件的 data.name 计数（fzstd 纯 JS 解压，不依赖系统 zstd）
 *
 * 端点：
 *   GET /usage-dashboard/data[?range=today|7d|30d]   用量总览
 *
 * 投影行集存在版本变体（旧会话缺 modelSelection/agentPreset 行），读取一律兜底归 unknown。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, basename } from 'node:path';
import { decompress } from 'fzstd';

const DSH_HOME = join(homedir(), '.dsh');
const PROJ_DIR = join(DSH_HOME, 'storages', 'session_projcache', 'sessions');
const SESSIONS_ROOT = join(DSH_HOME, 'sessions');

const RANGES = { today: 'today', '7d': '7d', '30d': '30d' };
const DEFAULT_RANGE = '7d';
const CACHE_TTL_MS = 5000; // 防连点；数据本身请求时聚合

/* ---------- 路径与转写 ---------- */

/** cwd → sessions 工作区目录名（实证规则：'/'→'-'，非 ASCII → ~XXXX 大写十六进制，前后各补一个 '-'） */
function workspaceDir(cwd) {
	if (!cwd) return '';
	const escaped = cwd
		.replace(/\//g, '-')
		.replace(/[^\x21-\x7E]/gu, (ch) => '~' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
	return '-' + escaped + '-';
}

function toolLogPath(uuid, cwd) {
	const direct = join(SESSIONS_ROOT, workspaceDir(cwd), `session-${uuid}`, 'session.v4.jsonl.zstd');
	if (existsSync(direct)) return direct;
	// 兜底：转写规则变化或 cwd 变更时，按 uuid 遍历查找
	try {
		for (const ws of readdirSync(SESSIONS_ROOT, { withFileTypes: true })) {
			if (!ws.isDirectory()) continue;
			const p = join(SESSIONS_ROOT, ws.name, `session-${uuid}`, 'session.v4.jsonl.zstd');
			if (existsSync(p)) return p;
		}
	} catch {
		/* sessions 根目录不存在等，忽略 */
	}
	return null;
}

/* ---------- projcache 读取 ---------- */

function readProjection(file) {
	try {
		const doc = JSON.parse(readFileSync(file, 'utf8'));
		const rec = doc.record ?? doc;
		const rows = rec.rows ?? {};
		const val = (name) => rows[name]?.val ?? null;

		const totals = val('tokenUsage')?.totals ?? {};
		const lastUsed = val('modelSelection')?.lastUsed ?? null;
		const stats = val('sessionStats') ?? {};
		const preset = val('agentPreset');

		const id = basename(file, '.json'); // session-<uuid>
		return {
			id,
			uuid: id.replace(/^session-/, ''),
			createdAt: rec.identity?.createdAt ?? 0,
			cwd: rec.identity?.cwd ?? '',
			tokens: {
				input: totals.uncachedInputTokens ?? 0,
				output: totals.outputTokens ?? 0,
				cacheRead: totals.cacheReadTokens ?? 0,
				cacheWrite: totals.cacheWriteTokens ?? 0,
			},
			model: lastUsed?.model ?? 'unknown',
			provider: lastUsed?.provider ?? 'unknown',
			preset: typeof preset === 'string' && preset ? preset : 'unknown',
			turns: stats.turns ?? 0,
		};
	} catch {
		return null; // 单文件损坏不拖垮整体
	}
}

export function loadProjections() {
	try {
		return readdirSync(PROJ_DIR)
			.filter((name) => /^session-.*\.json$/.test(name))
			.map((name) => readProjection(join(PROJ_DIR, name)))
			.filter((s) => s !== null);
	} catch {
		return [];
	}
}

/* ---------- 工具调用计数 ---------- */

function countToolCalls(logPath) {
	const counts = new Map();
	try {
		const raw = new Uint8Array(readFileSync(logPath));
		const text = new TextDecoder().decode(decompress(raw));
		for (const line of text.split('\n')) {
			if (!line.includes('"tool/call"')) continue; // 行级快速预筛
			try {
				const event = JSON.parse(line);
				if (event.type === 'tool/call' && event.data?.name) {
					counts.set(event.data.name, (counts.get(event.data.name) ?? 0) + 1);
				}
			} catch {
				/* 跳过坏行 */
			}
		}
	} catch {
		/* 解压失败/文件损坏：该会话工具数据缺失，不影响其余聚合 */
	}
	return counts;
}

/* ---------- 聚合（纯函数，供测试与路由共用） ---------- */

function rangeStartMs(range, now = Date.now()) {
	if (range === 'today') {
		const d = new Date(now);
		d.setHours(0, 0, 0, 0);
		return d.getTime();
	}
	const days = range === '30d' ? 30 : 7;
	return now - days * 24 * 60 * 60 * 1000;
}

function emptyBucket() {
	return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 };
}

function addBucket(target, tokens, sessionsDelta = 0) {
	target.input += tokens.input;
	target.output += tokens.output;
	target.cacheRead += tokens.cacheRead;
	target.cacheWrite += tokens.cacheWrite;
	target.total += tokens.input + tokens.output + tokens.cacheRead + tokens.cacheWrite;
	target.sessions += sessionsDelta;
	return target;
}

export function aggregate(sessions, range, now = Date.now(), opts = {}) {
	const since = rangeStartMs(range, now);
	const inRange = sessions.filter((s) => s.createdAt >= since);

	const tokens = { ...emptyBucket(), sessions: 0 };
	const byModel = new Map();
	const byPreset = new Map();
	let turns = 0;

	for (const s of inRange) {
		addBucket(tokens, s.tokens, 1);
		turns += s.turns;

		const m = byModel.get(s.model) ?? { model: s.model, provider: s.provider, ...emptyBucket(), sessions: 0 };
		addBucket(m, s.tokens, 1);
		byModel.set(s.model, m);

		const p = byPreset.get(s.preset) ?? { preset: s.preset, sessions: 0, tokens: emptyBucket() };
		p.sessions += 1;
		addBucket(p.tokens, s.tokens);
		byPreset.set(s.preset, p);
	}

	// 工具计数（只扫窗口内会话的日志；可跳过以便测试）
	const tools = new Map();
	if (opts.withTools !== false) {
		for (const s of inRange) {
			const logPath = toolLogPath(s.uuid, s.cwd);
			if (!logPath) continue;
			for (const [name, count] of countToolCalls(logPath)) {
				tools.set(name, (tools.get(name) ?? 0) + count);
			}
		}
	}

	return {
		range,
		generatedAt: new Date(now).toISOString(),
		sinceMs: since,
		coverage: { projectedSessions: sessions.length, inRange: inRange.length },
		sessions: inRange.length,
		turns,
		tokens,
		byModel: [...byModel.values()].sort((a, b) => b.total - a.total),
		byPreset: [...byPreset.values()].sort((a, b) => b.sessions - a.sessions),
		tools: [...tools.entries()]
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5),
	};
}

/* ---------- 插件入口 ---------- */

export function apply(ctx, config) {
	const defaultRange = RANGES[config?.timeRange] ?? DEFAULT_RANGE;
	const cache = { at: 0, range: null, data: null };

	ctx.inject(['webServer'], (scopeCtx) => {
		scopeCtx.effect?.(() =>
			scopeCtx.webServer.register({
				kind: 'prefix',
				path: '/usage-dashboard',
				handler: async (req, res) => {
					const json = (code, value) => {
						res.writeHead(code, {
							'content-type': 'application/json; charset=utf-8',
							'cache-control': 'no-store',
						});
						res.end(JSON.stringify(value));
					};
					try {
						const url = new URL(req.url ?? '/', 'http://dsh.invalid');
						if (req.method === 'GET' && /^\/data\/?$/.test(url.pathname.replace(/^\/usage-dashboard/, ''))) {
							const range = RANGES[ url.searchParams.get('range') ?? '' ] ?? defaultRange;
							if (cache.data && cache.range === range && Date.now() - cache.at < CACHE_TTL_MS) {
								return json(200, cache.data);
							}
							const data = { ok: true, ...aggregate(loadProjections(), range) };
							cache.data = data;
							cache.range = range;
							cache.at = Date.now();
							return json(200, data);
						}
						return json(404, { ok: false, error: 'unknown action' });
					} catch (error) {
						return json(500, { ok: false, error: String(error?.message ?? error) });
					}
				},
			}),
		);
	});
}
