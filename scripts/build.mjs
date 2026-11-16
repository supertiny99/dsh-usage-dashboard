import { build, context } from 'esbuild';
import { writeFile } from 'node:fs/promises';

export const HOST_SHARED = [
	'react',
	'react/jsx-runtime',
	'react-dom',
	'react-dom/client',
	'@deepseek-ai/cordis',
	'zod',
	'@tanstack/react-virtual',
	'@deepseek-ai/dsh-client-store',
	'@deepseek-ai/dsh-client-ui-slots',
	'@deepseek-ai/dsh-client-ui-primitives',
	'@deepseek-ai/dsh-client-ui-dockkit',
];
const watch = process.argv.includes('--watch');
const options = {
	entryPoints: ['src/client.jsx'],
	outfile: 'dist/client.js',
	bundle: true,
	format: 'cjs',
	platform: 'browser',
	target: 'chrome120',
	jsx: 'transform',
	jsxFactory: 'React.createElement',
	jsxFragment: 'React.Fragment',
	external: HOST_SHARED,
	loader: { '.css': 'text' },
	metafile: true,
	minify: !watch,
	legalComments: 'none',
	banner: {
		js: 'window.__ModuleLoader__.load({id:"@supertiny99/dsh-usage-dashboard",factory:(require)=>{const module={exports:{}};const exports=module.exports;',
	},
	footer: { js: 'return module.exports}})' },
};
if (watch) {
	const compiler = await context(options);
	await compiler.watch();
	console.log('正在监听用量工作台源码');
} else {
	const result = await build(options);
	await writeFile('dist/meta.json', JSON.stringify(result.metafile, null, 2));
	console.log('用量工作台构建完成');
}
