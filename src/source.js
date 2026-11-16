import { readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, basename } from 'node:path';
import { decompress } from 'fzstd';
import { foldLog } from './usage.js';

export function dataHome() {
	return process.env.DSH_HOME || join(homedir(), '.dsh');
}

function directoryEntries(path, errors) {
	try {
		return readdirSync(path, { withFileTypes: true });
	} catch (error) {
		if (error.code !== 'ENOENT') errors.push({ kind: 'directory-unreadable' });
		return [];
	}
}

function projectionMetadata(file) {
	const document = JSON.parse(readFileSync(file, 'utf8'));
	const record = document.record ?? document;
	const value = (key) => record.rows?.[key]?.val;
	const id = basename(file, '.json');
	const usage = value('tokenUsage');
	const totals = usage?.totals ?? usage ?? {};
	const lastUsed = value('modelSelection')?.lastUsed;
	return {
		...record.identity,
		id,
		uuid: id.replace(/^session-/, ''),
		title: typeof value('title') === 'string' ? value('title') : undefined,
		preset: typeof value('agentPreset') === 'string' ? value('agentPreset') : 'unknown',
		tokens: {
			input: totals.uncachedInputTokens ?? 0,
			output: totals.outputTokens ?? 0,
			cacheRead: totals.cacheReadTokens ?? 0,
			cacheWrite: totals.cacheWriteTokens ?? 0,
		},
		model: lastUsed?.model ?? 'unknown',
		provider: lastUsed?.provider ?? 'unknown',
		turns: value('sessionStats')?.turns ?? 0,
	};
}

export function loadProjections(home = dataHome()) {
	const directory = join(home, 'storages', 'session_projcache', 'sessions');
	return directoryEntries(directory, [])
		.filter((entry) => /^session-.*\.json$/.test(entry.name))
		.flatMap((entry) => {
			try {
				return [projectionMetadata(join(directory, entry.name))];
			} catch {
				return [];
			}
		});
}

function signature(path) {
	const info = statSync(path, { bigint: true });
	return `${info.ino}:${info.size}:${info.mtimeNs}:${info.ctimeNs}`;
}

// 在 worker 内读取，缓存只持有统计字段，签名覆盖日志和投影元信息。
export class UsageIndex {
	constructor(home = dataHome(), { maxEntries = 128, maxRecords = 100000 } = {}) {
		this.home = home;
		this.cache = new Map();
		this.maxEntries = maxEntries;
		this.maxRecords = maxRecords;
	}

	scan() {
		const startedAt = performance.now();
		const errors = [];
		const sources = new Map();
		const projectionDir = join(this.home, 'storages', 'session_projcache', 'sessions');
		for (const entry of directoryEntries(projectionDir, errors)) {
			if (/^session-.*\.json$/.test(entry.name)) {
				const id = entry.name.slice(0, -5);
				sources.set(id, { id, projection: join(projectionDir, entry.name) });
			}
		}
		const projectedSessions = sources.size;
		const sessionRoot = join(this.home, 'sessions');
		for (const workspace of directoryEntries(sessionRoot, errors)) {
			if (!workspace.isDirectory()) continue;
			const workspaceRoot = join(sessionRoot, workspace.name);
			for (const session of directoryEntries(workspaceRoot, errors)) {
				if (!session.isDirectory() || !session.name.startsWith('session-')) continue;
				const source = sources.get(session.name) ?? { id: session.name };
				source.log = join(workspaceRoot, session.name, 'session.v4.jsonl.zstd');
				sources.set(session.name, source);
			}
		}
		const coverage = {
			projectedSessions,
			discoveredSessions: sources.size,
			indexedSessions: 0,
			missingLogs: 0,
			unreadableLogs: 0,
			invalidProjections: 0,
			malformedLines: 0,
			missingTime: 0,
			invalidUsage: 0,
			missingUsage: 0,
			ambiguousSeed: 0,
		};
		const sessions = [];
		let reusedFiles = 0;
		let parsedFiles = 0;
		for (const source of sources.values()) {
			if (!source.log) {
				coverage.missingLogs++;
				continue;
			}
			let logSignature;
			try {
				logSignature = signature(source.log);
			} catch (error) {
				if (error.code === 'ENOENT') coverage.missingLogs++;
				else coverage.unreadableLogs++;
				this.cache.delete(source.id);
				continue;
			}
			let projectionSignature = '';
			if (source.projection) {
				try {
					projectionSignature = signature(source.projection);
				} catch {
					coverage.invalidProjections++;
				}
			}
			const key = `${source.log}:${logSignature}:${projectionSignature}`;
			let cached = this.cache.get(source.id);
			if (cached?.signature === key) reusedFiles++;
			else {
				let metadata = { id: source.id, uuid: source.id.replace(/^session-/, '') };
				let projectionError = 0;
				if (source.projection && projectionSignature) {
					try {
						metadata = projectionMetadata(source.projection);
					} catch {
						projectionError = 1;
					}
				}
				try {
					const raw = readFileSync(source.log);
					const text = new TextDecoder('utf-8', { fatal: true }).decode(
						decompress(new Uint8Array(raw))
					);
					const session = foldLog(text, metadata);
					cached = {
						signature: key,
						session,
						projectionError,
						weight:
							session.records.length +
							session.calls.length +
							session.activities.length +
							session.turnTimes.length,
					};
					parsedFiles++;
				} catch {
					coverage.unreadableLogs++;
					this.cache.delete(source.id);
					continue;
				}
			}
			this.cache.delete(source.id);
			this.cache.set(source.id, cached);
			sessions.push(cached.session);
			coverage.indexedSessions++;
			coverage.invalidProjections += cached.projectionError;
			for (const [key, count] of Object.entries(cached.session.diagnostics)) coverage[key] += count;
		}
		for (const id of this.cache.keys()) if (!sources.has(id)) this.cache.delete(id);
		let weight = [...this.cache.values()].reduce((sum, entry) => sum + entry.weight, 0);
		while (this.cache.size > this.maxEntries || weight > this.maxRecords) {
			const oldest = this.cache.keys().next().value;
			weight -= this.cache.get(oldest).weight;
			this.cache.delete(oldest);
		}
		coverage.directoryErrors = errors.length;
		return {
			sessions,
			coverage,
			index: {
				parsedFiles,
				reusedFiles,
				cachedFiles: this.cache.size,
				durationMs: Math.round(performance.now() - startedAt),
			},
		};
	}
}
