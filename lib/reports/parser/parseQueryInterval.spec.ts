import { describe, beforeEach, test, expect, vi, afterEach, it } from "vitest";

import type { ISODate } from "../ReportQuery";

import { Keyword, newQuery, Token } from "./Parser";
import { QueryIntervalParser } from "./parseQueryInterval";

const CURRENT_DATE = "2020-01-31";
const CURRENT_WEEK_SINCE = "2020-01-27";
const CURRENT_WEEK_UNTIL = "2020-02-02";
const CURRENT_MONTH_SINCE = "2020-01-01";
const CURRENT_MONTH_UNTIL = "2020-01-31";

/* MOCKS */
let test_date: ISODate;

describe("parseQueryInterval (relative intervals)", () => {
  /*
	Cases:
	- TODAYS
	- WEEK 
	- MONTH
	- PAST ... DAYS
	- PAST ... WEEKS
	- PAST ... MONTHS
	*/
  beforeEach(() => {
    test_date = CURRENT_DATE;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("Today", () => {
    testParseQueryInterval(
      {
        from: CURRENT_DATE,
        input: [Keyword.TODAY, "extra_token"],
        remaining: ["extra_token"],
        until: null,
      },
      test_date,
    );
  });

  test("Week", () => {
    testParseQueryInterval(
      {
        from: CURRENT_WEEK_SINCE,
        input: [Keyword.WEEK, "extra_token"],
        remaining: ["extra_token"],
        until: CURRENT_WEEK_UNTIL,
      },
      test_date,
    );
  });

  test("Month (Jan)", () => {
    testParseQueryInterval(
      {
        from: CURRENT_MONTH_SINCE,
        input: [Keyword.MONTH, "extra_token"],
        remaining: ["extra_token"],
        until: CURRENT_MONTH_UNTIL,
      },
      test_date,
    );
  });

  test("Month (Feb)", () => {
    test_date = "2020-02-04";

    testParseQueryInterval(
      {
        from: "2020-02-01",
        input: [Keyword.MONTH, "extra_token"],
        remaining: ["extra_token"],
        until: "2020-02-29",
      },
      test_date,
    );
  });

  test('"PAST 10 DAYS" includes the last ten days', () => {
    test_date = "2020-01-10";

    testParseQueryInterval(
      {
        from: "2020-01-01",
        input: [Keyword.PAST, 10, Keyword.DAYS, "extra_token"],
        remaining: ["extra_token"],
        until: "2020-01-10",
      },
      test_date,
    );
  });

  test('"PREVOUS 3 WEEKS" includes current and past two weeks', () => {
    test_date = "2020-02-01";

    testParseQueryInterval(
      {
        from: "2020-01-13",
        input: [Keyword.PAST, 3, Keyword.WEEKS, "extra_token"],
        remaining: ["extra_token"],
        until: "2020-02-02",
      },
      test_date,
    );
  });

  test('"PREVOUS 3 MONTHS" includes current and past two months', () => {
    test_date = "2020-01-28";

    testParseQueryInterval(
      {
        from: "2019-11-01",
        input: [Keyword.PAST, 3, Keyword.MONTHS, "extra_token"],
        remaining: ["extra_token"],
        until: "2020-01-31",
      },
      test_date,
    );
  });

  it("fails for relative window without decimal number", () => {
    testParseQueryInterval(
      {
        from: null,
        input: [Keyword.PAST, "ten", Keyword.DAYS, "extra_token"],
        remaining: null,
        until: null,
      },
      test_date,

      /Invalid token/g,
    );
  });

  it("fails for relative window with invalid unit size", () => {
    testParseQueryInterval(
      {
        from: null,
        input: [Keyword.PAST, "ten", Keyword.TODAY, "extra_token"],
        remaining: null,
        until: null,
      },
      test_date,

      /Invalid token/g,
    );
  });

  it("fails for intervals larger than 365 days", () => {
    test_date = "2020-01-01";

    testParseQueryInterval(
      {
        from: null,
        input: [Keyword.PAST, 368, Keyword.DAYS, "extra_token"],
        remaining: null,
        until: null,
      },
      test_date,

      /Toggl only provides reports over time spans less than 1 year./g,
    );
  });
});

describe("parseQueryInterval (absolute intervals)", () => {
  /*
	Cases:
	- FROM ... TO ...
	- FROM ...
	*/

  test("Date range (ISO format)", () => {
    const from = "2020-01-01";
    const to = "2020-02-01";
    testParseQueryInterval(
      {
        from: from,
        input: [Keyword.FROM, from, Keyword.TO, to, "extra_token"],
        remaining: ["extra_token"],
        until: to,
      },
      test_date,
    );
  });

  it('fails on invalid date format following "FROM" keyword', () => {
    const from = "01/01/2020";
    const to = "2020-02-01";
    testParseQueryInterval(
      {
        from: "2020-01-01",
        input: [Keyword.FROM, from, Keyword.TO, to, "extra_token"],
        remaining: ["extra_token"],
        until: to,
      },
      test_date,

      /Cannot convert to valid date: "01\/01\/2020"/gm,
    );
  });

  it('fails on invalid date format following "TO" keyword', () => {
    const from = "2020-01-01";
    const to = "01/02/2020";
    testParseQueryInterval(
      {
        from: from,
        input: [Keyword.FROM, from, Keyword.TO, to, "extra_token"],
        remaining: ["extra_token"],
        until: "2020-02-01",
      },
      test_date,

      /Cannot convert to valid date: "01\/02\/2020"/gm,
    );
  });

  it("fails on a negative duration time interval", () => {
    const from = "2020-01-01";
    const to = "2019-12-02";
    testParseQueryInterval(
      {
        from: null,
        input: [Keyword.FROM, from, Keyword.TO, to, "extra_token"],
        remaining: null,
        until: null,
      },
      test_date,
      /The FROM date must be before/gm,
    );
  });

  it("fails for intervals larger than 365 days", () => {
    testParseQueryInterval(
      {
        from: null,
        input: [
          Keyword.FROM,
          "2019-01-01",
          Keyword.TO,
          "2020-01-03",
          "extra_token",
        ],
        remaining: null,
        until: null,
      },
      test_date,
      /Toggl only provides reports over time spans less than 1 year./g,
    );
  });
});

interface IntervalParseTestParams {
  input: Token[];
  from: ISODate;
  until: ISODate;
  remaining: Token[];
}

function testParseQueryInterval(
  params: IntervalParseTestParams,
  test_date: string,
  expectedError?: RegExp,
): void {
  vi.setSystemTime(test_date);
  const query = newQuery();
  const parser = new QueryIntervalParser();
  if (expectedError == undefined) {
    expect(parser.parse(params.input, query)).toEqual<Token[]>(
      params.remaining,
    );
    expect(query.from).toEqual(params.from);
    expect(query.to).toEqual(params.until);
  } else {
    expect(() => parser.parse(params.input, query)).toThrowError(expectedError);
  }
}
