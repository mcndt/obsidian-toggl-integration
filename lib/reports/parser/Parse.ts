import type { ListQuery, Query, SummaryQuery } from '../ReportQuery';

import moment from 'moment';
import { Keyword, Token } from './Tokenize';

/** Date string formatted as YYYY-MM-DD */
export type ISODate = string;
export const ISODateFormat = 'YYYY-MM-DD';

/**
 * @param tokens list of keyword tokens part of a query.
 * @returns a query object containing required information for fullfilling
 *          the request.
 */
export function parse(tokens: Token[]): Query {
	const type = tokens[0];
	const accepted_types: Token[] = [Keyword.SUMMARY, Keyword.LIST];

	if (!accepted_types.includes(type)) {
		throw new InvalidTokenError(type, accepted_types);
	}

	// // First expect report type keyword
	// switch (tokens[0]) {
	// 	case Keyword.SUMMARY:
	// 	// query = parseSummaryQuery(tokens.slice(1));
	// 	case Keyword.LIST:
	// 	// query = parseListQuery(tokens.slice(1));
	// 	default:
	// 		throw new InvalidTokenError(tokens[0], [Keyword.SUMMARY, Keyword.LIMIT]);
	// }

	return null;
}

/**
 * Parses a summaryQuery object from the given array of tokens.
 */
function parseSummaryQuery(tokens: Token[]): SummaryQuery {
	let since, until: ISODate;
	[since, until, tokens] = parseQueryInterval(tokens);
	return null;
}

/**
 * Parses a listQuery object from the given array of tokens.
 */
function parseListQuery(tokens: Token[]): ListQuery {
	return null;
}

/**
 * Parses a from and to date from the given array of tokens.
 * @returns a list of two moment objects (from, to) and the remaining
 * tokens after consuming the required tokens for parsing the interval.
 */
export function parseQueryInterval(
	tokens: Token[]
): [since: ISODate, until: ISODate, tokens: Token[]] {
	let _since: moment.Moment = null;
	let _until: moment.Moment = null;

	let pos = 0;

	switch (tokens[pos]) {
		case Keyword.TODAY:
			_since = moment();
			tokens.splice(0, 1);
			break;
		case Keyword.WEEK:
			_since = moment().startOf('isoWeek');
			_until = moment().endOf('isoWeek');
			tokens.splice(0, 1);
			break;
		case Keyword.MONTH:
			_since = moment().startOf('month');
			_until = moment().endOf('month');
			tokens.splice(0, 1);
			break;
		case Keyword.FROM:
			// FROM
			_since = moment(tokens[pos + 1], ISODateFormat, true);
			if (!_since.isValid()) {
				throw new InvalidDateFormatError(Keyword.FROM, tokens[pos + 1]);
			}
			// TO
			if (tokens[pos + 2] != Keyword.TO) {
				throw new InvalidTokenError(tokens[pos + 2], [Keyword.TO]);
			}
			_until = moment(tokens[pos + 3], ISODateFormat, true);
			if (!_until.isValid()) {
				throw new InvalidDateFormatError(Keyword.TO, tokens[pos + 3]);
			}
			tokens.splice(0, 4);
			break;
		case Keyword.PREVIOUS:
			const accepted: Token[] = [Keyword.DAYS, Keyword.WEEKS, Keyword.MONTHS];
			if (typeof tokens[pos + 1] != 'number') {
				throw new InvalidTokenError(tokens[pos + 1], ['decimal number']);
			}
			if (!accepted.includes(tokens[pos + 2])) {
				throw new InvalidTokenError(tokens[pos + 2], accepted);
			}
			const span = tokens[pos + 1] as number;
			const unit = tokens[pos + 2];
			switch (unit) {
				case Keyword.DAYS:
					_until = moment();
					_since = moment().subtract(span - 1, 'days'); // sub 1 to include current day
					break;
				case Keyword.WEEKS:
					_until = moment().endOf('isoWeek');
					_since = moment()
						.startOf('isoWeek')
						.subtract(span - 1, 'weeks');
					break;
				case Keyword.MONTHS:
					_until = moment().endOf('month');
					_since = moment()
						.startOf('month')
						.subtract(span - 1, 'months');
					break;
			}

			tokens.splice(0, 3);
	}

	if (_since && _until && _until.diff(_since) < 0) {
		throw new InvalidIntervalError();
	}

	if (
		(_since && _until && _until.diff(_since, 'days') > 356) ||
		(_since && !_until && moment().diff(_since) > 356)
	) {
		throw new IntervalTooLargeError();
	}

	let since: ISODate = null;
	let until: ISODate = null;

	if (_since != null) {
		since = _since.format('YYYY-MM-DD');
	}

	if (_until != null) {
		until = _until.format('YYYY-MM-DD');
	}

	return [since, until, tokens];
}

export class QueryParseError extends Error {}

export class InvalidTokenError extends QueryParseError {
	constructor(token: Token, accepted: Token[]) {
		super(
			`Invalid token: "${token}". Accepted keywords at this position: ${accepted.join(
				', '
			)}`
		);
	}
}

export class InvalidDateFormatError extends QueryParseError {
	constructor(keyword: Token, received: Token) {
		super(
			`Cannot convert to valid date: "${received}". Keyword "${keyword}" must be followed by a ISO-formatted date. Example use: "FROM 2021-01-01 TO 2021-01-31"`
		);
	}
}

export class InvalidIntervalError extends QueryParseError {
	constructor() {
		super('The FROM date must be before or the same as the TO date.');
	}
}

export class IntervalTooLargeError extends QueryParseError {
	constructor() {
		super('Toggl only provides reports over time spans less than 1 year.');
	}
}
