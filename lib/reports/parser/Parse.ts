import type { Query } from '../ReportQuery';

import {
	CombinedParser,
	InvalidTokenError,
	newQuery,
	QueryParseError,
	Token
} from './Parser';
import { tokenize } from './Tokenize';
import { QueryTypeParser } from './parseQueryType';
import { QueryIntervalParser } from './parseQueryInterval';
import { SelectionParser } from './parseSelection';
import { SortParser } from './parseSort';
import { GroupByParser } from './parseGroupBy';

/**
 * @param tokens list of keyword tokens part of a query.
 * @returns a query object containing required information for fullfilling
 *          the request.
 */
export function parse(queryString: string): Query {
	let tokens = tokenize(queryString);
	let query = newQuery();

	// Expression 1: Query Type
	tokens = new QueryTypeParser().parse(tokens, query);

	// Expression 2: Query Interval
	tokens = new QueryIntervalParser().parse(tokens, query);

	// Expression 3: Inclusion/exclusion expressions
	const selectionParser = new SelectionParser();
	while (selectionParser.test(tokens)) {
		tokens = selectionParser.parse(tokens, query);
	}

	// Expression 4: Grouping and Sorting
	const groupSortParser = new CombinedParser([
		new SortParser(),
		new GroupByParser()
	]);
	while (groupSortParser.test(tokens)) {
		tokens = groupSortParser.parse(tokens, query);
	}

	// Expression 5: Configure rendered result
	// TODO

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
