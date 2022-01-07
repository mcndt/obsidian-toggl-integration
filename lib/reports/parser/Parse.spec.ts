import moment from 'moment';
import { parse } from './Parse';
import {
	Query,
	SelectionMode,
	ISODate,
	SortOrder,
	GroupBy
} from '../ReportQuery';

/* CONSTANTS */
const CURRENT_DATE = '2020-01-31';
const CURRENT_WEEK_SINCE = '2020-01-27';
const CURRENT_WEEK_UNTIL = '2020-02-02';

/* MOCKS */
let test_date: ISODate;
jest.mock('moment');

/* UNIT TESTS */
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
			} as Query
		});
	});

	test('TC-02a (Absolute time interval)', () => {
		testParse({
			queryString: `SUMMARY FROM 2020-01-01 TO 2020-03-01`,
			expected: {
				from: '2020-01-01',
				to: '2020-03-01'
			} as Query
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
				queryString: `SUMMARY PAST 400 DAYS`,
				expected: null
			},
			/Toggl only provides reports over time spans less than 1 year/g
		);
	});

	test('TC-02f (Relative time interval)', () => {
		testParse({
			queryString: `SUMMARY PAST 10 DAYS`,
			expected: {
				from: '2020-01-22',
				to: '2020-01-31'
			} as Query
		});
	});

	test('TC-03a (include projects (string or integer id))', () => {
		testParse({
			queryString: `SUMMARY PAST 10 DAYS INCLUDE PROJECTS 'project A', 123456789`,
			expected: {
				from: '2020-01-22',
				to: '2020-01-31',
				projectSelection: {
					mode: SelectionMode.INCLUDE,
					list: ['project A', 123456789]
				}
			} as Query
		});
	});

	test('TC-03b (Fails on contradicting selection statements)', () => {
		testParse(
			{
				queryString: `SUMMARY PAST 10 DAYS INCLUDE PROJECTS 'project A', 123456789 EXCLUDE PROJECTS 'project B'`,
				expected: null
			},
			/query can only contain a single selection expression for keyword/g
		);
	});

	test('TC-03c (Fails on double selection statement)', () => {
		testParse(
			{
				queryString: `SUMMARY PAST 10 DAYS INCLUDE CLIENTS 'project A', 'project C' INCLUDE CLIENTS 'project B'`,
				expected: null
			},
			/query can only contain a single selection expression for keyword/g
		);
	});

	test('TC-03d (Fails on unknown selection qualifier)', () => {
		testParse(
			{
				queryString: `SUMMARY PAST 10 DAYS INCLUDE WEEKS 'project A', 123456789`,
				expected: null
			},
			/Invalid token/g
		);
	});

	test('TC-03e (select over projects and clients)', () => {
		testParse({
			queryString: `SUMMARY PAST 10 DAYS INCLUDE PROJECTS 'project A', 123456789 EXCLUDE CLIENTS "Client B"`,
			expected: {
				from: '2020-01-22',
				to: '2020-01-31',
				projectSelection: {
					mode: SelectionMode.INCLUDE,
					list: ['project A', 123456789]
				},
				clientSelection: {
					mode: SelectionMode.EXCLUDE,
					list: ['Client B']
				}
			} as Query
		});
	});

	test('TC-04 (Fails on unexpected token at the end of the query)', () => {
		testParse(
			{
				queryString: `SUMMARY PAST 10 DAYS "unexpected_token"`,
				expected: null
			},
			/Invalid token at end of query: ""unexpected_token""/g
		);
	});

	test('TC-05a (Sort ascending)', () => {
		testParse({
			queryString: `LIST PAST 10 DAYS SORT ASC`,
			expected: {
				from: '2020-01-22',
				to: '2020-01-31',
				sort: SortOrder.ASC
			} as Query
		});
	});

	test('TC-05b (Fails on double sort expression)', () => {
		testParse(
			{
				queryString: `LIST PAST 10 DAYS SORT ASC SORT DESC`,
				expected: null
			},
			/A query can only contain a single "SORT" expression/g
		);
	});

	test('TC-05c (Group by date)', () => {
		testParse({
			queryString: `LIST PAST 10 DAYS GROUP BY DATE`,
			expected: {
				from: '2020-01-22',
				to: '2020-01-31',
				groupBy: GroupBy.DATE
			} as Query
		});
	});

	test('TC-05d (Fails on double group by expression)', () => {
		testParse(
			{
				queryString: `LIST PAST 10 DAYS GROUP BY DATE GROUP BY PROJECT`,
				expected: null
			},
			/A query can only contain a single \"GROUP BY\" expression/g
		);
	});

	test('TC-05e (Group by fails on incompatible type expression)', () => {
		testParse(
			{
				queryString: `SUMMARY PAST 10 DAYS GROUP BY DATE`,
				expected: null
			},
			/"GROUP BY" can only be used on "LIST" queries./g
		);
	});

	test('TC-05f (Group by date after sort)', () => {
		testParse({
			queryString: `LIST PAST 10 DAYS SORT ASC GROUP BY DATE`,
			expected: {
				from: '2020-01-22',
				to: '2020-01-31',
				sort: SortOrder.ASC,
				groupBy: GroupBy.DATE
			} as Query
		});
	});

	test('TC-05g (Sort after group by)', () => {
		testParse({
			queryString: `LIST PAST 10 DAYS GROUP BY PROJECT SORT DESC`,
			expected: {
				from: '2020-01-22',
				to: '2020-01-31',
				sort: SortOrder.DESC,
				groupBy: GroupBy.PROJECT
			} as Query
		});
	});

	test('TC-06a (Custom title)', () => {
		testParse({
			queryString: `LIST PAST 10 DAYS SORT DESC TITLE "My report"`,
			expected: {
				from: '2020-01-22',
				to: '2020-01-31',
				sort: SortOrder.DESC,
				customTitle: 'My report'
			} as Query
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
