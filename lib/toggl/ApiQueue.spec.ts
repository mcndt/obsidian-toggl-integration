import { describe, it, expect } from 'vitest';
import { ApiQueue } from './ApiQueue';

describe('ApiQueue', () => {
	it('should execute promises in order', async () => {
		const queue = new ApiQueue();
		const results: number[] = [];

		const prom1 = queue
			.queue(() => Promise.resolve(1))
			.then((val) => results.push(val));
		const prom2 = queue
			.queue(
				() =>
					new Promise<number>((resolve) =>
						setTimeout(() => resolve(2), 50)
					)
			)
			.then((val) => results.push(val));
		const prom3 = queue
			.queue(() => Promise.resolve(3))
			.then((val) => results.push(val));

		const queuedPromises = [prom1, prom2, prom3];
		await Promise.all(queuedPromises);

		expect(results).toEqual([1, 2, 3]);
	});
});
