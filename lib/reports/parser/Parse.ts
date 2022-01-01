import { ListQuery, Query, QueryType, SummaryQuery } from '../ReportQuery';
import { SelectionMode } from '../ReportQuery';

import moment from 'moment';
import { Keyword, Token, tokenize, UserInput } from './Tokenize';

/** Date string formatted as YYYY-MM-DD */
export type ISODate = string;
export const ISODateFormat = 'YYYY-MM-DD';

/**
 * @param tokens list of keyword tokens part of a query.
 * @returns a query object containing required information for fullfilling
 *          the request.
 */
export function parse(queryString: string): Query {
	let query: Query;
	let tokens = tokenize(queryString);

	// Parse query type
	const queryTypeToken = tokens.splice(0, 1)[0];
	const accepted_types: Token[] = [Keyword.SUMMARY, Keyword.LIST];

	if (!accepted_types.includes(queryTypeToken)) {
		throw new InvalidTokenError(queryTypeToken, accepted_types);
	}

	let queryType: QueryType;
	if (queryTypeToken === Keyword.SUMMARY) {
		queryType = QueryType.SUMMARY;
	} else if (queryTypeToken === Keyword.LIST) {
		queryType = QueryType.LIST;
	}

	// Parse time interval expression
	let since, until: ISODate;
	[since, until, tokens] = parseQueryInterval(tokens);

	if (since == null && until == null) {
		throw new NoTimeIntervalExpression();
	}
	query = { type: queryType, from: since, to: until };

	// Parse inclusion/exclusion statements

	const selection_keywords: Token[] = [Keyword.INCLUDE, Keyword.EXCLUDE];
	let parsedAllSelections = false;

	while (!parsedAllSelections) {
		if (selection_keywords.includes(tokens[0])) {
			if (
				selection_keywords.includes(tokens[0]) &&
				tokens[1] == Keyword.PROJECTS &&
				query.projectSelection
			) {
				throw new DuplicateSelectionExpression(tokens[1]);
			}
			tokens = parseSelection(tokens, query);
		} else {
			parsedAllSelections = true;
		}
	}

	return query;
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

/**
 * Parses a selection statement from the tokens array and consumes tokens.
 * Results are added into the passed query object.
 *  @returns remaining tokens.
 *  @throws EvalError when parsing fails.
 */
export function parseSelection(tokens: Token[], query: Query): Token[] {
	// Get selection mode
	let mode: SelectionMode;
	switch (tokens[0]) {
		case Keyword.INCLUDE:
			mode = SelectionMode.INCLUDE;
			break;
		case Keyword.EXCLUDE:
			mode = SelectionMode.EXCLUDE;
			break;
		default:
			throw new InvalidTokenError(tokens[0], [
				Keyword.INCLUDE,
				Keyword.EXCLUDE
			]);
	}
	tokens.splice(0, 1);

	// Get qualifier
	const qualifier: Token = tokens[0];
	const accepted_qualifiers = [Keyword.PROJECTS] as Token[];
	if (!accepted_qualifiers.includes(qualifier)) {
		throw new InvalidTokenError(qualifier, accepted_qualifiers);
	}
	tokens.splice(0, 1);

	// Get selection list
	let list: UserInput[];
	try {
		[list, tokens] = parseList(tokens);
	} catch {
		throw new NoUserInputTokensError(mode, qualifier as Keyword);
	}

	// Add to query object
	switch (qualifier) {
		case Keyword.PROJECTS:
			query.projectSelection = { mode, list };
	}

	return tokens;
}

/**
 * Parses a list of subsequent UserInput tokens from the passed
 * tokens array and returns the remaining tokens sequence. Parsed
 * tokens are consumed in the process.
 * @returns List of parsed UserInput tokens and remaining tokens.
 * @throws EvalError when no UserInput tokens are present at the head
 * of the tokens array.
 */
export function parseList(
	tokens: Token[]
): [list: UserInput[], remaining: Token[]] {
	const list: UserInput[] = [];

	while (tokens.length > 0) {
		if (tokens[0] in Keyword) break;
		if (typeof tokens[0] == 'string' && tokens[0][0] == '"') {
			list.push(tokens[0].slice(1, -1));
		} else {
			list.push(tokens[0]);
		}
		tokens.splice(0, 1);
	}

	if (list.length == 0) {
		throw new EvalError('No UserInput tokens at head of tokens array.');
	}
	return [list, tokens];
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

export class NoUserInputTokensError extends QueryParseError {
	constructor(mode: SelectionMode, qualifier: Keyword) {
		super(
			`"${mode} ${qualifier}" must be followed by at least one item. For example: 'INCLUDE PROJECTS "project A", 12345678, "Project C"'`
		);
		// Set the prototype explicitly.
		Object.setPrototypeOf(this, NoUserInputTokensError.prototype);
	}
}

export class NoTimeIntervalExpression extends QueryParseError {
	constructor() {
		super(`Query must include a time interval expression. Available expressions: 
		"${Keyword.TODAY}", 
		"${Keyword.WEEK}", 
		"${Keyword.MONTH}", 
		"${Keyword.PREVIOUS} ... ${Keyword.DAYS}/${Keyword.WEEKS}/${Keyword.MONTHS}", 
		"${Keyword.FROM} ... ${Keyword.TO} ..."`);
	}
}

export class DuplicateSelectionExpression extends QueryParseError {
	constructor(qualifier: Keyword) {
		super(
			`A query can only contain a single selection expression for keyword "${qualifier}"`
		);
	}
}
