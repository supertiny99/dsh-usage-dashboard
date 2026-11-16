import test from 'node:test';
import assert from 'node:assert/strict';
import { filterSessions } from '../src/client-model.js';

const a = {
	id: 'session-a',
	title: '开发插件',
	project: '/one',
	cwd: '/one',
	lastActivityAt: 1,
	activityDates: ['2026-11-15', '2026-11-16'],
	breakdown: [
		{
			date: '2026-11-15',
			key: 'p1/m',
			provider: 'p1',
			model: 'm',
			input: 1,
			output: 2,
			cacheRead: 3,
			cacheWrite: 4,
			total: 10,
		},
		{
			date: '2026-11-16',
			key: 'p2/m',
			provider: 'p2',
			model: 'm',
			input: 10,
			output: 20,
			cacheRead: 30,
			cacheWrite: 40,
			total: 100,
		},
	],
};
const b = {
	...a,
	id: 'session-b',
	title: '文档',
	cwd: '/two',
	project: '/two',
	lastActivityAt: 2,
	breakdown: [a.breakdown[0]],
};
const filters = { day: '', project: '', model: '', search: '', sort: 'total' };

test('会话明细按日期、项目、供应商模型交叉过滤，四桶随筛选变化', () => {
	const result = filterSessions([a, b], {
		...filters,
		day: '2026-11-16',
		project: '/one',
		model: 'p2/m',
	});
	assert.equal(result.length, 1);
	assert.equal(result[0].total, 100);
	assert.equal(result[0].cacheWrite, 40);
	assert.equal(result[0].matchingModels[0].provider, 'p2');
	assert.equal(filterSessions([a], { ...filters, day: '2026-11-15', model: 'p2/m' }).length, 0);
});

test('搜索覆盖标题、路径、会话编号，排序可切换且源数据保持', () => {
	assert.equal(filterSessions([a, b], { ...filters, search: '插件' })[0].id, a.id);
	assert.equal(filterSessions([a, b], { ...filters, search: '/two' })[0].id, b.id);
	assert.equal(filterSessions([a, b], { ...filters, search: 'SESSION-B' })[0].id, b.id);
	assert.equal(filterSessions([a, b], filters)[0].id, a.id);
	assert.equal(filterSessions([a, b], { ...filters, sort: 'recent' })[0].id, b.id);
	assert.equal(a.total, undefined);
});

test('只有活动的零用量会话在日期筛选中保留，模型筛选中排除', () => {
	const empty = { ...a, breakdown: [] };
	assert.equal(filterSessions([empty], { ...filters, day: '2026-11-16' })[0].total, 0);
	assert.equal(filterSessions([empty], { ...filters, model: 'p1/m' }).length, 0);
});
