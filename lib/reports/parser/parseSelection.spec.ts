import { Query, QueryType, SelectionMode, Selection } from '../ReportQuery';
import { Keyword, Token } from './Parser';
import { SelectionParser } from './parseSelection';

let test_query: Query;

describe('parseSelection', () => {
	beforeEach(() => {
		test_query = {
			type: QueryType.SUMMARY,
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
	const parser = new SelectionParser();

	if (expectedError == undefined) {
		expect(parser.parse(params.input, params.query)).toEqual(params.remaining);

		expect(params.query.projectSelection).toEqual(expect.anything());
		expect(params.query.projectSelection).toMatchObject<Selection>({
			mode: params.mode,
			list: params.list
		});
	} else {
		expect(() => parser.parse(params.input, params.query)).toThrowError(
			expectedError
		);
	}
}
