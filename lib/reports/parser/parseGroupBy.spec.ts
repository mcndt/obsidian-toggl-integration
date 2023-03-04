import { describe, beforeEach, test, expect } from "vitest";

import { GroupBy, Query, QueryType } from "../ReportQuery";

import { Keyword, newQuery, Token } from "./Parser";
import { GroupByParser } from "./parseGroupBy";

let test_query: Query;

describe("parseGroupBy", () => {
  beforeEach(() => {
    test_query = newQuery();
    test_query.type = QueryType.LIST;
  });

  test("Group by date", () => {
    testGroupBy({
      expectedGroupBy: GroupBy.DATE,
      input: [Keyword.GROUP, Keyword.BY, Keyword.DATE, "extra token"],
      query: test_query,
      remaining: ["extra token"],
    });
  });

  test("Group by project", () => {
    testGroupBy({
      expectedGroupBy: GroupBy.PROJECT,
      input: [Keyword.GROUP, Keyword.BY, Keyword.PROJECT, "extra token"],
      query: test_query,
      remaining: ["extra token"],
    });
  });

  test("Group by client", () => {
    testGroupBy({
      expectedGroupBy: GroupBy.CLIENT,
      input: [Keyword.GROUP, Keyword.BY, Keyword.CLIENT, "extra token"],
      query: test_query,
      remaining: ["extra token"],
    });
  });

  test("Fails on unknown group keyword", () => {
    testGroupBy(
      {
        expectedGroupBy: null,
        input: [Keyword.GROUP, Keyword.BY, Keyword.WEEK, "extra token"],
        query: test_query,
        remaining: null,
      },
      /Invalid token/g,
    );
  });

  test("Fails on duplicate expression", () => {
    test_query.groupBy = GroupBy.DATE;
    testGroupBy(
      {
        expectedGroupBy: null,
        input: [Keyword.GROUP, Keyword.BY, Keyword.PROJECT, "extra token"],
        query: test_query,
        remaining: null,
      },
      /A query can only contain a single "GROUP BY" expression./g,
    );
  });

  test("Fails on incompatible query type", () => {
    test_query.type = QueryType.SUMMARY;
    testGroupBy(
      {
        expectedGroupBy: null,
        input: [Keyword.GROUP, Keyword.BY, Keyword.PROJECT, "extra token"],
        query: test_query,
        remaining: null,
      },
      /"GROUP BY" can only be used on "LIST" queries./g,
    );
  });
});

interface parseGroupByTestParams {
  input: Token[];
  query: Query;
  expectedGroupBy: GroupBy;
  remaining: Token[];
}

function testGroupBy(params: parseGroupByTestParams, expectedError?: RegExp) {
  const parser = new GroupByParser();

  if (expectedError == undefined) {
    expect(parser.parse(params.input, params.query)).toEqual<Token[]>(
      params.remaining,
    );

    expect(params.query.groupBy).toEqual(params.expectedGroupBy);
  } else {
    expect(() => parser.parse(params.input, params.query)).toThrowError(
      expectedError,
    );
  }
}
