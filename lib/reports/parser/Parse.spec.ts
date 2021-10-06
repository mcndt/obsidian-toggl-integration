import { Keyword, Token, tokenize, UserInput } from './Tokenize';
import moment from 'moment';
import {
	parseQueryInterval,
	ISODate,
	parse,
	parseList,
	parseSelection
} from './Parse';
import { Query, SelectionMode, Selection, SummaryQuery } from '../ReportQuery';

/* CONSTANTS */

const CURRENT_DATE = '2020-01-31';
const CURRENT_WEEK_SINCE = '2020-01-27';
const CURRENT_WEEK_UNTIL = '2020-02-02';
const CURRENT_MONTH_SINCE = '2020-01-01';
const CURRENT_MONTH_UNTIL = '2020-01-31';

/* MOCKS */
let test_date: ISODate;
let test_query: Query;
jest.mock('moment');

/* UNIT TESTS */

describe('parseQueryInterval (relative intervals)', () => {
	/*
	Cases:
	- TODAYS
	- WEEK 
	- MONTH
	- PREVIOUS ... DAYS
	- PREVIOUS ... WEEKS
	- PREVIOUS ... MONTHS
	*/

	beforeEach(() => {
		test_date = CURRENT_DATE;
		(moment as unknown as jest.Mock).mockImplementation(() => {
			return jest.requireActual('moment')(test_date, 'YYYY-MM-DD', true);
		});
	});

	test('Today', () => {
		testParseQueryInterval({
			input: [Keyword.TODAY, 'extra_token'],
			since: CURRENT_DATE,
			until: null,
			remaining: ['extra_token']
		});
	});

	test('Week', () => {
		testParseQueryInterval({
			input: [Keyword.WEEK, 'extra_token'],
			since: CURRENT_WEEK_SINCE,
			until: CURRENT_WEEK_UNTIL,
			remaining: ['extra_token']
		});
	});

	test('Month (Jan)', () => {
		testParseQueryInterval({
			input: [Keyword.MONTH, 'extra_token'],
			since: CURRENT_MONTH_SINCE,
			until: CURRENT_MONTH_UNTIL,
			remaining: ['extra_token']
		});
	});

	test('Month (Feb)', () => {
		test_date = '2020-02-04';

		testParseQueryInterval({
			input: [Keyword.MONTH, 'extra_token'],
			since: '2020-02-01',
			until: '2020-02-29',
			remaining: ['extra_token']
		});
	});

	test('"PREVIOUS 10 DAYS" includes the last ten days', () => {
		test_date = '2020-01-10';

		testParseQueryInterval({
			input: [Keyword.PREVIOUS, 10, Keyword.DAYS, 'extra_token'],
			since: '2020-01-01',
			until: '2020-01-10',
			remaining: ['extra_token']
		});
	});

	test('"PREVOUS 3 WEEKS" includes current and previous two weeks', () => {
		test_date = '2020-02-01';

		testParseQueryInterval({
			input: [Keyword.PREVIOUS, 3, Keyword.WEEKS, 'extra_token'],
			since: '2020-01-13',
			until: '2020-02-02',
			remaining: ['extra_token']
		});
	});

	test('"PREVOUS 3 MONTHS" includes current and previous two months', () => {
		test_date = '2020-01-28';

		testParseQueryInterval({
			input: [Keyword.PREVIOUS, 3, Keyword.MONTHS, 'extra_token'],
			since: '2019-11-01',
			until: '2020-01-31',
			remaining: ['extra_token']
		});
	});

	it('fails for relative window without decimal number', () => {
		testParseQueryInterval(
			{
				input: [Keyword.PREVIOUS, 'ten', Keyword.DAYS, 'extra_token'],
				since: null,
				until: null,
				remaining: null
			},
			/Invalid token/g
		);
	});

	it('fails for relative window with invalid unit size', () => {
		testParseQueryInterval(
			{
				input: [Keyword.PREVIOUS, 'ten', Keyword.TODAY, 'extra_token'],
				since: null,
				until: null,
				remaining: null
			},
			/Invalid token/g
		);
	});

	it('fails for intervals larger than 356 days', () => {
		test_date = '2020-01-01';

		testParseQueryInterval(
			{
				input: [Keyword.PREVIOUS, 366, Keyword.DAYS, 'extra_token'],
				since: null,
				until: null,
				remaining: null
			},
			/Toggl only provides reports over time spans less than 1 year./g
		);
	});
});

