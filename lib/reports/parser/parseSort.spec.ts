import { describe, beforeEach, test, expect } from 'vitest';

import { Query, SortOrder } from '../ReportQuery';
import { Keyword, newQuery, Token } from './Parser';
import { SortParser } from './parseSort';

let test_query: Query;

describe('parseSort', () => {
	beforeEach(() => {
		test_query = newQuery();
	});

	test('Parse ascending order', () => {
		testParseSort({
			input: [Keyword.SORT, Keyword.ASC, 'extra token'],
			remaining: ['extra token'],
			query: test_query,
			expectedSort: SortOrder.ASC
		});
	});

	test('Parse descending order', () => {
		testParseSort({
			input: [Keyword.SORT, Keyword.DESC, 'extra token'],
			remaining: ['extra token'],
			query: test_query,
			expectedSort: SortOrder.DESC
		});
	});

	test('Fails on invalid order keyword', () => {
		testParseSort(
			{
				input: [Keyword.SORT, Keyword.WEEK, 'extra token'],
				query: test_query,
				remaining: null,
				expectedSort: null
			},
			/Invalid token/g
		);
	});

	test('Fails on existing ordering', () => {
		test_query.sort = SortOrder.DESC;
		testParseSort(
			{
				input: [Keyword.SORT, Keyword.WEEK, 'extra token'],
				remaining: null,
				query: test_query,
				expectedSort: null
			},
			/A query can only contain a single "SORT" expression./g
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
			params.remaining
		);

		expect(params.query.sort).toEqual(params.expectedSort);
	} else {
		expect(() => parser.parse(params.input, params.query)).toThrowError(
			expectedError
		);
	}
}
