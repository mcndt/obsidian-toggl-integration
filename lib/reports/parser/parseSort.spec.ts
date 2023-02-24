import { describe, beforeEach, test, expect } from "vitest";

import { Query, SortOrder } from "../ReportQuery";

import { Keyword, newQuery, Token } from "./Parser";
import { SortParser } from "./parseSort";

let test_query: Query;

describe("parseSort", () => {
  beforeEach(() => {
    test_query = newQuery();
  });

  test("Parse ascending order", () => {
    testParseSort({
      expectedSort: SortOrder.ASC,
      input: [Keyword.SORT, Keyword.ASC, "extra token"],
      query: test_query,
      remaining: ["extra token"],
    });
  });

  test("Parse descending order", () => {
    testParseSort({
      expectedSort: SortOrder.DESC,
      input: [Keyword.SORT, Keyword.DESC, "extra token"],
      query: test_query,
      remaining: ["extra token"],
    });
  });

  test("Fails on invalid order keyword", () => {
    testParseSort(
      {
        expectedSort: null,
        input: [Keyword.SORT, Keyword.WEEK, "extra token"],
        query: test_query,
        remaining: null,
      },
      /Invalid token/g,
    );
  });

  test("Fails on existing ordering", () => {
    test_query.sort = SortOrder.DESC;
    testParseSort(
      {
        expectedSort: null,
        input: [Keyword.SORT, Keyword.WEEK, "extra token"],
        query: test_query,
        remaining: null,
      },
      /A query can only contain a single "SORT" expression./g,
    );
  });
});

interface parseSortTestParams {
  input: Token[];
  query: Query;
  expectedSort: SortOrder;
  remaining: Token[];
}

function testParseSort(params: parseSortTestParams, expectedError?: RegExp) {
  const parser = new SortParser();

  if (expectedError == undefined) {
    expect(parser.parse(params.input, params.query)).toEqual<Token[]>(
      params.remaining,
    );

    expect(params.query.sort).toEqual(params.expectedSort);
  } else {
    expect(() => parser.parse(params.input, params.query)).toThrowError(
      expectedError,
    );
  }
}
