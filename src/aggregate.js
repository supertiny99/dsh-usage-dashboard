import { basename } from 'node:path';
import { emptyBucket, addBucket, dayKey, modelKey } from './usage.js';

export const RANGES = ['today', '7d', '30d'];

export function rangeStartMs(range, now = Date.now()) {
	const date = new Date(now);
	date.setHours(0, 0, 0, 0);
	date.setDate(date.getDate() - (range === '30d' ? 29 : range === '7d' ? 6 : 0));
	return date.getTime();
}

function sortedValues(map) {
	return [...map.values()].sort((a, b) => b.total - a.total);
}

/** 聚合紧凑日志索引，所有子分组共享同一事件窗口与四桶口径。 */
export function aggregate(sessions, range = '7d', now = Date.now(), opts = {}) {
	if (!RANGES.includes(range)) range = '7d';
	const sinceMs = rangeStartMs(range, now);
	const within = (time) => time >= sinceMs && time <= now;
	const daily = new Map();
	for (const date = new Date(sinceMs); date.getTime() <= now; date.setDate(date.getDate() + 1)) {
		const day = dayKey(date.getTime());
		daily.set(day, { date: day, ...emptyBucket(), sessions: new Set() });
	}
	const tokens = emptyBucket();
	const byModel = new Map();
	const projects = new Map();
	const byPreset = new Map();
	const tools = new Map();
	const sessionDetails = [];
	let turns = 0;
	let incompleteRecords = 0;
	let unknownModelRecords = 0;
	let knownPrompt = 0;
	let knownCacheRead = 0;

	for (const session of sessions) {
		const records = session.records.filter((record) => within(record.time));
		const calls = opts.withTools === false ? [] : session.calls.filter((call) => within(call.time));
		const turnTimes = session.turnTimes.filter(within);
		const activityTimes = session.activities.filter(within);
		const times = [
			...records.map((record) => record.time),
			...calls.map((call) => call.time),
			...turnTimes,
			...activityTimes,
		];
		if (!times.length) continue;
		const summary = {
			id: session.id,
			title: session.title,
			cwd: session.cwd,
			preset: session.preset,
			project: session.cwd || 'unknown',
			projectName: basename(session.cwd) || '未归属项目',
			createdAt: session.createdAt,
			lastActivityAt: times.reduce((last, time) => Math.max(last, time), 0),
			turns: turnTimes.length,
			toolCalls: calls.length,
			...emptyBucket(),
			byModel: [],
			daily: [],
			breakdown: [],
			activityDates: [...new Set(times.map(dayKey))],
		};
		const sessionModels = new Map();
		const sessionDays = new Map();
		const breakdown = new Map();
		for (const time of times) daily.get(dayKey(time))?.sessions.add(session.id);
		for (const record of records) {
			const { provider, model } = record;
			const key = modelKey(provider, model);
			const detail = sessionModels.get(key) ?? { key, provider, model, ...emptyBucket() };
			addBucket(detail, record.tokens);
			sessionModels.set(key, detail);
			const day = dayKey(record.time);
			const partKey = JSON.stringify([day, key]);
			const part = breakdown.get(partKey) ?? { date: day, key, provider, model, ...emptyBucket() };
			addBucket(part, record.tokens);
			breakdown.set(partKey, part);
			const dayTotals = sessionDays.get(day) ?? { date: day, ...emptyBucket() };
			addBucket(dayTotals, record.tokens);
			sessionDays.set(day, dayTotals);
			addBucket(summary, record.tokens);
			addBucket(tokens, record.tokens);
			addBucket(daily.get(day), record.tokens);
			if (record.complete) {
				knownPrompt += record.tokens.input + record.tokens.cacheRead + record.tokens.cacheWrite;
				knownCacheRead += record.tokens.cacheRead;
			} else incompleteRecords++;
			if (provider === 'unknown' || model === 'unknown') unknownModelRecords++;
		}
		summary.byModel = sortedValues(sessionModels);
		summary.daily = [...sessionDays.values()];
		summary.breakdown = [...breakdown.values()];
		for (const model of summary.byModel) {
			const group = byModel.get(model.key) ?? {
				key: model.key,
				provider: model.provider,
				model: model.model,
				...emptyBucket(),
				sessions: 0,
			};
			addBucket(group, model);
			group.sessions++;
			byModel.set(model.key, group);
		}
		const project = projects.get(summary.project) ?? {
			key: summary.project,
			name: summary.projectName,
			cwd: session.cwd,
			...emptyBucket(),
			sessions: 0,
		};
		addBucket(project, summary);
		project.sessions++;
		projects.set(summary.project, project);
		const preset = byPreset.get(session.preset) ?? {
			preset: session.preset,
			sessions: 0,
			tokens: emptyBucket(),
		};
		preset.sessions++;
		addBucket(preset.tokens, summary);
		byPreset.set(session.preset, preset);
		for (const call of calls) tools.set(call.name, (tools.get(call.name) ?? 0) + 1);
		turns += summary.turns;
		sessionDetails.push(summary);
	}
	return {
		range,
		generatedAt: new Date(now).toISOString(),
		sinceMs,
		untilMs: now,
		sessions: sessionDetails.length,
		turns,
		tokens: { ...tokens, sessions: sessionDetails.length },
		cacheHitRate: knownPrompt > 0 ? knownCacheRead / knownPrompt : null,
		byModel: sortedValues(byModel),
		projects: sortedValues(projects),
		byPreset: [...byPreset.values()].sort((a, b) => b.sessions - a.sessions),
		tools: [...tools]
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5),
		daily: [...daily.values()].map((day) => ({ ...day, sessions: day.sessions.size })),
		sessionDetails: sessionDetails.sort((a, b) => b.total - a.total),
		coverage: {
			projectedSessions: sessions.length,
			inRange: sessionDetails.length,
			...opts.coverage,
			incompleteRecords,
			unknownModelRecords,
		},
	};
}