describe('parseQueryInterval (absolute intervals)', () => {
	/*
	Cases:
	- FROM ... TO ...
	- FROM ...
	*/

	beforeEach(() => {
		(moment as unknown as jest.Mock).mockImplementation((...args) => {
			return jest.requireActual('moment')(...args);
		});
	});

	test('Date range (ISO format)', () => {
		const from = '2020-01-01';
		const to = '2020-02-01';
		testParseQueryInterval({
			input: [Keyword.FROM, from, Keyword.TO, to, 'extra_token'],
			since: from,
			until: to,
			remaining: ['extra_token']
		});
	});

	it('fails on invalid date format following "FROM" keyword', () => {
		const from = '01/01/2020';
		const to = '2020-02-01';
		testParseQueryInterval(
			{
				input: [Keyword.FROM, from, Keyword.TO, to, 'extra_token'],
				since: '2020-01-01',
				until: to,
				remaining: ['extra_token']
			},
			/Cannot convert to valid date: "01\/01\/2020"/gm
		);
	});

	it('fails on invalid date format following "TO" keyword', () => {
		const from = '2020-01-01';
		const to = '01/02/2020';
		testParseQueryInterval(
			{
				input: [Keyword.FROM, from, Keyword.TO, to, 'extra_token'],
				since: from,
				until: '2020-02-01',
				remaining: ['extra_token']
			},
			/Cannot convert to valid date: "01\/02\/2020"/gm
		);
	});

	it('fails on a negative duration time interval', () => {
		const from = '2020-01-01';
		const to = '2019-12-02';
		testParseQueryInterval(
			{
				input: [Keyword.FROM, from, Keyword.TO, to, 'extra_token'],
				since: null,
				until: null,
				remaining: null
			},
			/The FROM date must be before/gm
		);
	});

	it('fails for intervals larger than 356 days', () => {
		testParseQueryInterval(
			{
				input: [
					Keyword.FROM,
					'2019-01-01',
					Keyword.TO,
					'2020-01-02',
					'extra_token'
				],
				since: null,
				until: null,
				remaining: null
			},
			/Toggl only provides reports over time spans less than 1 year./g
		);
	});
});

describe('parseList', () => {
	it('stops at next non UserInput token', () => {
		testParseList({
			input: ['project A', 'project B', 1234567890, Keyword.EXCLUDE],
			list: ['project A', 'project B', 1234567890],
			remaining: [Keyword.EXCLUDE]
		});
	});

	it('stops at end of tokens array', () => {
		testParseList({
			input: ['project A', 'project B', 1234567890],
			list: ['project A', 'project B', 1234567890],
			remaining: []
		});
	});

	it('fails when there are no UserInput tokens', () => {
		testParseList(
			{
				input: [Keyword.EXCLUDE],
				list: [],
				remaining: []
			},
			/No UserInput tokens at head of tokens array/g
		);
	});
});

describe('parseSelection', () => {
	beforeEach(() => {
		test_query = {
			from: '2020-01-01',
			to: '2020-01-31'
		};
	});

	test('"INCLUDE PROJECTS" adds projectSelection to query object', () => {
		testParseSelection({
			input: [Keyword.INCLUDE, Keyword.PROJECTS, 'project A', 1234567890],
			query: test_query,
			mode: SelectionMode.INCLUDE,
			list: ['project A', 1234567890],
			remaining: []
		});
	});

	test('"EXCLUDE PROJECTS" adds projectSelection to query object', () => {
		testParseSelection({
			input: [Keyword.EXCLUDE, Keyword.PROJECTS, 'project A', 1234567890],
			query: test_query,
			mode: SelectionMode.EXCLUDE,
			list: ['project A', 1234567890],
			remaining: []
		});
	});

	it('fails on zero UserInput tokens', () => {
		testParseSelection(
			{
				input: [Keyword.EXCLUDE, Keyword.PROJECTS, Keyword.INCLUDE],
				query: test_query,
				mode: null,
				list: null,
				remaining: null
			},
			/must be followed by at least one item/g
		);
	});

	it('fails on unknown mode keyword', () => {
		testParseSelection(
			{
				input: [Keyword.WEEKS, Keyword.PROJECTS, 'project A', 1234567890],
				query: test_query,
				mode: null,
				list: null,
				remaining: null
			},
			/Invalid token/g
		);
	});

	it('fails on unknown selection qualifier keyword', () => {
		testParseSelection(
			{
				input: [Keyword.EXCLUDE, Keyword.WEEKS, 'project A', 1234567890],
				query: test_query,
				mode: null,
				list: null,
				remaining: null
			},
			/Invalid token/g
		);
	});
});

