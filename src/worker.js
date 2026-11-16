import { parentPort, workerData } from 'node:worker_threads';
import { UsageIndex } from './source.js';
import { aggregate } from './aggregate.js';

const index = new UsageIndex(workerData.home);
parentPort.on('message', ({ id, range, now }) => {
	try {
		const scanned = index.scan();
		const data = aggregate(scanned.sessions, range, now, { coverage: scanned.coverage });
		parentPort.postMessage({ id, data: { ...data, index: scanned.index } });
	} catch {
		parentPort.postMessage({ id, error: '用量索引读取失败，请重试' });
	}
});
