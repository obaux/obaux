import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';
import { PRIVACY } from '../src/legal.js';

/**
 * Privacy on the Trips map (a67, 11 October 2026): the map comes from Google, and what Google gets.
 *
 * Read from `TripsMap.tsx`: where a key is set, the browser loads Google's Maps script and Google serves the tiles.
 * The pins are drawn on the phone, so Google is not given a trip's name, time or id. The map used to be fitted to the
 * trips (`fitBounds`), so the tiles Google served were the area that holds them, and with one trip a single block: the
 * line would have had to say Google "can tell roughly where they are" (Sage's first version said the opposite, which was
 * not true). Mira decided instead (11 October) that the map always opens on the whole city and never on the pins, so
 * "the part of the map you look at" is what a member chose to look at. This test holds the code to that: if the map
 * is fitted to the pins again, the line is untrue and must be rewritten with Will. The host guard
 * (`third-party-hosts.test.ts`) holds the last sentence: nothing else in the app or on the website loads from Google.
 */
describe('Privacy on the Google map in Trips (a67)', () => {
  const p5 = EN['privacy.s.sharing.p5'] ?? '';
  const sharing = PRIVACY.sections.find((s) => s.id === 'sharing');
  const code = readFileSync(fileURLToPath(new URL('../../../apps/web/src/screens/TripsMap.tsx', import.meta.url)), 'utf8');

  it('is the last paragraph of “Who else gets your information”', () => {
    expect(sharing?.bodyKeys.at(-1)).toBe('privacy.s.sharing.p5');
  });

  it('says the map comes from Google, and that Google gets the IP address and the part of the map looked at', () => {
    expect(p5).toMatch(/^The map in Trips comes from Google\./);
    expect(p5).toMatch(/Google gets your phone’s IP address and the part of the map you look at\./);
  });

  it('is true that the map opens on the whole city, never fitted to the trips, so the part of it Google serves is the member’s choice', () => {
    expect(
      code,
      'TripsMap fits the map to the pins (fitBounds), so Google is served the area that holds a member’s trips. Open it on the city (setCenter(CITY), zoom 12), or change Privacy with Will first.',
    ).not.toMatch(/fitBounds\(/);
    expect(code).toMatch(/setCenter\(CITY\)/);
    expect(p5).not.toMatch(/area around your trips|where they are/);
  });

  it('is true that Google is not given the trips: the script is asked for with the key and nothing else', () => {
    expect(code).toMatch(/script\.src = `https:\/\/maps\.googleapis\.com\/maps\/api\/js\?key=\$\{encodeURIComponent\(KEY\)\}`;/);
  });

  it('says the map is the only part of Pam that loads anything from Google, and makes no promise about what Google does with it', () => {
    expect(p5).toMatch(/The map is the only part of Pam that loads anything from Google\.$/);
    expect(p5).not.toMatch(/may not use|will not use|does not keep|deletes/i);
  });
});
