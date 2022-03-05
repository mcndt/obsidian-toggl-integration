// Docs for sorted btree: https://www.npmjs.com/package/sorted-btree
import type { Detailed } from 'lib/model/Report';
import type { ISODate } from 'lib/reports/ReportQuery';
import moment from 'moment';
import BTree, { ISortedMap } from 'sorted-btree';
import IntervalCache, { Interval } from './IntervalCache';

/** UNIX-time representation of a date */
type Date = number;

export interface TogglCacheResult {
	results: Detailed[];
	missing: Interval[];
}

export default class TogglCache {
	private intervals = new IntervalCache();
	private entries: ISortedMap<Date, Detailed> = new BTree();

	/**
	 * @param start UNIX-time representation of first day of query range.
	 * @param end UNIX-time representation of last day of query range (inclusive).
	 * @returns TogglCacheResult with cached time entries and missing intervals from cache.
	 */
	public get(start: ISODate, end: ISODate): TogglCacheResult {
		console.debug(`Fetching ${start}-${end} from interval cache.`);
		const start_unix = DateToUnixTime(start);
		const end_unix = DateToUnixTime(end);

		const results = this.entries
			.getRange(start_unix, end_unix + 1000 * 60 * 60 * 24 - 1, true)
			.flatMap(([date, detailed]) => detailed);

		const missing = this.intervals.check({ start: start_unix, end: end_unix });

		return { results, missing };
	}

	/**
	 * Caches an array of detailed report entries.
	 * NOTE: assuems that the entries are a contiguous range with no missing entries!
	 */
	public put(from: ISODate, to: ISODate, entries: Detailed[]): void {
		// Add entries to cache
		for (const entry of entries) {
			const date = moment(entry.start, 'YYYY-MM-DD').unix();
			this.entries.set(date, entry, true);
		}
		// Add new interval to interval cache
		const start = DateToUnixTime(from);
		const end = DateToUnixTime(to);

		this.intervals.insert({ start, end });
		console.debug(`Added ${from}-${to} to reports cache.`);
	}
}

function DateToUnixTime(dateString: ISODate): Date {
	return moment(dateString, 'YYYY-MM-DD')
		.set('hour', 0)
		.set('minute', 0)
		.set('second', 0)
		.unix();
}
