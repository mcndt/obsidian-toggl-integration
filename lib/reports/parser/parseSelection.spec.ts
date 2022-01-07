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
			projects: {
				mode: SelectionMode.INCLUDE,
				list: ['project A', 1234567890]
			},
			remaining: []
		});
	});

	test('"EXCLUDE PROJECTS" adds projectSelection to query object', () => {
		testParseSelection({
			input: [Keyword.EXCLUDE, Keyword.PROJECTS, 'project A', 1234567890],
			query: test_query,
			projects: {
				mode: SelectionMode.EXCLUDE,
				list: ['project A', 1234567890]
			},
			remaining: []
		});
	});

	test('"INCLUDE CLIENTS" adds clientSelection to query object', () => {
		testParseSelection({
			input: [Keyword.INCLUDE, Keyword.CLIENTS, 'client A', 'client B'],
			query: test_query,
			clients: {
				mode: SelectionMode.INCLUDE,
				list: ['client A', 'client B']
			},
			remaining: []
		});
	});

	test('"EXCLUDE CLIENTS" adds clientSelection to query object', () => {
		testParseSelection({
			input: [Keyword.EXCLUDE, Keyword.CLIENTS, 'client A', 'client B'],
			query: test_query,
			clients: {
				mode: SelectionMode.EXCLUDE,
				list: ['client A', 'client B']
			},
			remaining: []
		});
	});

	test('Adding project selection after client selection', () => {
		test_query.clientSelection = {
			mode: SelectionMode.INCLUDE,
			list: ['client A']
		};
		testParseSelection({
			input: [Keyword.EXCLUDE, Keyword.PROJECTS, 'project B'],
			query: test_query,
			clients: { mode: SelectionMode.INCLUDE, list: ['client A'] },
			projects: { mode: SelectionMode.EXCLUDE, list: ['project B'] },
			remaining: []
		});
	});

	test('Adding client selection after project selection', () => {
		test_query.projectSelection = {
			mode: SelectionMode.INCLUDE,
			list: ['project A']
		};
		testParseSelection({
			input: [Keyword.EXCLUDE, Keyword.CLIENTS, 'client B'],
			query: test_query,
			clients: { mode: SelectionMode.EXCLUDE, list: ['client B'] },
			projects: { mode: SelectionMode.INCLUDE, list: ['project A'] },
			remaining: []
		});
	});

	it('fails on zero UserInput tokens', () => {
		testParseSelection(
			{
				input: [Keyword.EXCLUDE, Keyword.PROJECTS, Keyword.INCLUDE],
				query: test_query,
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
				remaining: null
			},
			/Invalid token/g
		);
	});

	it('fails on pre-existing project selection', () => {
		test_query.projectSelection = { mode: SelectionMode.EXCLUDE, list: [] };
		testParseSelection(
			{
				input: [Keyword.EXCLUDE, Keyword.PROJECTS, 'Abcd', 1234567890],
				query: test_query,
				remaining: null
			},
			/A query can only contain a single selection expression for keyword/g
		);
	});

	it('fails on pre-existing client selection', () => {
		test_query.clientSelection = { mode: SelectionMode.EXCLUDE, list: [] };
		testParseSelection(
			{
				input: [Keyword.EXCLUDE, Keyword.CLIENTS, 'Abcd', 1234567890],
				query: test_query,
				remaining: null
			},
			/A query can only contain a single selection expression for keyword/g
		);
	});

	it('fails on client filtering using numeric ID', () => {
		testParseSelection(
			{
				input: [Keyword.EXCLUDE, Keyword.CLIENTS, 'Abcd', 1234567890],
				query: test_query,
				remaining: null
			},
			/Filtering by numeric client id is not currently supported/g
		);
	});
});

interface SelectionTestParams {
	input: Token[];
	query: Query;
	remaining: Token[];
	projects?: {
		mode: SelectionMode;
		list: (string | number)[];
	};
	clients?: {
		mode: SelectionMode;
		list: (string | number)[];
	};
}

function testParseSelection(
	params: SelectionTestParams,
	expectedError?: RegExp
): void {
	const parser = new SelectionParser();

	if (expectedError == undefined) {
		expect(parser.parse(params.input, params.query)).toEqual(params.remaining);
		if (params.projects) {
			expect(params.query.projectSelection).toEqual(expect.anything());
			expect(params.query.projectSelection).toMatchObject<Selection>({
				mode: params.projects.mode,
				list: params.projects.list
			});
		}
		if (params.clients) {
			expect(params.query.clientSelection).toEqual(expect.anything());
			expect(params.query.clientSelection).toMatchObject<Selection>({
				mode: params.clients.mode,
				list: params.clients.list
			});
		}
	} else {
		expect(() => parser.parse(params.input, params.query)).toThrowError(
			expectedError
		);
	}
}
