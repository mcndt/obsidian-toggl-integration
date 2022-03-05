// Datastructure that maintains an interval tree of non-overlapping intervals.
// NOTE: this is not time-complexity optimized because it will not contain enough
//       data at any point to require better-than-linear scaling.

/** Datastructure that maintains an interval list of non-overlapping intervals.
 *
 *  NOTE: this is not time-complexity optimized because it will not contain
 *  enough data at any point to require better-than-linear scaling.
 */

export interface Interval {
	start: number;
	end: number;
}

export default class IntervalCache {
	private _intervals: Interval[] = [];

	/**
	 * Inserts a new interval into memory.
	 */
	public insert(newInterval: Interval): void {
		if (this._intervals.length > 0) {
			for (let i = 0; i < this._intervals.length; i++) {
				const curr = this._intervals[i];
				// Checking for overlap:

				if (newInterval.end < curr.start) {
					// Case A: New interval entirely precedes curr -> insert at position i
					this._intervals.splice(i, 0, newInterval);
					return;
				} else if (doOverlap(curr, newInterval)) {
					// Case B: New interval overlaps with curr:
					// merge intervals, remove conflicting interval, and insert the new interval.
					const mergedInterval = this._mergeIntervals(newInterval, curr);
					this._intervals.splice(i, 1);
					this.insert(mergedInterval);
					return;
				}
			}
			// Case C: the new interval is inserted at the end.
			this._intervals.push(newInterval);
		} else {
			this._intervals.push(newInterval);
		}
	}

	private _mergeIntervals(a: Interval, b: Interval): Interval {
		const start = a.start < b.start ? a.start : b.start;
		const end = a.end > b.end ? a.end : b.end;
		return { start, end };
	}

	/**
	 * Checks if the passed interval overlaps with what is already in memory.
	 * @return empty array if entire interval is contained in cache. Else,
	 * returns array of missing intervals.
	 */
	public check(interval: Interval): Interval[] {
		const missingIntervals = [interval];
		for (const curr of this._intervals) {
			const remaining = missingIntervals.pop();
			const diff = difference(remaining, curr);
			if (diff.length == 0) {
				// Case: remaining interval is completely covered.
				break;
			} else {
				missingIntervals.push(...diff);
			}
		}
		return missingIntervals;
	}

	public get intervals(): Interval[] {
		return this._intervals;
	}
}

function doOverlap(a: Interval, b: Interval): boolean {
	// https://stackoverflow.com/questions/13513932/algorithm-to-detect-overlapping-periods
	return a.start <= b.end && b.start <= a.end;
}

/**
 * Returns the remainder intervals of a after subtracting b.
 * Returns empty array if b entirely overlaps a.
 * @param a Interval to subtract from
 * @param b Interval to subtract by
 */
function difference(a: Interval, b: Interval): Interval[] {
	if (!doOverlap(a, b)) {
		// Case 1: a and b are entirely non-overlapping
		return [a];
	} else if (b.start <= a.start && b.end >= a.end) {
		// Case 2: b completely spans a
		return [];
	} else if (b.start <= a.start && b.end < a.end) {
		// Case 3: b left-overlaps a
		return [{ start: b.end + 1, end: a.end }];
	} else if (b.start >= a.start && b.end >= a.end) {
		// Case 4: b right-overlaps  a
		return [{ start: a.start, end: b.start - 1 }];
	} else if (b.start >= a.start && b.end <= a.end) {
		return [
			{ start: a.start, end: b.start - 1 },
			{ start: b.end + 1, end: a.end }
		];
	}
	throw Error('Unaccounted case in differencing two intervals!');
}
