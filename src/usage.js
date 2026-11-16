// 只保留统计所需字段，正文、工具参数与凭据不进入索引。
export const TOKEN_KEYS = ['input', 'output', 'cacheRead', 'cacheWrite'];

export function emptyBucket() {
	return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 };
}

export function addBucket(target, source) {
	for (const key of TOKEN_KEYS) target[key] += source[key] ?? 0;
	target.total += source.total ?? TOKEN_KEYS.reduce((sum, key) => sum + (source[key] ?? 0), 0);
}

export function dayKey(time) {
	const date = new Date(time);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function modelKey(provider, model) {
	return JSON.stringify([provider, model]);
}

function usageSample(data) {
	if (data.usage) return { usage: data.usage };
	if (!Array.isArray(data.stream)) return null;
	for (let index = data.stream.length - 1; index >= 0; index--) {
		const record = data.stream[index];
		const chunk = record.chunk ?? record;
		if (chunk.type === 'usage' && chunk.usage) return { usage: chunk.usage, time: record.time };
	}
	return null;
}

function normalizeUsage(usage) {
	const fields = ['inputTokens', 'outputTokens', 'cacheReadTokens', 'cacheWriteTokens'];
	for (const key of fields) {
		const value = usage[key];
		if (value === undefined && key.startsWith('cache')) continue;
		if (!Number.isSafeInteger(value) || value < 0) return null;
	}
	const tokens = {
		input: usage.inputTokens,
		output: usage.outputTokens,
		cacheRead: usage.cacheReadTokens ?? 0,
		cacheWrite: usage.cacheWriteTokens ?? 0,
	};
	tokens.total = TOKEN_KEYS.reduce((sum, key) => sum + tokens[key], 0);
	if (!Number.isSafeInteger(tokens.total)) return null;
	const exact = usage.totalTokens;
	if (exact !== undefined && (!Number.isSafeInteger(exact) || exact < tokens.total)) return null;
	const cacheReported = usage.cacheReadTokens !== undefined && usage.cacheWriteTokens !== undefined;
	if (cacheReported && exact !== undefined && exact !== tokens.total) return null;
	return { tokens, complete: cacheReported || exact === tokens.total };
}

function routeOf(value) {
	return {
		provider: typeof value?.provider === 'string' && value.provider ? value.provider : 'unknown',
		model: typeof value?.model === 'string' && value.model ? value.model : 'unknown',
	};
}

/** 按宿主 tokenUsage 投影的替换语义折叠结算，重试开始后建立新槽。 */
export function foldLog(text, metadata = {}) {
	const settlements = new Map();
	const epochs = new Map();
	const calls = new Map();
	const turns = new Map();
	const activities = [];
	const diagnostics = { malformedLines: 0, missingTime: 0, invalidUsage: 0, missingUsage: 0 };
	let route = routeOf(null);
	let identity = { ...metadata };
	let inherited = metadata.inheritedEventCount;
	let skippingSeed = false;
	let eventOffset = 0;

	for (const line of text.split('\n')) {
		if (!line.trim()) continue;
		let event;
		try {
			event = JSON.parse(line);
			if (!event || typeof event !== 'object') throw new Error('invalid event');
		} catch {
			diagnostics.malformedLines++;
			continue;
		}
		if (event.type === 'session') {
			identity = { ...event, ...metadata };
			inherited = metadata.inheritedEventCount ?? event.inheritedEventCount;
			skippingSeed = Boolean(identity.isSeeded) && !Number.isInteger(inherited);
			continue;
		}
		const data = event.data ?? {};
		if (event.type === 'model/selection') route = routeOf(data);
		if (event.type === 'request/header') route = routeOf(data.header?.config);
		if (event.type === 'session/title' && typeof data.title === 'string')
			identity.title = data.title;
		const offset = Number.isInteger(event.seq) ? event.seq : eventOffset;
		eventOffset++;
		if (event.type === 'session/end-seed' && data.inherited === true) skippingSeed = false;
		if (skippingSeed || offset < (inherited ?? 0)) continue;
		const time = event.time ?? event.timestamp;
		const hasTime = typeof time === 'number' && Number.isFinite(time) && time > 0;
		if (event.type === 'user/message' && hasTime) activities.push(time);
		if (event.type === 'turn/start') {
			if (hasTime) turns.set(data.turn ?? offset, time);
			else diagnostics.missingTime++;
		}
		if (event.type === 'tool/call' && typeof data.name === 'string') {
			if (hasTime) calls.set(data.callId ?? offset, { name: data.name, time });
			else diagnostics.missingTime++;
		}
		const stepKey = `${data.turn ?? 'unknown'}:${data.step ?? offset}`;
		if (event.type === 'llm/retry-started') {
			epochs.set(stepKey, (epochs.get(stepKey) ?? 0) + 1);
		}
		if (event.type !== 'assistant/message' && event.type !== 'assistant/attempt') continue;
		const sample = usageSample(data);
		if (!sample) {
			diagnostics.missingUsage++;
			continue;
		}
		const normalized = normalizeUsage(sample.usage);
		if (!normalized) {
			diagnostics.invalidUsage++;
			continue;
		}
		if (!hasTime) {
			diagnostics.missingTime++;
			continue;
		}
		const source = data.message?.source;
		const recordRoute = source?.model ? routeOf(source) : route;
		settlements.set(`${stepKey}:${epochs.get(stepKey) ?? 0}`, {
			time,
			...recordRoute,
			...normalized,
		});
	}
	return {
		id: identity.id?.startsWith('session-')
			? identity.id
			: `session-${identity.id ?? metadata.uuid ?? 'unknown'}`,
		title: identity.title || '未命名会话',
		cwd: identity.cwd || '',
		preset:
			typeof identity.preset === 'string' ? identity.preset : (identity.agentPreset ?? 'unknown'),
		createdAt: identity.createdAt ?? 0,
		records: [...settlements.values()],
		calls: [...calls.values()],
		turnTimes: [...turns.values()],
		activities,
		diagnostics: { ...diagnostics, ambiguousSeed: skippingSeed ? 1 : 0 },
	};
}
