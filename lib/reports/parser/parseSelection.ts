import { Query, SelectionMode } from '../ReportQuery';
import parseList from './parseList';
import {
	InvalidTokenError,
	Keyword,
	QueryParseError,
	Token,
	UserInput
} from './Parser';

/**
 * Parses a selection statement from the tokens array and consumes tokens.
 * Results are added into the passed query object.
 *  @returns remaining tokens.
 *  @throws EvalError when parsing fails.
 */
export default function parseSelection(tokens: Token[], query: Query): Token[] {
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
		default:
			throw new InvalidTokenError(_tokens[0], [
				Keyword.INCLUDE,
				Keyword.EXCLUDE
			]);
	}
	_tokens.splice(0, 1);

	// Get qualifier
	const qualifier: Token = _tokens[0];
	const accepted_qualifiers = [Keyword.PROJECTS] as Token[];
	if (!accepted_qualifiers.includes(qualifier)) {
		throw new InvalidTokenError(qualifier, accepted_qualifiers);
	}
	_tokens.splice(0, 1);

	// Check for duplicate selection
	if (qualifier === Keyword.PROJECTS) {
		if (query.projectSelection) {
			throw new DuplicateSelectionExpression(Keyword.PROJECTS);
		}
	} else {
		throw new Error(
			`No selection parser implementation for selection qualifier ${qualifier}`
		);
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
	}

	return _tokens;
}

export class NoUserInputTokensError extends QueryParseError {
	constructor(mode: SelectionMode, qualifier: Keyword) {
		super(
			`"${mode} ${qualifier}" must be followed by at least one item. For example: 'INCLUDE PROJECTS "project A", 12345678, "Project C"'`
		);
		// Set the prototype explicitly.
		Object.setPrototypeOf(this, NoUserInputTokensError.prototype);
	}
}

export class DuplicateSelectionExpression extends QueryParseError {
	constructor(qualifier: Keyword) {
		super(
			`A query can only contain a single selection expression for keyword "${qualifier}"`
		);
	}
}
