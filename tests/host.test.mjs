import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, statSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zstdCompressSync } from 'node:zlib';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { UsageIndex } from '../src/source.js';
import { UsageService } from '../src/service.js';
import { apply } from '../index.js';

function fixture() {
	const home = mkdtempSync(join(tmpdir(), 'dsh-usage-test-'));
	const session = join(home, 'sessions', 'workspace', 'session-a');
	const projection = join(home, 'storages', 'session_projcache', 'sessions');
	mkdirSync(session, { recursive: true });
	mkdirSync(projection, { recursive: true });
	const log = join(session, 'session.v4.jsonl.zstd');
	const projectionFile = join(projection, 'session-a.json');
	writeFileSync(
		projectionFile,
		JSON.stringify({
			record: {
				identity: { cwd: '/project', createdAt: Date.now() - 86400000 },
				rows: { title: { val: '回归会话' }, agentPreset: { val: 'default' } },
			},
		})
	);
	const writeLog = (output = 3) => {
		const events = [
			{ type: 'session', id: 'a', cwd: '/project' },
			{
				type: 'assistant/message',
				seq: 0,
				time: Date.now(),
				data: {
					turn: 1,
					step: 1,
					usage: {
						inputTokens: 10,
						outputTokens: output,
						cacheReadTokens: 20,
						cacheWriteTokens: 2,
					},
					message: { source: { provider: 'p', model: 'm' } },
				},
			},
		];
		writeFileSync(
			log,
			zstdCompressSync(events.map((event) => JSON.stringify(event)).join('\n') + '\n')
		);
	};
	writeLog();
	return {
		home,
		log,
		projectionFile,
		writeLog,
		cleanup: () => rmSync(home, { recursive: true, force: true }),
	};
}

test('文件缓存复用、修改和删除失效，源数据 mtime 保持', () => {
	const data = fixture();
	try {
		const before = statSync(data.log).mtimeMs;
		const index = new UsageIndex(data.home);
		assert.equal(index.scan().index.parsedFiles, 1);
		assert.equal(index.scan().index.reusedFiles, 1);
		assert.equal(statSync(data.log).mtimeMs, before);
		data.writeLog(9);
		const changed = index.scan();
		assert.equal(changed.index.parsedFiles, 1);
		assert.equal(changed.sessions[0].records[0].tokens.output, 9);
		unlinkSync(data.log);
		const missing = index.scan();
		assert.equal(missing.coverage.missingLogs, 1);
		assert.equal(missing.index.cachedFiles, 0);
	} finally {
		data.cleanup();
	}
});

test('损坏投影仍可读日志，损坏压缩日志明确报告，恢复后可重试', () => {
	const data = fixture();
	try {
		writeFileSync(data.projectionFile, '{bad');
		const index = new UsageIndex(data.home);
		assert.equal(index.scan().coverage.invalidProjections, 1);
		assert.equal(index.scan().coverage.indexedSessions, 1);
		writeFileSync(data.log, 'broken');
		assert.equal(index.scan().coverage.unreadableLogs, 1);
		data.writeLog();
		assert.equal(index.scan().coverage.indexedSessions, 1);
	} finally {
		data.cleanup();
	}
});

test('缓存数量和记录权重限制生效，投影缺失的日志仍被发现', () => {
	const data = fixture();
	try {
		unlinkSync(data.projectionFile);
		const index = new UsageIndex(data.home, { maxRecords: 0 });
		const result = index.scan();
		assert.equal(result.coverage.projectedSessions, 0);
		assert.equal(result.coverage.indexedSessions, 1);
		assert.equal(result.index.cachedFiles, 0);
	} finally {
		data.cleanup();
	}
});

test('并发相同范围复用在途请求，强制刷新重新检查签名，卸载终止线程', async () => {
	const data = fixture();
	const service = new UsageService({ home: data.home });
	try {
		const first = service.get('today');
		assert.equal(first, service.get('today', true));
		assert.equal((await first).tokens.total, 35);
		assert.equal((await service.get('today')).index.parsedFiles, 1);
		assert.equal((await service.get('today', true)).index.reusedFiles, 1);
		data.writeLog(9);
		assert.equal((await service.get('today', true)).tokens.total, 41);
		await service.dispose();
		assert.equal(service.worker, null);
		await assert.rejects(service.get('today'), /已卸载/);
	} finally {
		await service.dispose();
		data.cleanup();
	}
});

test('扫描在途卸载会拒绝请求并清理所有待完成状态', async () => {
	const data = fixture();
	const service = new UsageService({ home: data.home });
	try {
		const request = service.get('today');
		const rejected = assert.rejects(request, /已卸载/);
		await service.dispose();
		await rejected;
		assert.equal(service.pending.size, 0);
		assert.equal(service.inflight.size, 0);
		assert.equal(service.cache.size, 0);
	} finally {
		await service.dispose();
		data.cleanup();
	}
});

test('Host 正常 HTTP 入口支持旧字段、默认配置、非法范围回退与路由清理', async () => {
	const data = fixture();
	const previousHome = process.env.DSH_HOME;
	process.env.DSH_HOME = data.home;
	let cleanup;
	let route;
	let unregistered = false;
	const context = {
		inject(names, callback) {
			callback(this);
		},
		effect(callback) {
			cleanup = callback();
		},
		webServer: {
			register(options) {
				route = options;
				return () => {
					unregistered = true;
				};
			},
		},
	};
	const server = createServer((req, res) => route.handler(req, res));
	try {
		apply(context, { timeRange: '30d' });
		server.listen(0, '127.0.0.1');
		await once(server, 'listening');
		const base = `http://127.0.0.1:${server.address().port}/usage-dashboard`;
		for (const query of ['', '?range=invalid']) {
			const response = await fetch(base + '/data' + query);
			assert.equal(response.status, 200);
			const result = await response.json();
			assert.equal(result.range, '30d');
			assert.equal(result.defaultRange, '30d');
			for (const key of [
				'sessions',
				'turns',
				'tokens',
				'byModel',
				'byPreset',
				'tools',
				'coverage',
				'daily',
				'projects',
				'sessionDetails',
			])
				assert.ok(key in result, key);
		}
		assert.equal((await (await fetch(base + '/data?range=today')).json()).range, 'today');
		assert.equal((await fetch(base + '/other')).status, 404);
		assert.equal((await fetch(base + '/data', { method: 'POST' })).status, 404);
		await cleanup();
		assert.ok(unregistered);
	} finally {
		await cleanup?.();
		server.closeAllConnections();
		await new Promise((resolve) => server.close(resolve));
		if (previousHome === undefined) delete process.env.DSH_HOME;
		else process.env.DSH_HOME = previousHome;
		data.cleanup();
	}
});
