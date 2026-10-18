import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUNDLES, EN, OTHER_LOCALES } from './_bundles.js';

/**
 * Every action the app may report to the error log has a plain name in every language (D-616; Sage's names, Lena's translations).
 *
 * The bell row and the Problems list show `appError.action.<key>`; a key with no name shows as the raw key, which is fine for a day and
 * not for good. The closed list is `APP_ERROR_ACTIONS` in `src/appErrors.ts` (Nico's file; this test reads it by name and waits for it).
 * A name is one phrase that reads first in "{action} didn't go through ..." and alone on a list, so it has no full stop and no placeholder.
 */
const LIST = fileURLToPath(new URL('../src/appErrors.ts', import.meta.url));
const source = existsSync(LIST) ? readFileSync(LIST, 'utf8') : '';
const body = source.slice(source.indexOf('APP_ERROR_ACTIONS = ['), source.indexOf('] as const'));
const ACTIONS = [...body.matchAll(/'([a-z][a-z0-9.-]*)'/g)].map((m) => m[1]!);
const PREFIX = 'appError.action.';

describe.skipIf(ACTIONS.length === 0)('every error-log action has a plain name (D-616)', () => {
  it.each(['en', ...OTHER_LOCALES] as const)('%s names every action on the list', (locale) => {
    const bundle = BUNDLES[locale];
    expect(ACTIONS.filter((a) => !bundle[PREFIX + a])).toEqual([]);
  });

  it('has no name for an action that is not on the list', () => {
    const named = Object.keys(EN).filter((k) => k.startsWith(PREFIX)).map((k) => k.slice(PREFIX.length));
    expect(named.filter((a) => !ACTIONS.includes(a))).toEqual([]);
  });

  it.each(['en', ...OTHER_LOCALES] as const)('%s names read as a phrase: no full stop, no placeholder', (locale) => {
    const names = Object.entries(BUNDLES[locale]).filter(([k]) => k.startsWith(PREFIX));
    expect(names.filter(([, v]) => /[.{}]\s*$|\{/.test(v)).map(([k]) => k)).toEqual([]);
  });
});
