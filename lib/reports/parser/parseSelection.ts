import { Query, SelectionMode, tag } from "../ReportQuery";

import {
  InvalidTokenError,
  Keyword,
  Parser,
  QueryParseError,
  Token,
  UserInput,
} from "./Parser";
import parseList from "./parseList";

export class SelectionParser extends Parser {
  private static readonly _acceptedQualifiers: Token[] = [
    Keyword.PROJECTS,
    Keyword.CLIENTS,
    Keyword.TAGS,
  ];

  /**
   * Parses a selection statement from the tokens array and consumes tokens.
   * Results are added into the passed query object.
   *  @returns remaining tokens.
   *  @throws EvalError when parsing fails.
   */
  public parse(tokens: Token[], query: Query): Token[] {
    this.test(tokens, true);
    let _tokens = [...tokens];

    // Get selection mode
    let mode: SelectionMode;
    switch (_tokens[0]) {
      case Keyword.INCLUDE:
        mode = SelectionMode.INCLUDE;
        break;
      case Keyword.EXCLUDE:
        mode = SelectionMode.EXCLUDE;
        break;
    }
    _tokens.splice(0, 1);

    // Get qualifier
    const qualifier: Token = _tokens[0];
    if (!SelectionParser._acceptedQualifiers.includes(qualifier)) {
      throw new InvalidTokenError(
        qualifier,
        SelectionParser._acceptedQualifiers,
      );
    }
    _tokens.splice(0, 1);

    // Check for duplicate selection
    const duplicateProjectFilter =
      qualifier === Keyword.PROJECTS && query.projectSelection != null;
    const duplicateClientFilter =
      qualifier === Keyword.CLIENTS && query.clientSelection != null;
    if (duplicateProjectFilter || duplicateClientFilter) {
      throw new DuplicateSelectionExpression(qualifier);
    }

    // Check for duplicate tag filter
    const duplicateIncludedTags =
      qualifier === Keyword.TAGS &&
      mode === SelectionMode.INCLUDE &&
      query.includedTags;
    const duplicateExcludedTags =
      qualifier === Keyword.TAGS &&
      mode === SelectionMode.EXCLUDE &&
      query.excludedTags;
    if (duplicateIncludedTags || duplicateExcludedTags) {
      throw new DuplicateTagFilter(tokens[0] as Keyword, qualifier);
    }

    // Get selection list
    let list: UserInput[];
    try {
      [list, _tokens] = parseList(_tokens);
    } catch {
      throw new NoUserInputTokensError(mode, qualifier as Keyword);
    }

    // Add to query object
    switch (qualifier) {
      case Keyword.PROJECTS:
        query.projectSelection = { list, mode };
        break;
      case Keyword.CLIENTS:
        if (list.filter((v) => typeof v === "number").length > 0) {
          throw new QueryParseError(
            "Filtering by numeric client id is not currently supported.",
          );
        }
        query.clientSelection = { list, mode };
        break;
      case Keyword.TAGS:
        if (mode === SelectionMode.INCLUDE) {
          query.includedTags = list as tag[];
        } else if (mode === SelectionMode.EXCLUDE) {
          query.excludedTags = list as tag[];
        }
        break;
    }

    return _tokens;
  }

  get _acceptedTokens(): Token[] {
    return [Keyword.INCLUDE, Keyword.EXCLUDE];
  }
}

class NoUserInputTokensError extends QueryParseError {
  constructor(mode: SelectionMode, qualifier: Keyword) {
    super(
      `"${mode} ${qualifier}" must be followed by at least one item. For example: 'INCLUDE PROJECTS "project A", 12345678, "Project C"'`,
    );
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NoUserInputTokensError.prototype);
  }
}

class DuplicateSelectionExpression extends QueryParseError {
  constructor(qualifier: Keyword) {
    super(
      `A query can only contain a single selection expression for keyword "${qualifier}"`,
    );
  }
}

class DuplicateTagFilter extends QueryParseError {
  constructor(selectionMode: Keyword, qualifier: Keyword) {
    super(
      `A query can only contain one "${selectionMode}" expression for "${qualifier}".`,
    );
  }
}
