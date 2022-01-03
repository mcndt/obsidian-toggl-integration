export type ISODate = string;

export enum QueryType {
	SUMMARY = 'SUMMARY',
	LIST = 'LIST'
}

/**
 * Data required to fullfill a Toggl Report query.
 */
export interface Query {
	type: QueryType;
	/** Start of query time interval. */
	from: ISODate;
	/** End of query time interval. */
	to: ISODate;
	/** Optional, list of Toggl project IDs to include/exclude. */
	projectSelection?: Selection;
}

/**
 * Subset to select when fullfilling the Toggl report query.
 * e.g. to exclude certain projects
 */
export interface Selection {
	/** Whether to include or exclude the items in the list property. */
	mode: SelectionMode;
	/** list of Toggl project IDs or names to include/exclude. */
	list: (string | number)[];
}

/**
 * Data required to fullfill a Toggl summary report query.
 */
export interface SummaryQuery extends Query {
	/** Hide the project breakdown chart UI element from the report. */
	// hidePie: boolean;
	/** Hide the time breakdown chart UI element from the report. */
	// hideBar: boolean;
	/** Hide the project list UI element from the report. */
	// hideList: boolean;
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

export enum SelectionMode {
	/** Only include the projects in the subset in the query results. */
	INCLUDE = 'INCLUDE',
	/** Exclude the projects in the subset from the query results. */
	EXCLUDE = 'EXCLUDE'
}

export enum GroupBy {
	PROJECT = 'PROJECT',
	DATE = 'DATE'
}

export enum SortMode {
	ASC = 'ASC',
	DESC = 'DESC'
}
