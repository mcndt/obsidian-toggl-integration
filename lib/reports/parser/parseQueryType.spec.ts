import { describe, beforeEach, test, expect } from "vitest";

import { Query, QueryType } from "../ReportQuery";

import { Keyword, newQuery, Token } from "./Parser";
import { QueryTypeParser } from "./parseQueryType";

let test_query: Query;

describe("parseQueryType", () => {
  beforeEach(() => {
    test_query = newQuery();
  });

  test('Parse type "SUMMARY"', () => {
    testParseQueryType({
      expectedType: QueryType.SUMMARY,
      input: [Keyword.SUMMARY, "extra_token"],
      query: test_query,
      remaining: ["extra_token"],
    });
  });

  test('Parse type "LIST"', () => {
    testParseQueryType({
      expectedType: QueryType.LIST,
      input: [Keyword.LIST, "extra_token"],
      query: test_query,
      remaining: ["extra_token"],
    });
  });

  test("fails on invalid token at query head", () => {
    testParseQueryType(
      {
        expectedType: null,
        input: [Keyword.WEEK, "extra_token"],
        query: test_query,
        remaining: null,
      },
      /Invalid token/g,
    );
  });
});

interface parseQueryTypeTestParams {
  input: Token[];
  query: Query;
  expectedType: QueryType;
  remaining: Token[];
}

function testParseQueryType(
  params: parseQueryTypeTestParams,
  expectedError?: RegExp,
) {
  const parser = new QueryTypeParser();

  if (expectedError == undefined) {
    expect(parser.parse(params.input, params.query)).toEqual<Token[]>(
      params.remaining,
    );

    expect(params.query.type).toEqual(params.expectedType);
  } else {
    expect(() => parser.parse(params.input, params.query)).toThrowError(
      expectedError,
    );
  }
}
