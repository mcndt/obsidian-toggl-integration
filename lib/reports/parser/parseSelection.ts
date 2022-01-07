import { Query, SelectionMode } from '../ReportQuery';
import parseList from './parseList';
import {
	InvalidTokenError,
	Keyword,
	Parser,
	QueryParseError,
	Token,
	UserInput
} from './Parser';

export class SelectionParser extends Parser {
	private static readonly _acceptedQualifiers: Token[] = [
		Keyword.PROJECTS,
		Keyword.CLIENTS
	];

	/**
	 * Parses a selection statement from the tokens array and consumes tokens.
	 * Results are added into the passed query object.
	 *  @returns remaining tokens.
	 *  @throws EvalError when parsing fails.
	 */
	public parse(tokens: Token[], query: Query): Token[] {
		this.test(tokens, true);
		let _tokens = [...tokens];

		// Get selection mode
		let mode: SelectionMode;
		switch (_tokens[0]) {
			case Keyword.INCLUDE:
				mode = SelectionMode.INCLUDE;
				break;
			case Keyword.EXCLUDE:
				mode = SelectionMode.EXCLUDE;
				break;
		}
		_tokens.splice(0, 1);

		// Get qualifier
		const qualifier: Token = _tokens[0];
		if (!SelectionParser._acceptedQualifiers.includes(qualifier)) {
			throw new InvalidTokenError(
				qualifier,
				SelectionParser._acceptedQualifiers
			);
		}
		_tokens.splice(0, 1);

		// Check for duplicate selection
		const duplicateProjectFilter =
			qualifier === Keyword.PROJECTS && query.projectSelection != null;
		const duplicateClientFilter =
			qualifier === Keyword.CLIENTS && query.clientSelection != null;
		if (duplicateProjectFilter || duplicateClientFilter) {
			throw new DuplicateSelectionExpression(qualifier);
		}

		// Get selection list
		let list: UserInput[];
		try {
			[list, _tokens] = parseList(_tokens);
		} catch {
			throw new NoUserInputTokensError(mode, qualifier as Keyword);
		}

		// Add to query object
		switch (qualifier) {
			case Keyword.PROJECTS:
				query.projectSelection = { mode, list };
				break;
			case Keyword.CLIENTS:
				if (list.filter((v) => typeof v === 'number').length > 0) {
					throw new QueryParseError(
						'Filtering by numeric client id is not currently supported.'
					);
				}
				query.clientSelection = { mode, list };
				break;
		}

		return _tokens;
	}

	get _acceptedTokens(): Token[] {
		return [Keyword.INCLUDE, Keyword.EXCLUDE];
	}
}

class NoUserInputTokensError extends QueryParseError {
	constructor(mode: SelectionMode, qualifier: Keyword) {
		super(
			`"${mode} ${qualifier}" must be followed by at least one item. For example: 'INCLUDE PROJECTS "project A", 12345678, "Project C"'`
		);
		// Set the prototype explicitly.
		Object.setPrototypeOf(this, NoUserInputTokensError.prototype);
	}
}

class DuplicateSelectionExpression extends QueryParseError {
	constructor(qualifier: Keyword) {
		super(
			`A query can only contain a single selection expression for keyword "${qualifier}"`
		);
	}
}
