import { UsageService } from './src/service.js';
import { RANGES } from './src/aggregate.js';

export { aggregate } from './src/aggregate.js';
export { loadProjections } from './src/source.js';
export const name = '@supertiny99/dsh-usage-dashboard';

export function apply(ctx, config) {
	const defaultRange = RANGES.includes(config?.timeRange) ? config.timeRange : '7d';
	ctx.inject(['webServer'], (scope) => {
		scope.effect(() => {
			const service = new UsageService();
			const unregister = scope.webServer.register({
				kind: 'prefix',
				path: '/usage-dashboard',
				handler: async (req, res) => {
					const json = (code, value) => {
						if (res.destroyed || res.writableEnded) return;
						res.writeHead(code, {
							'content-type': 'application/json; charset=utf-8',
							'cache-control': 'no-store',
						});
						res.end(JSON.stringify(value));
					};
					try {
						const url = new URL(req.url ?? '/', 'http://dsh.invalid');
						const path = url.pathname.replace(/^\/usage-dashboard/, '');
						if (req.method !== 'GET' || !/^\/data\/?$/.test(path)) {
							return json(404, { ok: false, error: 'unknown action' });
						}
						const selected = url.searchParams.get('range');
						const range = RANGES.includes(selected) ? selected : defaultRange;
						const data = await service.get(range, url.searchParams.get('refresh') === '1');
						json(200, { ok: true, ...data, defaultRange });
					} catch (error) {
						json(500, { ok: false, error: error.message });
					}
				},
			});
			return () => {
				unregister();
				return service.dispose();
			};
		});
	});
}
