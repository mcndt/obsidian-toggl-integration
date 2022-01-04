import { Query, SortOrder } from '../ReportQuery';
import {
	InvalidTokenError,
	Keyword,
	Parser,
	QueryParseError,
	Token
} from './Parser';

export class SortParser extends Parser {
	public parse(tokens: Token[], query: Query): Token[] {
		this.test(tokens, true);
		if (query.sort) {
			throw new DuplicateSortExpressionError();
		}
		const _tokens = [...tokens];

		switch (_tokens[1]) {
			case Keyword.ASC:
				query.sort = SortOrder.ASC;
				break;
			case Keyword.DESC:
				query.sort = SortOrder.DESC;
				break;
			default:
				throw new InvalidTokenError(_tokens[1], [Keyword.ASC, Keyword.DESC]);
		}

		return _tokens.slice(2);
	}

	get _acceptedTokens(): Token[] {
		return [Keyword.SORT];
	}
}

class DuplicateSortExpressionError extends QueryParseError {
	constructor() {
		super('A query can only contain a single "SORT" expression.');
	}
}