describe('parse', () => {
	beforeEach(() => {
		test_date = CURRENT_DATE;
		(moment as unknown as jest.Mock).mockImplementation((...args) => {
			if (args.length == 0) {
				return jest.requireActual('moment')(test_date, 'YYYY-MM-DD', true);
			}
			return jest.requireActual('moment')(...args);
		});
	});

	test('TC-01 (preset relative time interval)', () => {
		let test = 0;
		testParse({
			queryString: 'SUMMARY WEEK',
			expected: {
				from: CURRENT_WEEK_SINCE,
				to: CURRENT_WEEK_UNTIL
			} as SummaryQuery
		});
	});

	test('TC-02a (Absolute time interval)', () => {
		testParse({
			queryString: `SUMMARY FROM 2020-01-01 TO 2020-03-01`,
			expected: {
				from: '2020-01-01',
				to: '2020-03-01'
			} as SummaryQuery
		});
	});

	test('TC-02b (fails on negative absolute time interval)', () => {
		testParse(
			{
				queryString: `SUMMARY FROM 2020-03-01 TO 2020-01-01`,
				expected: null
			},
			/The FROM date must be before/g
		);
	});

	test('TC-02c (fails on malformed date formatting)', () => {
		testParse(
			{
				queryString: `SUMMARY FROM 2020-3-1 TO 2020-1-1`,
				expected: null
			},
			/is not a keyword/g
		);
	});

	test('TC-02d (fails on missing time interval)', () => {
		testParse(
			{
				queryString: `SUMMARY`,
				expected: null
			},
			/Query must include a time interval expression/g
		);
	});

	test('TC-02e (fails on time interval larger than 1 year)', () => {
		testParse(
			{
				queryString: `SUMMARY PREVIOUS 400 DAYS`,
				expected: null
			},
			/Toggl only provides reports over time spans less than 1 year/g
		);
	});

	test('TC-03a (Relative time interval, include projects)', () => {
		testParse({
			queryString: `SUMMARY PREVIOUS 10 DAYS INCLUDE PROJECTS 'project A', 123456789`,
			expected: {
				from: '2020-01-22',
				to: '2020-01-31',
				projectSelection: {
					mode: SelectionMode.INCLUDE,
					list: ['project A', 123456789]
				}
			} as SummaryQuery
		});
	});

	test('TC-03b (Fails on contradicting selection statements over projects)', () => {
		testParse(
			{
				queryString: `SUMMARY PREVIOUS 10 DAYS INCLUDE PROJECTS 'project A', 123456789 EXCLUDE PROJECTS 'project B'`,
				expected: null
			},
			/query can only contain a single selection expression for keyword/g
		);
	});

	test('TC-03c (Fails on double selection statement over projects)', () => {
		testParse(
			{
				queryString: `SUMMARY PREVIOUS 10 DAYS INCLUDE PROJECTS 'project A', 123456789 INCLUDE PROJECTS 'project B'`,
				expected: null
			},
			/query can only contain a single selection expression for keyword/g
		);
	});

	test('TC-03d (Fails on unknown selection qualifier)', () => {
		testParse(
			{
				queryString: `SUMMARY PREVIOUS 10 DAYS INCLUDE WEEKS 'project A', 123456789`,
				expected: null
			},
			/Invalid token/g
		);
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

interface SelectionTestParams {
	input: Token[];
	query: Query;
	mode: SelectionMode;
	list: (string | number)[];
	remaining: Token[];
}

function testParseSelection(
	params: SelectionTestParams,
	expectedError?: RegExp
): void {
	if (expectedError == undefined) {
		expect(parseSelection(params.input, params.query)).toEqual([]);

		expect(params.query.projectSelection).toEqual(expect.anything());
		expect(params.query.projectSelection).toMatchObject<Selection>({
			mode: params.mode,
			list: params.list
		});
	} else {
		expect(() => parseSelection(params.input, params.query)).toThrowError(
			expectedError
		);
	}
}

interface IntervalParseTestParams {
	input: Token[];
	since: ISODate;
	until: ISODate;
	remaining: Token[];
}

function testParseQueryInterval(
	params: IntervalParseTestParams,
	expectedError?: RegExp
): void {
	if (expectedError == undefined) {
		expect(parseQueryInterval(params.input)).toEqual<
			[ISODate, ISODate, Token[]]
		>([params.since, params.until, params.remaining]);
	} else {
		expect(() => parseQueryInterval(params.input)).toThrowError(expectedError);
	}
}

interface parseListTestParams {
	input: Token[];
	list: UserInput[];
	remaining: Token[];
}

function testParseList(
	params: parseListTestParams,
	expectedError?: RegExp
): void {
	if (expectedError == undefined) {
		expect(parseList(params.input)).toEqual<[UserInput[], Token[]]>([
			params.list,
			params.remaining
		]);
	} else {
		expect(() => parseList(params.input)).toThrowError(expectedError);
	}
}
