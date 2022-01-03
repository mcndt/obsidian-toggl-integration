import { Query, QueryType } from '../ReportQuery';
import { InvalidTokenError, Keyword, Token } from './Parser';

/**
 * Parses the query type from a list of query tokens.
 * @returns remaining tokens.
 */
export default function parseQueryType(tokens: Token[], query: Query): Token[] {
	const queryTypeToken = tokens[0];

	const accepted_types: Token[] = [Keyword.SUMMARY, Keyword.LIST];

	if (!accepted_types.includes(queryTypeToken)) {
		throw new InvalidTokenError(queryTypeToken, accepted_types);
	}

	switch (queryTypeToken) {
		case Keyword.SUMMARY:
			query.type = QueryType.SUMMARY;
			break;
		case Keyword.LIST:
			query.type = QueryType.LIST;
			break;
	}

	// return copy
	return [...tokens].slice(1);
}
