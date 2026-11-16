import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

let entry;
const source = await readFile('dist/client.js', 'utf8');
new Function('window', source)({
	__ModuleLoader__: {
		load: (value) => {
			entry = value;
		},
	},
});
assert.equal(entry.id, '@supertiny99/dsh-usage-dashboard');
const react = { createElement: () => null, Component: class {}, Fragment: 'fragment' };
const client = entry.factory((specifier) => {
	if (specifier === 'react') return react;
	if (specifier === '@deepseek-ai/dsh-client-ui-primitives') return {};
	throw new Error(`未声明的外部依赖 ${specifier}`);
});
assert.ok(client.inject.includes('slots'));
const registrations = [];
client.apply({
	slots: {
		inject: (name, callback) => callback(),
		register: (options, component) => {
			registrations.push({ options, component });
			return () => {};
		},
	},
});
assert.deepEqual(registrations.map((item) => item.options.name).sort(), [
	'main',
	'settings.section',
	'sidebar.panellist',
]);
assert.equal(
	registrations.find((item) => item.options.name === 'main').options.key,
	registrations.find((item) => item.options.name === 'sidebar.panellist').options.id
);
const meta = JSON.parse(await readFile('dist/meta.json', 'utf8'));
assert.ok(
	!Object.keys(meta.inputs).some(
		(path) => path.includes('node_modules/react/') || path.includes('node_modules/react-dom/')
	)
);
console.log('selfcheck 通过，加载器、三处插槽、React 单例检查完成');
