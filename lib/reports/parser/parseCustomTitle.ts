import type { Query } from "../ReportQuery";

import { Keyword, Parser, QueryParseError, Token, UserInput } from "./Parser";
import parseList from "./parseList";

export class CustomTitleParser extends Parser {
  public parse(tokens: Token[], query: Query): Token[] {
    this.test(tokens, true);
    if (query.customTitle) {
      throw new QueryParseError(
        `Cannot define two titles for the same report! Title is already set:  
        "${query.customTitle}"`,
      );
    }

    let _tokens = [...tokens.slice(1)];

    let list: UserInput[];

    try {
      [list, _tokens] = parseList(_tokens, 1);
    } catch (err) {
      throw new QueryParseError(
        '"TITLE" must be followed by a string wrapped in double quotes. For example: \'TITLE "Work Projects"\'',
      );
    }

    query.customTitle = list[0] as string;

    return _tokens;
  }
  get _acceptedTokens(): Token[] {
    return [Keyword.TITLE];
  }
}
