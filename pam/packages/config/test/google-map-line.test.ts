import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';
import { PRIVACY } from '../src/legal.js';

/**
 * Privacy on the Trips map (a67, 11 October 2026): the map comes from Google, and what Google gets.
 *
 * Read from `TripsMap.tsx`: where a key is set, the browser loads Google's Maps script and Google serves the tiles.
 * The pins are drawn on the phone, so Google is not given a trip's name, time or id; but the map is fitted to the
 * trips (`fitBounds`), so the part of the map it serves is the area that holds them, and with one trip a single block.
 * That is why the line says Google "can tell roughly where they are". Sage first wrote “but not where your trips are”;
 * it was not true, and this test keeps it out. The host guard (`third-party-hosts.test.ts`) holds the last sentence:
 * nothing else in the app or on the website loads from Google.
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

  it('says the map opens on the area around the trips, so Google can tell roughly where they are', () => {
    expect(p5).toMatch(/The map opens on the area around your trips, so Google can tell roughly where they are, but not their names or times\./);
    expect(p5).not.toMatch(/but not where your trips are|not where (they|your trips) are/i);
    // True because the map is fitted to the trips; if that changes, loosen the line, don’t keep a promise the code no longer makes.
    expect(code).toMatch(/fitBounds\(/);
  });

  it('is true that Google is not given the trips: the script is asked for with the key and nothing else', () => {
    expect(code).toMatch(/script\.src = `https:\/\/maps\.googleapis\.com\/maps\/api\/js\?key=\$\{encodeURIComponent\(KEY\)\}`;/);
  });

  it('says the map is the only part of Pam that loads anything from Google, and makes no promise about what Google does with it', () => {
    expect(p5).toMatch(/The map is the only part of Pam that loads anything from Google\.$/);
    expect(p5).not.toMatch(/may not use|will not use|does not keep|deletes/i);
  });
});
