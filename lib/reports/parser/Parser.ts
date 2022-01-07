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
	PAST = 'PAST',
	DAYS = 'DAYS',
	WEEKS = 'WEEKS',
	MONTHS = 'MONTHS',
	FROM = 'FROM',
	TO = 'TO',

	// inclusion/exclusion keywords
	INCLUDE = 'INCLUDE',
	EXCLUDE = 'EXCLUDE',
	PROJECTS = 'PROJECTS',
	CLIENTS = 'CLIENTS',

	// Group lists by
	GROUP = 'GROUP',
	BY = 'BY',
	DATE = 'DATE',
	PROJECT = 'PROJECT',

	// Sort lists by
	SORT = 'SORT',
	ASC = 'ASC',
	DESC = 'DESC',

	// Customize report
	TITLE = 'TITLE'
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

export abstract class Parser {
	/**
	 * Takes a list of tokens and tries to consume them, adding data to the query
	 * reference passed. If parsed successfully, The parser returns a list of remaining tokens.
	 */
	public abstract parse(tokens: Token[], query: Query): Token[];

	/**
	 * Check whether the token list is parsable by a parser.
	 * The passed query will NOT be mutated by this test.
	 * @param throws if true, will throw an InvalidTokenError instead of returning false.
	 * @returns false if parser throws an exception, true otherwise.
	 */
	public test(tokens: Token[], throws = false): boolean {
		const success = this._acceptedTokens.includes(tokens[0]);
		if (!success && throws) {
			throw new InvalidTokenError(tokens[0], this._acceptedTokens);
		}
		return success;
	}

	/**
	 * List of accepted tokens at the head of the query stream.
	 */
	abstract get _acceptedTokens(): Token[];
}

/**
 * Parses tokens with the first parser that accepts the token stream head.
 */
export class CombinedParser extends Parser {
	private _parsers: Parser[];

	/**
	 * @param parsers Parsers to decode tokens with.
	 */
	constructor(parsers: Parser[]) {
		super();
		this._parsers = parsers;
	}

	public parse(tokens: Token[], query: Query): Token[] {
		this.test(tokens, true);
		const _tokens = [...tokens];

		for (const parser of this._parsers) {
			if (parser.test(_tokens)) {
				return parser.parse(_tokens, query);
			}
		}
	}

	get _acceptedTokens(): Token[] {
		const tokens: Token[] = [];
		for (const parser of this._parsers) {
			tokens.push(...parser._acceptedTokens);
		}
		return tokens;
	}
}

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
