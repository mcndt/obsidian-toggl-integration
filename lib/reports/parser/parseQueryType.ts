import { Query, QueryType } from '../ReportQuery';
import { Keyword, Parser, Token } from './Parser';

export class QueryTypeParser extends Parser {
	/**
	 * Parses the query type from a list of query tokens.
	 * @returns remaining tokens.
	 */
	public parse(tokens: Token[], query: Query): Token[] {
		this.test(tokens, true);

		const queryTypeToken = tokens[0];

		switch (queryTypeToken) {
			case Keyword.SUMMARY:
				query.type = QueryType.SUMMARY;
				break;
			case Keyword.LIST:
				query.type = QueryType.LIST;
				break;
		}

		return [...tokens].slice(1);
	}

	get _acceptedTokens() {
		return [Keyword.SUMMARY, Keyword.LIST];
	}
}
