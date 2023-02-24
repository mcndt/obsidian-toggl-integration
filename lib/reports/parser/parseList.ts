import { Keyword, Token, UserInput } from "./Parser";

/**
 * Parses a list of subsequent UserInput tokens from the passed
 * tokens array and returns the remaining tokens sequence. Parsed
 * tokens are consumed in the process.
 * @returns List of parsed UserInput tokens and remaining tokens.
 * @throws EvalError when no UserInput tokens are present at the head
 * of the tokens array.
 */
export default function parseList(
  tokens: Token[],
  maxResults?: number,
): [UserInput[], Token[]] {
  const _tokens = [...tokens];

  const list: UserInput[] = [];

  while (_tokens.length > 0 && (!maxResults || list.length < maxResults)) {
    if (_tokens[0] in Keyword) break;
    if (typeof _tokens[0] == "string" && _tokens[0][0] == '"') {
      list.push(_tokens[0].slice(1, -1));
    } else {
      list.push(_tokens[0]);
    }
    _tokens.splice(0, 1);
  }

  if (list.length == 0) {
    throw new EvalError("No UserInput tokens at head of tokens array.");
  }

  return [list, _tokens];
}
