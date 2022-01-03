import type { Query } from '../ReportQuery';

/**
 * A query language keyword.
 */
export enum Keyword {
	// query type keywords
	SUMMARY = 'SUMMARY',
	LIST = 'LIST',

	// query time interval keywords
	TODAY = 'TODAY',
	WEEK = 'WEEK',
	MONTH = 'MONTH',
	PREVIOUS = 'PREVIOUS',
	DAYS = 'DAYS',
	WEEKS = 'WEEKS',
	MONTHS = 'MONTHS',
	FROM = 'FROM',
	TO = 'TO',

	// inclusion/exclusion keywords
	INCLUDE = 'INCLUDE',
	EXCLUDE = 'EXCLUDE',
	PROJECTS = 'PROJECTS',

	// summary specific keywords
	HIDE = 'HIDE',
	BAR = 'BAR',
	// LIST, but already introduced earlier
	AREA = 'AREA',
	// list specific keywords
	GROUP = 'GROUP',
	BY = 'BY',
	DATE = 'DATE',
	PROJECT = 'PROJECT',
	SORT = 'SORT',
	ASC = 'ASC',
	DESC = 'DESC',
	LIMIT = 'LIMIT'
}

/**
 * User input token in the form of a string or integer.
 */
export type UserInput = string | number;

/**
 * A query language token. Can be a Keyword or a UserInput
 */
export type Token = Keyword | UserInput;

/**
 * Date string formatted as YYYY-MM-DD
 */
export const ISODateFormat = 'YYYY-MM-DD';

/**
 * A Parser is a function which takes a list of tokens and tries to consume them,
 * adding data to the query reference passed. If parsed successfully, The parser
 * returns a list of remaining tokens.
 */
export type Parser = (tokens: Token[], query: Query) => Token[];

/**
 * Produces an empty query.
 */
export function newQuery(): Query {
	return {
		type: null,
		from: null,
		to: null
	};
}

export class QueryParseError extends EvalError {}

export class InvalidTokenError extends QueryParseError {
	constructor(token: Token, accepted: Token[]) {
		super(
			`Invalid token: "${token}". Accepted keywords at this position: ${accepted.join(
				', '
			)}`
		);
	}
}
