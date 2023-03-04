import { GroupBy, Query, QueryType } from "../ReportQuery";

import {
  InvalidTokenError,
  Keyword,
  Parser,
  QueryParseError,
  Token,
} from "./Parser";

export class GroupByParser extends Parser {
  private static readonly _acceptedGroupings = [
    Keyword.DATE,
    Keyword.PROJECT,
    Keyword.CLIENT,
  ];

  public parse(tokens: Token[], query: Query): Token[] {
    this.test(tokens, true);
    if (tokens[1] !== Keyword.BY) {
      throw new InvalidTokenError(tokens[1], [Keyword.BY]);
    }

    if (query.groupBy) {
      throw new DuplicateGroupByExpressionError();
    }

    if (query.type !== QueryType.LIST) {
      throw new QueryParseError(
        '"GROUP BY" can only be used on "LIST" queries.',
      );
    }

    const _tokens = [...tokens];

    switch (_tokens[2]) {
      case Keyword.DATE:
        query.groupBy = GroupBy.DATE;
        break;
      case Keyword.PROJECT:
        query.groupBy = GroupBy.PROJECT;
        break;
      case Keyword.CLIENT:
        query.groupBy = GroupBy.CLIENT;
        break;
      default:
        throw new InvalidTokenError(
          _tokens[2],
          GroupByParser._acceptedGroupings,
        );
    }

    return _tokens.slice(3);
  }
  get _acceptedTokens(): Token[] {
    return [Keyword.GROUP];
  }
}

class DuplicateGroupByExpressionError extends QueryParseError {
  constructor() {
    super('A query can only contain a single "GROUP BY" expression.');
  }
}
