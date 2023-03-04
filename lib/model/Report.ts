/*
Definitions of fields taken from
https://github.com/toggl/toggl_api_docs/blob/master/reports.md#successful-response
https://github.com/toggl/toggl_api_docs/blob/master/reports/detailed.md#response
*/

/** @deprecated */
export interface Report<T> {
  /** total time in milliseconds for the selected report. */
  total_grand?: number;

  /** total billable time in milliseconds for the selected report. */
  total_billable?: number;

  /** an array with amounts and currencies for the selected report. */
  total_currencies?: TotalCurrency[];

  /** total number of time entries that were found for the request. */
  total_count?: number;

  /** how many time entries are displayed in one request. */
  per_page?: number;

  /**
   * an array with detailed information of the requested report.
   * The structure of the data in the array depends on the report.
   */
  groups?: T[];

  /** This field is defined when the report API request failed. */
  error?: Error;
}

/**
 * Object returned by the /reports/api/v2/details endpoint.
 * @deprecated
 */
export interface Detailed {
  id: any;
  pid: number;
  tid?: any;
  uid: number;
  description: string;
  start: string;
  end: string;
  updated: string;
  dur: number;
  user: string;
  use_stop: boolean;
  client: string;
  project: string;
  project_color: string;
  project_hex_color: string;
  task?: any;
  billable?: any;
  is_billable: boolean;
  cur?: any;
  tags: string[];
}

/**
 * Object returned by the /reports/api/v2/summary endpoint
 * @deprecated
 */
export interface Summary {
  id?: number;
  title: SummaryTitle;
  time: number;
  total_currencies?: TotalCurrency[];
  items?: any[];
}

/** @deprecated */
export interface SummaryTitle {
  project: string;
  hex_color: string;
  client: string;
}

/** @deprecated */
export interface TotalCurrency {
  currency?: string;
  amount?: number;
}

/** @deprecated */
export interface Error {
  /** the general message of the occurred error */
  message: string;

  /** what to do in case of this error*/
  tip: string;

  /** status code of the response */
  code: number;
}
