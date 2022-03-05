import IntervalCache, { Interval } from './IntervalCache';

let intervalCache: IntervalCache;

describe('parse', () => {
	beforeEach(() => {
		intervalCache = new IntervalCache();
	});

	test('Can insert non-overlapping intervals', () => {
		intervalCache.insert({ start: 0, end: 2 });
		intervalCache.insert({ start: 3, end: 5 });
		expect(intervalCache.intervals).toHaveLength(2);
		expect(intervalCache.intervals).toContainEqual({ start: 0, end: 2 });
		expect(intervalCache.intervals).toContainEqual({ start: 3, end: 5 });
	});

	test('Can insert overlapping intervals', () => {
		intervalCache.insert({ start: 0, end: 2 });
		intervalCache.insert({ start: 1, end: 5 });
		expect(intervalCache.intervals).toHaveLength(1);
		expect(intervalCache.intervals).toContainEqual({ start: 0, end: 5 });
	});

	test('Returns empty array for fully included intervals', () => {
		intervalCache.insert({ start: 0, end: 10 });
		expect(intervalCache.check({ start: 2, end: 8 })).toEqual<Interval[]>([]);
		expect(intervalCache.check({ start: 0, end: 8 })).toEqual<Interval[]>([]);
		expect(intervalCache.check({ start: 2, end: 10 })).toEqual<Interval[]>([]);
		expect(intervalCache.check({ start: 0, end: 10 })).toEqual<Interval[]>([]);
	});

	test('Returns same interval for fully excluded intervals', () => {
		intervalCache.insert({ start: 0, end: 10 });
		expect(intervalCache.check({ start: -2, end: -1 })).toEqual<Interval[]>([
			{ start: -2, end: -1 }
		]);
		expect(intervalCache.check({ start: 11, end: 12 })).toEqual<Interval[]>([
			{ start: 11, end: 12 }
		]);
	});

	test('Returns Interval for partially excluded intervals (right-overlapping)', () => {
		intervalCache.insert({ start: 0, end: 10 });
		expect(intervalCache.check({ start: 8, end: 14 })).toEqual<Interval[]>([
			{
				start: 11,
				end: 14
			}
		]);
		expect(intervalCache.check({ start: 10, end: 14 })).toEqual<Interval[]>([
			{
				start: 11,
				end: 14
			}
		]);
	});

	test('Returns Interval for partially excluded intervals (left-overlapping)', () => {
		intervalCache.insert({ start: 0, end: 10 });
		expect(intervalCache.check({ start: -5, end: 2 })).toEqual<Interval[]>([
			{
				start: -5,
				end: -1
			}
		]);
		expect(intervalCache.check({ start: -5, end: 0 })).toEqual<Interval[]>([
			{
				start: -5,
				end: -1
			}
		]);
	});

	test('Returns Interval for partially excluded intervals (middle-overlapping)', () => {
		intervalCache.insert({ start: 0, end: 2 });
		intervalCache.insert({ start: 5, end: 7 });

		// single interval
		let result = intervalCache.check({ start: 1, end: 5 });
		expect(result).toContainEqual<Interval>({ start: 3, end: 4 });

		// double interval
		result = intervalCache.check({ start: 0, end: 9 });
		expect(result).toContainEqual<Interval>({ start: 3, end: 4 });
		expect(result).toContainEqual<Interval>({ start: 8, end: 9 });

		// triple interval
		result = intervalCache.check({ start: -2, end: 9 });
		expect(result).toContainEqual<Interval>({ start: -2, end: -1 });
		expect(result).toContainEqual<Interval>({ start: 3, end: 4 });
		expect(result).toContainEqual<Interval>({ start: 8, end: 9 });
	});
});
