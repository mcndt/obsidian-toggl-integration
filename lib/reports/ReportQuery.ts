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
	/** Optional, indicates a sort order for rendered results. */
	sort?: SortOrder;
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
 * Defines the order to sort rendered results in (ascending or descending)
 */
export enum SortOrder {
	ASC = 'ASC',
	DESC = 'DESC'
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
