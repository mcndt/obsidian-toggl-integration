import moment from "moment";
import { describe, beforeEach, test, expect, vi, afterEach } from "vitest";

import {
  Query,
  SelectionMode,
  ISODate,
  SortOrder,
  GroupBy,
} from "../ReportQuery";

import { parse } from "./Parse";


/* CONSTANTS */
const CURRENT_DATE = "2020-01-31";
const CURRENT_WEEK_SINCE = "2020-01-27";
const CURRENT_WEEK_UNTIL = "2020-02-02";

/* MOCKS */
let test_date: ISODate = null;

describe("parse", () => {
  beforeEach(() => {
    test_date = CURRENT_DATE;
    vi.useFakeTimers();
    vi.setSystemTime(moment(test_date, "YYYY-MM-DD").toDate());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("TC-01 (preset relative time interval)", () => {
    testParse({
      expected: {
        from: CURRENT_WEEK_SINCE,
        to: CURRENT_WEEK_UNTIL,
      } as Query,
      queryString: "SUMMARY WEEK",
    });
  });

  test("TC-02a (Absolute time interval)", () => {
    testParse({
      expected: {
        from: "2020-01-01",
        to: "2020-03-01",
      } as Query,
      queryString: `SUMMARY FROM 2020-01-01 TO 2020-03-01`,
    });
  });

  test("TC-02b (fails on negative absolute time interval)", () => {
    testParse(
      {
        expected: null,
        queryString: `SUMMARY FROM 2020-03-01 TO 2020-01-01`,
      },
      /The FROM date must be before/g,
    );
  });

  test("TC-02c (fails on malformed date formatting)", () => {
    testParse(
      {
        expected: null,
        queryString: `SUMMARY FROM 2020-3-1 TO 2020-1-1`,
      },
      /is not a keyword/g,
    );
  });

  test("TC-02d (fails on missing time interval)", () => {
    testParse(
      {
        expected: null,
        queryString: `SUMMARY`,
      },
      /Query must include a time interval expression/g,
    );
  });

  test("TC-02e (fails on time interval larger than 1 year)", () => {
    testParse(
      {
        expected: null,
        queryString: `SUMMARY PAST 400 DAYS`,
      },
      /Toggl only provides reports over time spans less than 1 year/g,
    );
  });

  test("TC-02f (Relative time interval)", () => {
    testParse({
      expected: {
        from: "2020-01-22",
        to: "2020-01-31",
      } as Query,
      queryString: `SUMMARY PAST 10 DAYS`,
    });
  });

  test("TC-03a (include projects (string or integer id))", () => {
    testParse({
      expected: {
        from: "2020-01-22",
        projectSelection: {
          list: ["project A", 123456789],
          mode: SelectionMode.INCLUDE,
        },
        to: "2020-01-31",
      } as Query,
      queryString: `SUMMARY PAST 10 DAYS INCLUDE PROJECTS 'project A', 123456789`,
    });
  });

  test("TC-03b (Fails on contradicting selection statements)", () => {
    testParse(
      {
        expected: null,
        queryString: `SUMMARY PAST 10 DAYS INCLUDE PROJECTS 'project A', 123456789 EXCLUDE PROJECTS 'project B'`,
      },
      /query can only contain a single selection expression for keyword/g,
    );
  });

  test("TC-03c (Fails on double selection statement)", () => {
    testParse(
      {
        expected: null,
        queryString: `SUMMARY PAST 10 DAYS INCLUDE CLIENTS 'project A', 'project C' INCLUDE CLIENTS 'project B'`,
      },
      /query can only contain a single selection expression for keyword/g,
    );
  });

  test("TC-03d (Fails on unknown selection qualifier)", () => {
    testParse(
      {
        expected: null,
        queryString: `SUMMARY PAST 10 DAYS INCLUDE WEEKS 'project A', 123456789`,
      },
      /Invalid token/g,
    );
  });

  test("TC-03e (select over projects and clients)", () => {
    testParse({
      expected: {
        clientSelection: {
          list: ["Client B"],
          mode: SelectionMode.EXCLUDE,
        },
        from: "2020-01-22",
        projectSelection: {
          list: ["project A", 123456789],
          mode: SelectionMode.INCLUDE,
        },
        to: "2020-01-31",
      } as Query,
      queryString: `SUMMARY PAST 10 DAYS INCLUDE PROJECTS 'project A', 123456789 EXCLUDE CLIENTS "Client B"`,
    });
  });

  test("TC-04 (Fails on unexpected token at the end of the query)", () => {
    testParse(
      {
        expected: null,
        queryString: `SUMMARY PAST 10 DAYS "unexpected_token"`,
      },
      /Invalid token at end of query: ""unexpected_token""/g,
    );
  });

  test("TC-05a (Sort ascending)", () => {
    testParse({
      expected: {
        from: "2020-01-22",
        sort: SortOrder.ASC,
        to: "2020-01-31",
      } as Query,
      queryString: `LIST PAST 10 DAYS SORT ASC`,
    });
  });

  test("TC-05b (Fails on double sort expression)", () => {
    testParse(
      {
        expected: null,
        queryString: `LIST PAST 10 DAYS SORT ASC SORT DESC`,
      },
      /A query can only contain a single "SORT" expression/g,
    );
  });

  test("TC-05c (Group by date)", () => {
    testParse({
      expected: {
        from: "2020-01-22",
        groupBy: GroupBy.DATE,
        to: "2020-01-31",
      } as Query,
      queryString: `LIST PAST 10 DAYS GROUP BY DATE`,
    });
  });

  test("TC-05d (Fails on double group by expression)", () => {
    testParse(
      {
        expected: null,
        queryString: `LIST PAST 10 DAYS GROUP BY DATE GROUP BY PROJECT`,
      },
      /A query can only contain a single "GROUP BY" expression/g,
    );
  });

  test("TC-05e (Group by fails on incompatible type expression)", () => {
    testParse(
      {
        expected: null,
        queryString: `SUMMARY PAST 10 DAYS GROUP BY DATE`,
      },
      /"GROUP BY" can only be used on "LIST" queries./g,
    );
  });

  test("TC-05f (Group by date after sort)", () => {
    testParse({
      expected: {
        from: "2020-01-22",
        groupBy: GroupBy.DATE,
        sort: SortOrder.ASC,
        to: "2020-01-31",
      } as Query,
      queryString: `LIST PAST 10 DAYS SORT ASC GROUP BY DATE`,
    });
  });

  test("TC-05g (Sort after group by)", () => {
    testParse({
      expected: {
        from: "2020-01-22",
        groupBy: GroupBy.PROJECT,
        sort: SortOrder.DESC,
        to: "2020-01-31",
      } as Query,
      queryString: `LIST PAST 10 DAYS GROUP BY PROJECT SORT DESC`,
    });
  });

  test("TC-06a (Custom title)", () => {
    testParse({
      expected: {
        customTitle: "My report",
        from: "2020-01-22",
        sort: SortOrder.DESC,
        to: "2020-01-31",
      } as Query,
      queryString: `LIST PAST 10 DAYS SORT DESC TITLE "My report"`,
    });
  });

  test("TC-07a (Include tags)", () => {
    testParse({
      expected: {
        from: "2020-01-22",
        includedTags: ["tag1", "tag2"],
        to: "2020-01-31",
      } as Query,
      queryString: `LIST PAST 10 DAYS INCLUDE TAGS #tag1 #tag2`,
    });
  });

  test("TC-07b (Exclude tags)", () => {
    testParse({
      expected: {
        excludedTags: ["tag1", "tag2"],
        from: "2020-01-22",
        to: "2020-01-31",
      } as Query,
      queryString: `LIST PAST 10 DAYS EXCLUDE TAGS #tag1 #tag2`,
    });
  });

  test("TC-07c (Include and exclude tags)", () => {
    testParse({
      expected: {
        excludedTags: ["tag1", "tag2"],
        from: "2020-01-22",
        includedTags: ["billed"],
        to: "2020-01-31",
      } as Query,
      queryString: `LIST PAST 10 DAYS EXCLUDE TAGS #tag1 #tag2 INCLUDE TAGS #billed`,
    });
  });
});

interface ParseTestParams {
  queryString: string;
  expected: Query;
}

function testParse(params: ParseTestParams, expectedError?: RegExp) {
  if (expectedError == undefined) {
    expect(parse(params.queryString)).toMatchObject(params.expected);
  } else {
    expect(() => parse(params.queryString)).toThrow(expectedError);
  }
}
