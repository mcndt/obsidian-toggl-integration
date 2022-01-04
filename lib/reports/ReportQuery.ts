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
	/** Optional, indicates a grouping for list reports. */
	groupBy?: GroupBy;
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

export enum SelectionMode {
	/** Only include the projects in the subset in the query results. */
	INCLUDE = 'INCLUDE',
	/** Exclude the projects in the subset from the query results. */
	EXCLUDE = 'EXCLUDE'
}

export enum SortOrder {
	/**
	 * Order dates in chronological order,
	 * or order projects by ascending total time.
	 */
	ASC = 'ASC',
	/**
	 * Order dates in reverse chronological order,
	 * or order projects by descending total time.
	 */
	DESC = 'DESC'
}

export enum GroupBy {
	/** Group list of time entries by project. */
	PROJECT = 'PROJECT',
	/** Group list of time entries by date. */
	DATE = 'DATE'
}
