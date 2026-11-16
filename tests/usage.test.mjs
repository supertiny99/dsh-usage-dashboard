import test from 'node:test';
import assert from 'node:assert/strict';
import { foldLog, TOKEN_KEYS } from '../src/usage.js';
import { aggregate, rangeStartMs } from '../src/aggregate.js';

const now = new Date(2026, 10, 16, 15).getTime();
const morning = new Date(2026, 10, 16, 9).getTime();
const yesterday = new Date(2026, 10, 15, 9).getTime();
const header = { type: 'session', id: 'a', cwd: '/projects/alpha', createdAt: yesterday };
const usage = { inputTokens: 10, outputTokens: 3, cacheReadTokens: 20, cacheWriteTokens: 2 };
const event = (type, data, time = morning) => ({ type, data, time });
const message = (tokens = usage, extra = {}, time = morning) =>
	event(
		'assistant/message',
		{
			turn: 1,
			step: 1,
			usage: tokens,
			message: { source: { provider: 'p1', model: 'model' } },
			...extra,
		},
		time
	);
const session = (events, metadata = {}) =>
	foldLog([header, ...events].map((value) => JSON.stringify(value)).join('\n'), metadata);

function assertConservation(data) {
	for (const key of [...TOKEN_KEYS, 'total']) {
		for (const groups of [data.daily, data.byModel, data.projects, data.sessionDetails]) {
			assert.equal(
				groups.reduce((sum, group) => sum + group[key], 0),
				data.tokens[key],
				key
			);
		}
	}
}

test('跨日会话按结算时间计入今日，窗口外和未来事件排除', () => {
	const data = aggregate(
		[
			session([
				message(usage, { step: 0 }, yesterday),
				message(),
				message(usage, { step: 2 }, now + 1),
			]),
		],
		'today',
		now
	);
	assert.equal(data.sessions, 1);
	assert.equal(data.tokens.total, 35);
	assert.equal(data.daily.length, 1);
	assertConservation(data);
});

test('近七天包含今天与六个本地日历日，午夜边界精确', () => {
	const since = rangeStartMs('7d', now);
	const data = aggregate(
		[session([message(usage, { step: 0 }, since - 1), message(usage, { step: 1 }, since)])],
		'7d',
		now
	);
	assert.equal(new Date(since).getHours(), 0);
	assert.equal(new Date(since).getDate(), 10);
	assert.equal(data.daily.length, 7);
	assert.equal(data.tokens.total, 35);
});

test('同一会话不同模型与不同供应商独立归属', () => {
	const data = aggregate(
		[
			session([
				message(),
				message(usage, { step: 2, message: { source: { provider: 'p2', model: 'model' } } }),
				message(usage, { step: 3, message: { source: { provider: 'p1', model: 'other' } } }),
			]),
		],
		'today',
		now
	);
	assert.equal(data.byModel.length, 3);
	assert.equal(data.sessions, 1);
	assert.equal(data.tokens.total, 105);
	assertConservation(data);
});

test('同一步重复结算替换，重试开始后新增计数槽', () => {
	const data = aggregate(
		[
			session([
				message(),
				message(),
				event('assistant/attempt', { turn: 1, step: 1, usage }),
				event('llm/retry-started', { turn: 1, step: 1, retryId: 'r1' }),
				message({ ...usage, outputTokens: 5 }),
			]),
		],
		'today',
		now
	);
	assert.equal(data.tokens.total, 72);
	assertConservation(data);
});

test('旧式直接 usage 与新版压缩 stream usage 都可读取，请求头提供路由', () => {
	const result = session([
		event('request/header', { header: { config: { provider: 'route', model: 'packed' } } }),
		event('assistant/attempt', {
			turn: 1,
			step: 1,
			stream: [{ type: 'chunk', time: morning, chunk: { type: 'usage', usage } }],
		}),
	]);
	assert.equal(result.records[0].model, 'packed');
	assert.equal(result.records[0].tokens.total, 35);
});

