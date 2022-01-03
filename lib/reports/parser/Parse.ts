import type { Query } from '../ReportQuery';

import { newQuery } from './Parser';
import { tokenize } from './Tokenize';
import parseQueryType from './parseQueryType';
import parseQueryInterval from './parseQueryInterval';
import parseSelection from './parseSelection';

/**
 * @param tokens list of keyword tokens part of a query.
 * @returns a query object containing required information for fullfilling
 *          the request.
 */
export function parse(queryString: string): Query {
	let tokens = tokenize(queryString);
	let query = newQuery();

	tokens = parseQueryType(tokens, query);
	tokens = parseQueryInterval(tokens, query);

	// Parse inclusion/exclusion statements
	while (tokens.length > 0) {
		tokens = parseSelection(tokens, query);
	}

	return query;
}
