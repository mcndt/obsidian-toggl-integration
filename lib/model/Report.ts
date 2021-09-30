/*
Definitions of fields taken from
https://github.com/toggl/toggl_api_docs/blob/master/reports.md#successful-response
*/

export default interface Report {
	/**
	 * total time in milliseconds for the selected report
	 */
	total_grand?: number;

	/**
	 * total billable time in milliseconds for the selected report
	 */
	total_billable?: number;

	/**
	 * an array with amounts and currencies for the selected report
	 */
	total_currencies?: Totalcurrency[];

	/**
	 * an array with detailed information of the requested report.
	 * The structure of the data in the array depends on the report.
	 */
	// TODO: this should be typed by adding generics: e.g. Report<Summary>, Report<Weekly>, etc.
	data?: any[];

	/**
	 * Is defined when the report API request failed.
	 */
	error?: Error;
}

export interface Totalcurrency {
	currency?: any;
	amount?: any;
}

export interface Error {
	/**
	 * the general message of the occurred error
	 */
	message: string;

	/**
	 * what to do in case of this error
	 */
	tip: string;

	/**
	 * status code of the response
	 */
	code: number;
}
