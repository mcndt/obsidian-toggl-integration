import { Keyword, Token, tokenize } from './Tokenize';
import moment from 'moment';
import {
	parseQueryInterval,
	ISODate,
	InvalidDateFormatError,
	parse
} from './Parse';

/* CONSTANTS */

const CURRENT_DATE = '2020-01-31';
const CURRENT_WEEK_SINCE = '2020-01-27';
const CURRENT_WEEK_UNTIL = '2020-02-02';
const CURRENT_MONTH_SINCE = '2020-01-01';
const CURRENT_MONTH_UNTIL = '2020-01-31';

/* MOCKS */
let test_date: ISODate;
jest.mock('moment');

/* UNIT TESTS */

describe('Time Interval Parser (relative intervals)', () => {
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

describe('Time Interval Parser (absolute intervals)', () => {
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

describe('Query Parser', () => {
	it('fails for invalid query type keyword', () => {
		expect(() => parse([Keyword.TO])).toThrow(/Invalid token/g);
	});

	// describe('Summary Report Queries', () => {
	// 	// test('');
	// });

	// describe('List Report Queries', () => {});
});

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
