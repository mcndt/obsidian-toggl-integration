import { describe, test, expect, it } from 'vitest';

import { Keyword } from './Parser';
import { tokenize } from './Tokenize';

describe('Tokenization', () => {
	test('empty query string', () => {
		expect(tokenize('')).toEqual([]);
	});

	test('Keyword tokens', () => {
		expect(tokenize('SUMMARY TODAY')).toEqual([
			Keyword.SUMMARY,
			Keyword.TODAY
		]);
	});

	test('String input (single quotes)', () => {
		// NOTE: quotations should be normalized to double quotes.
		expect(tokenize(`'user generated string'`)).toEqual([
			`"user generated string"`
		]);
	});

	test('String input (double quotes)', () => {
		expect(tokenize(`"user generated string"`)).toEqual([
			`"user generated string"`
		]);
	});

	test('Comma separated lists', () => {
		expect(tokenize(`"item A", "item B"`)).toEqual([
			'"item A"',
			'"item B"'
		]);
	});

	test('ISO-formatted dates', () => {
		expect(tokenize(`SUMMARY FROM 2020-01-02 TO 2020-01-03`)).toEqual([
			Keyword.SUMMARY,
			Keyword.FROM,
			'2020-01-02',
			Keyword.TO,
			'2020-01-03'
		]);
	});

	it('fails on malformed dates', () => {
		expect(() =>
			tokenize(`SUMMARY FROM 2020-1-2 TO 2020-1-3`)
		).toThrowError(/is not a keyword/g);
	});

	test('Decimal numbers', () => {
		expect(tokenize(`10`)).toEqual([10]);
	});

	test('Tags', () => {
		expect(tokenize(`#TAG`)).toEqual(['tag']);
	});

	it('fails on unknown keywords', () => {
		expect(() => tokenize(`unknown_token`)).toThrowError(
			/is not a keyword/g
		);
	});

	it('uppercases non-string tokens', () => {
		expect(
			tokenize(`summary from 2020-01-02 include projects "project A"`)
		).toEqual([
			Keyword.SUMMARY,
			Keyword.FROM,
			'2020-01-02',
			Keyword.INCLUDE,
			Keyword.PROJECTS,
			'"project A"'
		]);
	});

	test('Mixed keywords and user-generated strings', () => {
		expect(
			tokenize(`SUMMARY TODAY INCLUDE PROJECTS "item A", "item B" TITLE`)
		).toEqual([
			Keyword.SUMMARY,
			Keyword.TODAY,
			Keyword.INCLUDE,
			Keyword.PROJECTS,
			'"item A"',
			'"item B"',
			Keyword.TITLE
		]);
	});
});
