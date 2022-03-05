// Docs for sorted btree: https://www.npmjs.com/package/sorted-btree
import type { Detailed, Report } from 'lib/model/Report';
import type { ISODate } from 'lib/reports/ReportQuery';
import moment from 'moment';
import BTree, { ISortedMap } from 'sorted-btree';
import IntervalCache, { Interval } from './IntervalCache';

/** UNIX-time representation of a date */
type Date = number;

export interface TogglCacheResult {
	report: Report<Detailed>;
	missing: { from: ISODate; to: ISODate }[];
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

		const data = this.entries
			.getRange(start_unix, end_unix + 1000 * 60 * 60 * 24 - 1, true)
			.flatMap(([date, detailed]) => detailed);

		const total_grand = data.reduce((count, entry) => count + entry.dur, 0);
		const report: Report<Detailed> = {
			total_grand,
			data,
			total_count: data.length
		};

		const missingUnix = this.intervals.check({
			start: start_unix,
			end: end_unix
		});

		const missing = missingUnix.map((interval) => {
			const from = moment(interval.start * 1000).format('YYYY-MM-DD');
			const to = moment(interval.end * 1000).format('YYYY-MM-DD');
			return { from, to };
		});

		return { report, missing };
	}

	/**
	 * Caches an array of detailed report entries.
	 * NOTE: assuems that the entries are a contiguous range with no missing entries!
	 */
	public put(from: ISODate, to: ISODate, entries: Detailed[]): void {
		// Add entries to cache
		for (const entry of entries) {
			const date = moment(entry.start).unix();
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
