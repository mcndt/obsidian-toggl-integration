import { GroupBy, Query, QueryType } from '../ReportQuery';
import { GroupByParser } from './parseGroupBy';
import { Keyword, newQuery, Token } from './Parser';

let test_query: Query;

describe('parseGroupBy', () => {
	beforeEach(() => {
		test_query = newQuery();
		test_query.type = QueryType.LIST;
	});

	test('Group by date', () => {
		testGroupBy({
			input: [Keyword.GROUP, Keyword.BY, Keyword.DATE, 'extra token'],
			remaining: ['extra token'],
			query: test_query,
			expectedGroupBy: GroupBy.DATE
		});
	});

	test('Group by project', () => {
		testGroupBy({
			input: [Keyword.GROUP, Keyword.BY, Keyword.PROJECT, 'extra token'],
			remaining: ['extra token'],
			query: test_query,
			expectedGroupBy: GroupBy.PROJECT
		});
	});

	test('Fails on unknown group keyword', () => {
		testGroupBy(
			{
				input: [Keyword.GROUP, Keyword.BY, Keyword.WEEK, 'extra token'],
				query: test_query,
				remaining: null,
				expectedGroupBy: null
			},
			/Invalid token/g
		);
	});

	test('Fails on duplicate expression', () => {
		test_query.groupBy = GroupBy.DATE;
		testGroupBy(
			{
				input: [Keyword.GROUP, Keyword.BY, Keyword.PROJECT, 'extra token'],
				query: test_query,
				remaining: null,
				expectedGroupBy: null
			},
			/A query can only contain a single "GROUP BY" expression./g
		);
	});

	test('Fails on incompatible query type', () => {
		test_query.type = QueryType.SUMMARY;
		testGroupBy(
			{
				input: [Keyword.GROUP, Keyword.BY, Keyword.PROJECT, 'extra token'],
				query: test_query,
				remaining: null,
				expectedGroupBy: null
			},
			/"GROUP BY" can only be used on "LIST" queries./g
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
			params.remaining
		);

		expect(params.query.groupBy).toEqual(params.expectedGroupBy);
	} else {
		expect(() => parser.parse(params.input, params.query)).toThrowError(
			expectedError
		);
	}
}
