import { Worker } from 'node:worker_threads';
import { dataHome } from './source.js';

export class UsageService {
	constructor({ home = dataHome(), ttlMs = 5000 } = {}) {
		this.home = home;
		this.ttlMs = ttlMs;
		this.cache = new Map();
		this.pending = new Map();
		this.inflight = new Map();
		this.nextId = 0;
		this.disposed = false;
		this.worker = null;
	}

	startWorker() {
		if (this.worker) return;
		const worker = new Worker(new URL('./worker.js', import.meta.url), {
			workerData: { home: this.home },
		});
		worker.unref();
		this.worker = worker;
		worker.on('message', ({ id, data, error }) => {
			const request = this.pending.get(id);
			if (!request) return;
			clearTimeout(request.timeout);
			this.pending.delete(id);
			if (error) request.reject(new Error(error));
			else request.resolve(data);
		});
		const fail = () => {
			if (this.worker !== worker) return;
			this.worker = null;
			this.rejectPending('用量索引线程已结束，请刷新重试');
			void worker.terminate();
		};
		worker.on('error', fail);
		worker.on('exit', fail);
	}

	rejectPending(message) {
		for (const request of this.pending.values()) {
			clearTimeout(request.timeout);
			request.reject(new Error(message));
		}
		this.pending.clear();
	}

	get(range, force = false) {
		if (this.disposed) return Promise.reject(new Error('用量插件已卸载'));
		const existing = this.inflight.get(range);
		if (existing) return existing;
		const cached = this.cache.get(range);
		if (!force && cached && Date.now() - cached.at < this.ttlMs)
			return Promise.resolve(cached.data);
		this.startWorker();
		const id = ++this.nextId;
		const request = new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				const worker = this.worker;
				this.worker = null;
				this.rejectPending('用量索引读取超时，请刷新重试');
				void worker?.terminate();
			}, 60000);
			timeout.unref();
			this.pending.set(id, { resolve, reject, timeout });
			this.worker.postMessage({ id, range, now: Date.now() });
		})
			.then((data) => {
				if (!this.disposed) this.cache.set(range, { at: Date.now(), data });
				return data;
			})
			.finally(() => this.inflight.delete(range));
		this.inflight.set(range, request);
		return request;
	}

	async dispose() {
		this.disposed = true;
		this.cache.clear();
		this.rejectPending('用量插件已卸载');
		const worker = this.worker;
		this.worker = null;
		await worker?.terminate();
	}
}
