import { describe, beforeEach, test, expect } from 'vitest';

import type { Query } from '../ReportQuery';
import { CustomTitleParser } from './parseCustomTitle';
import { Keyword, newQuery, Token } from './Parser';

let test_query: Query;

describe('parseCustomTitle', () => {
	beforeEach(() => {
		test_query = newQuery();
	});

	test('Set custom title', () => {
		testGroupBy({
			input: [Keyword.TITLE, 'My title', 'extra token'],
			query: test_query,
			remaining: ['extra token'],
			expectedTitle: 'My title'
		});
	});

	test('Fails on missing title string', () => {
		testGroupBy(
			{
				input: [Keyword.TITLE, Keyword.WEEK],
				query: test_query,
				remaining: null,
				expectedTitle: null
			},
			/"TITLE" must be followed by a string wrapped in double quotes./g
		);
	});

	test('Fails on double title expression', () => {
		test_query.customTitle = 'existing title';
		testGroupBy(
			{
				input: [Keyword.TITLE, , Keyword.WEEK],
				query: test_query,
				remaining: null,
				expectedTitle: null
			},
			/Cannot define two titles for the same report!/g
		);
	});
});

interface parseCustomTitleTestParams {
	input: Token[];
	query: Query;
	expectedTitle: string;
	remaining: Token[];
}

function testGroupBy(
	params: parseCustomTitleTestParams,
	expectedError?: RegExp
) {
	const parser = new CustomTitleParser();

	if (expectedError == undefined) {
		expect(parser.parse(params.input, params.query)).toEqual<Token[]>(
			params.remaining
		);

		expect(params.query.customTitle).toEqual(params.expectedTitle);
	} else {
		expect(() => parser.parse(params.input, params.query)).toThrowError(
			expectedError
		);
	}
}
