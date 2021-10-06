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

export type UserInput = string | number;
export type Token = Keyword | UserInput;

/**
 * @param query query string
 * @returns query split into list of keyword tokens and user-generated strings.
 */
export function tokenize(query: string): Token[] {
	// split into array of tokens
	let match = query.match(/(?:[^\s"',]+|"[^"]*"|'[^']*')+/g);
	match = match || [];

	// only use double quotes to signify user-strings
	for (const i in match) {
		match[i] = match[i].replace(/[']+/g, '"');
	}

	// Validate tokens
	const results: Token[] = [];
	for (const token of match) {
		if (
			!(token.toUpperCase() in Keyword) && // a keyword
			!/".*"/g.test(token) && // a string
			!/\d{4}-\d{2}-\d{2}/g.test(token) && // a ISO-formatted date
			!/^\d+$/g.test(token)
		) {
			throw new UnknownKeywordError(token);
		}

		if (/^\d+$/g.test(token)) {
			// Convert to number type
			results.push(parseInt(token));
		} else if (!/".*"/g.test(token)) {
			// Uppercase all non-string tokens for normalization
			results.push(token.toUpperCase());
		} else {
			results.push(token);
		}
	}

	return results;
}

export class UnknownKeywordError extends Error {
	constructor(received: Token) {
		super(
			`"${received}" is not a keyword, ISO-formatted date, decimal number or string. Hint: strings must be wrapped in quotation marks, dates must be formatted as YYYY-MM-DD and numbers should have no leading zeros.`
		);
	}
}