test('旧 stream usage 记录与 timestamp 信封兼容', () => {
	const result = session([
		{
			type: 'assistant/attempt',
			timestamp: morning,
			data: { turn: 1, step: 1, stream: [{ type: 'usage', usage }] },
		},
	]);
	assert.equal(result.records.length, 1);
	assert.equal(result.records[0].provider, 'unknown');
});

test('分叉会话排除已继承前缀，保留后续自己的消费', () => {
	const result = session(
		[
			{ ...message(), seq: 0 },
			{ ...message(usage, { step: 2 }), seq: 1 },
			{ ...message(usage, { step: 3 }), seq: 2 },
		],
		{ isSeeded: true, inheritedEventCount: 2 }
	);
	assert.equal(result.records.length, 1);
	assert.equal(result.records[0].tokens.total, 35);
});

test('旧分叉用 end-seed 确定边界，缺边界的日志显示诊断', () => {
	const result = session(
		[message(), event('session/end-seed', { inherited: true }), message(usage, { step: 2 })],
		{ isSeeded: true }
	);
	assert.equal(result.records.length, 1);
	const ambiguous = session([message()], { isSeeded: true });
	assert.equal(ambiguous.records.length, 0);
	assert.equal(ambiguous.diagnostics.ambiguousSeed, 1);
});

test('负数、矛盾总量、缺失时间与损坏行有明确诊断', () => {
	const text =
		[
			header,
			message({ ...usage, inputTokens: -1 }),
			message({ ...usage, totalTokens: 34 }),
			{ type: 'assistant/message', data: { turn: 2, step: 1, usage } },
			message(),
		]
			.map((value) => JSON.stringify(value))
			.join('\n') + '\n{broken\n';
	const result = foldLog(text);
	assert.equal(result.records.length, 1);
	assert.equal(result.diagnostics.invalidUsage, 2);
	assert.equal(result.diagnostics.missingTime, 1);
	assert.equal(result.diagnostics.malformedLines, 1);
});

test('缺失缓存桶保留已报告数，并限定命中率分母', () => {
	const data = aggregate(
		[session([message({ inputTokens: 10, outputTokens: 5 }), message(usage, { step: 2 })])],
		'today',
		now
	);
	assert.equal(data.tokens.total, 50);
	assert.equal(data.coverage.incompleteRecords, 1);
	assert.equal(data.cacheHitRate, 20 / 32);
	assertConservation(data);
});

test('精确总量等于已报告桶时可以确认缺失缓存桶为零', () => {
	const data = aggregate(
		[session([message({ inputTokens: 10, outputTokens: 5, totalTokens: 15 })])],
		'today',
		now
	);
	assert.equal(data.coverage.incompleteRecords, 0);
	assert.equal(data.cacheHitRate, 0);
});

test('工具调用按事件时间且 callId 去重，轮次按开始时间计数', () => {
	const call = event('tool/call', { name: 'read', callId: 'a' });
	const data = aggregate(
		[
			session([
				call,
				call,
				event('tool/call', { name: 'write', callId: 'b' }, yesterday),
				event('turn/start', { turn: 1 }),
				event('turn/start', { turn: 1 }),
				event('turn/start', { turn: 2 }, yesterday),
			]),
		],
		'today',
		now
	);
	assert.deepEqual(data.tools, [{ name: 'read', count: 1 }]);
	assert.equal(data.turns, 1);
	assert.equal(data.sessions, 1);
	assert.equal(data.tokens.total, 0);
});

test('日期与模型交叉明细守恒，项目路径同名仍独立', () => {
	const a = session([message(usage, { step: 0 }, yesterday), message()]);
	const b = session([message()], { id: 'session-b', cwd: '/other/alpha' });
	const data = aggregate([a, b], '7d', now);
	assert.equal(data.projects.length, 2);
	for (const summary of data.sessionDetails)
		assert.equal(
			summary.breakdown.reduce((sum, part) => sum + part.total, 0),
			summary.total
		);
	assertConservation(data);
});

test('空目录与未知范围可用，默认七日且返回零值', () => {
	const data = aggregate([], 'invalid', now);
	assert.equal(data.range, '7d');
	assert.equal(data.daily.length, 7);
	assert.equal(data.cacheHitRate, null);
	assert.equal(data.tokens.total, 0);
});
