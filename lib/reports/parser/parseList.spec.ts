import { describe, expect, it } from 'vitest';

import parseList from './parseList';
import { Keyword, Token, UserInput } from './Parser';

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
