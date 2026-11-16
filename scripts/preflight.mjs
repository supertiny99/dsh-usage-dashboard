import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

for (const script of ['build', 'test']) execFileSync('npm', ['run', script], { stdio: 'inherit' });
const packed = JSON.parse(
	execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' })
)[0];
const paths = packed.files.map((file) => file.path);
for (const required of [
	'index.js',
	'dist/client.js',
	'src/worker.js',
	'src/source.js',
	'src/service.js',
	'src/usage.js',
	'src/aggregate.js',
	'cordis.patch.yml',
	'README.md',
	'LICENSE',
	'icon.svg',
	'locale/zh.json',
	'locale/en.json',
])
	assert.ok(paths.includes(required), `缺失 ${required}`);
assert.ok(!paths.some((path) => /(^|\/)(node_modules|tests|scripts|\.git)(\/|$)/.test(path)));
console.log(`preflight 通过，${paths.length} 个文件，包体 ${(packed.size / 1024).toFixed(1)} KB`);
