import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { aggregate } from '../src/aggregate.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import('react-dom/client');
let entry;
dom.window.__ModuleLoader__ = {
	load: (value) => {
		entry = value;
	},
};
new Function('window', readFileSync(new URL('../dist/client.js', import.meta.url), 'utf8'))(
	dom.window
);
const plugin = entry.factory((name) => (name === 'react' ? React : {}));
let Panel;
plugin.apply({
	slots: {
		inject: (name, callback) => callback(),
		register: (options, component) => {
			if (options.name === 'main') Panel = component;
			return () => {};
		},
	},
});

function response(range, total = 0) {
	const data = aggregate([], range);
	return {
		ok: true,
		json: async () => ({
			ok: true,
			...data,
			tokens: { ...data.tokens, total },
			index: { durationMs: 0, reusedFiles: 0, parsedFiles: 0 },
			coverage: { ...data.coverage, indexedSessions: 0, discoveredSessions: 0 },
		}),
	};
}
const settle = () => new Promise((resolve) => setImmediate(resolve));
const button = (container, label) =>
	[...container.querySelectorAll('button')].find((element) => element.textContent === label);

async function mounted(run) {
	const container = document.createElement('div');
	document.body.append(container);
	const root = createRoot(container);
	const originalFetch = globalThis.fetch;
	try {
		await run(root, container);
	} finally {
		await act(async () => root.unmount());
		container.remove();
		globalThis.fetch = originalFetch;
	}
}

test('真实 React 组件从失败状态重试，成功后清除错误并展示数据', async () => {
	await mounted(async (root, container) => {
		let calls = 0;
		globalThis.fetch = async () => {
			if (++calls === 1) throw new Error('回归请求失败');
			return response('7d');
		};
		await act(async () => {
			root.render(React.createElement(Panel));
			await settle();
		});
		assert.match(container.querySelector('[role="alert"]').textContent, /回归请求失败/);
		await act(async () => {
			button(container, '重试').click();
			await settle();
		});
		assert.equal(calls, 2);
		assert.equal(container.querySelector('[role="alert"]'), null);
		assert.match(container.textContent, /已报告 token/);
	});
});

test('切换范围取消旧请求，迟到响应保持失效，卸载清理当前请求', async () => {
	let latestSignal;
	await mounted(async (root, container) => {
		const requests = [];
		globalThis.fetch = (url, options) =>
			new Promise((resolve) => {
				requests.push({ url, ...options, resolve });
			});
		await act(async () => {
			root.render(React.createElement(Panel));
			await settle();
		});
		assert.equal(requests.length, 1);
		await act(async () => {
			button(container, '近 30 天').click();
			await settle();
		});
		assert.equal(requests.length, 2);
		assert.equal(requests[0].signal.aborted, true);
		assert.match(requests[1].url, /range=30d/);
		await act(async () => {
			requests[1].resolve(response('30d', 50));
			await settle();
		});
		await act(async () => {
			requests[0].resolve(response('today', 99999));
			await settle();
		});
		assert.equal(container.querySelector('.ud-metric strong').textContent, '50');
		assert.equal(button(container, '近 30 天').getAttribute('aria-pressed'), 'true');
		latestSignal = requests[1].signal;
	});
	assert.equal(latestSignal.aborted, true);
});
