/**
 * Data required to fullfill a Toggl Report query.
 */
export interface Query {
	/** Start of query time interval. */
	from: moment.Moment;
	/** End of query time interval. */
	to: moment.Moment;
	/** Optional, list of Toggl project IDs to include/exclude. */
	subset?: number[];
	/** Optional, operation to execute using subset field. */
	subsetMode?: SubsetMode;
}

/**
 * Data required to fullfill a Toggl summary report query.
 */
export interface SummaryQuery extends Query {
	/** Hide the project breakdown chart UI element from the report. */
	hidePie: boolean;
	/** Hide the time breakdown chart UI element from the report. */
	hideBar: boolean;
	/** Hide the project list UI element from the report. */
	hideList: boolean;
}

/**
 * Data required to fullfill a Toggl timer list report query.
 */
export interface ListQuery extends Query {
	/** Optional, group the time entries by project or day. */
	groupBy?: GroupBy;
	/** Optional, change sort order by date. */
	sort?: SortMode;
	/** Optional, limit the amount of results shown. */
	limit?: number;
}

export enum SubsetMode {
	/** Only include the projects in the subset in the query results. */
	INCLUDE,
	/** Exclude the projects in the subset from the query results. */
	EXCLUDE
}

export enum GroupBy {
	PROJECT,
	DATE
}

export enum SortMode {
	ASCENDING,
	DESCENDING
}
