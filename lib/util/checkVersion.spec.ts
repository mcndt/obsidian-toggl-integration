import { describe, expect, it } from 'vitest';

import { checkVersion } from './checkVersion';

describe('parse', () => {
	it('passes on equal version', () => {
		expect(checkVersion('1.2.3', 1, 2, 3)).toStrictEqual(true);
	});

	it('passes on greater patch version', () => {
		expect(checkVersion('1.2.4', 1, 2, 3)).toStrictEqual(true);
	});

	it('passes on greater minor version', () => {
		expect(checkVersion('1.3.4', 1, 2, 3)).toStrictEqual(true);
	});

	it('passes on greater major version', () => {
		expect(checkVersion('2.3.4', 1, 2, 3)).toStrictEqual(true);
	});

	it('fails on lesser major version', () => {
		expect(checkVersion('0.2.3', 1, 2, 3)).toStrictEqual(false);
	});

	it('fails on lesser minor version', () => {
		expect(checkVersion('1.1.3', 1, 2, 3)).toStrictEqual(false);
	});

	it('fails on lesser patch version', () => {
		expect(checkVersion('1.2.2', 1, 2, 3)).toStrictEqual(false);
	});
});
