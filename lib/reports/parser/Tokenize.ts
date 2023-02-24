import { Keyword, Token } from "./Parser";

/**
 * @param query query string
 * @returns query split into list of keyword tokens and user-generated strings.
 */
export function tokenize(query: string): Token[] {
  // split into array of tokens
  let match = query.match(/(?:[^\s"',]+|"[^"]*"|'[^']*')+/g);
  match = match || [];

  // only use double quotes to signify user-strings
  for (const i in match) {
    match[i] = match[i].replace(/[']+/g, '"');
  }

  // Validate tokens
  const results: Token[] = [];
  for (const token of match) {
    if (
      !(token.toUpperCase() in Keyword) && // a keyword
      !/".*"/g.test(token) && // a string
      !/\d{4}-\d{2}-\d{2}/g.test(token) && // a ISO-formatted date
      !/(#.*)/g.test(token) && // a tag of the format "#tag"
      !/^\d+$/g.test(token) // an integer (for project or client IDs)
    ) {
      throw new UnknownKeywordError(token);
    }

    if (/^\d+$/g.test(token)) {
      // Convert to number type
      results.push(parseInt(token));
    } else if (/(#.*)/g.test(token)) {
      // Normalize all tags to lowercase, remove pound sign
      results.push(token.slice(1).toLowerCase());
    } else if (!/".*"/g.test(token)) {
      // Uppercase all non-string tokens for normalization
      results.push(token.toUpperCase());
    } else {
      results.push(token);
    }
  }

  return results;
}

export class UnknownKeywordError extends Error {
  constructor(received: Token) {
    super(
      `"${received}" is not a keyword, ISO-formatted date, decimal number or string. Hint: strings must be wrapped in quotation marks, dates must be formatted as YYYY-MM-DD and numbers should have no leading zeros.`,
    );
  }
}
