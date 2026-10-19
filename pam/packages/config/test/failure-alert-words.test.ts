import { describe, expect, it } from 'vitest';
import { BUNDLES, EN, OTHER_LOCALES } from './_bundles.js';

/**
 * The failure alert says one thing per kind of failure (D-618; Sage's words, signed at ab6b9cc4, Lena's translations).
 *
 * Three lines tell the person which button to tap, in quotes, and the quoted words have to be the words on that button in the same language, or the line
 * sends them looking for a button that is not there. The Help button is the Help screen's own name (`help.title`). The banner is 320px wide: Sage signed
 * titles of 32 characters or fewer and lines of 60 or fewer in English; the other languages run longer, so they are held to a little more, and the real
 * check is the 320 audit of the banner.
 */
const N = 'notice.malfunction.';
const KINDS = ['offline', 'timeout', 'signedOut', 'notAllowed', 'tooMany', 'changed', 'gone', 'server', 'wrongTime', 'refused'] as const;
const LOCALES = ['en', ...OTHER_LOCALES] as const;

describe('the failure alert: one title, one line per kind', () => {
  it.each(LOCALES)('%s has a title and a line for every kind, a second-failure pair and four buttons', (locale) => {
    const b = BUNDLES[locale];
    for (const kind of KINDS) {
      expect(b[`${N}${kind}.title`], `${kind}.title`).toBeTruthy();
      expect(b[`${N}${kind}.body`], `${kind}.body`).toBeTruthy();
    }
    for (const key of ['again.title', 'again.body', 'action.retry', 'action.signIn', 'action.reload', 'action.help']) expect(b[N + key], key).toBeTruthy();
  });

  it.each(LOCALES)('%s: the buttons a line names are the words on those buttons', (locale) => {
    const b = BUNDLES[locale];
    for (const kind of ['offline', 'timeout', 'server', 'refused'] as const) expect(b[`${N}${kind}.body`], `${kind}.body names Try again`).toContain(b[`${N}action.retry`]!);
    expect(b[`${N}changed.body`], 'changed.body names Show the latest').toContain(b[`${N}action.reload`]!);
    expect(b[`${N}action.help`], 'the Help button is the Help screen\'s name').toBe(b['help.title']);
  });

  it('English stays within what Sage signed for a 320px banner: titles 32 characters, lines 60', () => {
    for (const [key, value] of Object.entries(EN).filter(([k]) => k.startsWith(N) && !k.includes('.action.'))) {
      expect(value.length, key).toBeLessThanOrEqual(key.endsWith('.title') ? 32 : 60);
    }
  });

  it.each(OTHER_LOCALES)('%s keeps its titles within 32 characters and its lines within 72, so they still wrap in two lines', (locale) => {
    const names = Object.entries(BUNDLES[locale]).filter(([k]) => k.startsWith(N) && !k.includes('.action.'));
    expect(names.filter(([k, v]) => v.length > (k.endsWith('.title') ? 32 : 72)).map(([k]) => k)).toEqual([]);
  });
});
