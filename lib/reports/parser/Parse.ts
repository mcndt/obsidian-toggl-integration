import type { Query } from '../ReportQuery';

import { InvalidTokenError, newQuery, QueryParseError, Token } from './Parser';
import { tokenize } from './Tokenize';
import { QueryTypeParser } from './parseQueryType';
import parseQueryInterval from './parseQueryInterval';
import { SelectionParser } from './parseSelection';

/**
 * @param tokens list of keyword tokens part of a query.
 * @returns a query object containing required information for fullfilling
 *          the request.
 */
export function parse(queryString: string): Query {
	let tokens = tokenize(queryString);
	let query = newQuery();

	tokens = new QueryTypeParser().parse(tokens, query);
	tokens = parseQueryInterval(tokens, query);

	// Parse inclusion/exclusion statements
	const selectionParser = new SelectionParser();
	while (selectionParser.test(tokens)) {
		tokens = selectionParser.parse(tokens, query);
	}

	if (tokens.length > 0) {
		throw new TooManyTokensError(tokens[0]);
	}

	return query;
}

class TooManyTokensError extends QueryParseError {
	constructor(token: Token) {
		super(
			`Invalid token at end of query: "${token}". Perhaps the expression order is incorrect, or the query contains a typo.`
		);
	}
}
