import { describe, expect, it } from 'vitest';
import { BUNDLES, EN } from './_bundles.js';
import { PRIVACY } from '../src/legal.js';
import { SUPPORTED_LOCALES } from '../src/i18n.js';

/**
 * Privacy's line about counting how many phones open Your points and Profile (a76; Will signed it 13 October 2026 04:24 UTC; Sage's words from
 * Iris's plan; Nico builds the counter and it ships in the same batch, never before).
 *
 * The line names two screens, so each language names them the way the app does: a reader who looks for "Your points" and "Profile" must
 * find the words on their own screens. It also carries the one number that is a promise (under 5 shows only as "under 5"), so every
 * language has to carry that 5. The checks on the counter itself (what the table can hold, who can read it, the note on the phone) are
 * written against Nico's migration when it is on a branch.
 */
const KEY = 'privacy.s.what-we-keep.p13';

describe('Privacy on counting how many phones open Your points and Profile (a76)', () => {
  const section = PRIVACY.sections.find((s) => s.id === 'what-we-keep');

  it('is the last paragraph of “What we keep”', () => {
    expect(section?.bodyKeys.at(-1)).toBe(KEY);
  });

  it('says what is counted, what is in the number, and what shows in a report, in the words Will signed', () => {
    const text = EN[KEY]!.replace(/’/g, "'").replace(/[“”]/g, '"');
    expect(text).toBe(
      'Each day, we count how many phones opened Your points and your Profile. It is one number for each screen, for everyone together. It has no name, phone number or account in it, so it can\'t show who opened what. To count each phone only once a day, your phone keeps a note that stays on it. In our reports, a number under 5 shows only as "under 5".',
    );
  });

  for (const locale of SUPPORTED_LOCALES) {
    it(`${locale}: names the two screens as the app does and carries the number 5`, () => {
      const text = BUNDLES[locale][KEY]!;
      expect(text, `${locale} must say the app's name for Your points`).toContain(BUNDLES[locale]['points.title']!);
      expect(text, `${locale} must say the app's name for Profile`).toContain(BUNDLES[locale]['profile.title']!);
      expect(text.match(/5/g)?.length, 'the number under which a count is not shown').toBe(2);
    });
  }
});
