import { Query, QueryType } from '../ReportQuery';
import { QueryTypeParser } from './parseQueryType';
import { Keyword, newQuery, Parser, Token } from './Parser';

let test_query: Query;

describe('parseQueryType', () => {
	beforeEach(() => {
		test_query = newQuery();
	});

	test('Parse type "SUMMARY"', () => {
		testParseQueryType({
			input: [Keyword.SUMMARY, 'extra_token'],
			query: test_query,
			expectedType: QueryType.SUMMARY,
			remaining: ['extra_token']
		});
	});

	test('Parse type "LIST"', () => {
		testParseQueryType({
			input: [Keyword.LIST, 'extra_token'],
			query: test_query,
			expectedType: QueryType.LIST,
			remaining: ['extra_token']
		});
	});

	test('fails on invalid token at query head', () => {
		testParseQueryType(
			{
				input: [Keyword.WEEK, 'extra_token'],
				query: test_query,
				expectedType: null,
				remaining: null
			},
			/Invalid token/g
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
	expectedError?: RegExp
) {
	const parser = new QueryTypeParser();

	if (expectedError == undefined) {
		expect(parser.parse(params.input, params.query)).toEqual<Token[]>(
			params.remaining
		);

		expect(params.query.type).toEqual(params.expectedType);
	} else {
		expect(() => parser.parse(params.input, params.query)).toThrowError(
			expectedError
		);
	}
}
