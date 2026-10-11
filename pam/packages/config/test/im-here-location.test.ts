import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';
import { PRIVACY } from '../src/legal.js';
import { ADMIN_CANNOT_SEE, ADMIN_CAN_SEE, TRANSPARENCY_SCREEN } from '../src/transparency.js';

/**
 * "I'm here" asks the phone where it is (D-526 part B), and Privacy says what Pam does with that.
 *
 * Pam asks only when the member taps "I'm here" on a visit they planned, once, never in the background or on
 * a page load; the server checks the position against the place in the same call and keeps only that the
 * member was there, the time and how it was marked — never the position. The member can say "I went" instead
 * (fewer points, nothing else lost). This holds the Privacy paragraph to those facts, and the contract to
 * "a guide and a program cannot see where a member is". The database side is Piper's check-in test.
 */
describe('Privacy on “I’m here” and location (D-526 part B)', () => {
  const p9 = EN['privacy.s.what-we-keep.p9'] ?? '';
  const keep = PRIVACY.sections.find((s) => s.id === 'what-we-keep');

  it('is a paragraph of “What we keep”, after the ones already approved, and the search has its own after it', () => {
    expect(keep?.bodyKeys.at(-2)).toBe('privacy.s.what-we-keep.p9');
    expect(keep?.bodyKeys.at(-1)).toBe('privacy.s.what-we-keep.p10');
    expect(keep?.bodyKeys).toHaveLength(10);
  });

  it('says the same of “Use my current location” in a search: used for the search, not kept', () => {
    // Explore’s area picker sends the position to services_near / services_search for one query and stores nothing
    // (its note reads “Used for this search only.”). Piper’s log check, 11 October: both are POST calls with the
    // position in the body, no latitude or longitude in any URL or log. The gateway log does keep that this account
    // made the call, from this IP address, at this time, and an IP address is a rough location — so the page claims
    // the location the phone sends, not the call (“the location your phone sends”, not “where you are”).
    expect(EN['privacy.s.what-we-keep.p10']).toBe('When you search near you, Pam uses your phone’s location for that search and does not keep it.');
    expect(EN['places.area.hereNote']).toBe('Used for this search only.');
  });

  it('says when Pam asks: on a tap, once, never in the background', () => {
    expect(p9).toMatch(/When you tap “I’m here” on a visit you planned/);
    expect(p9).toMatch(/where you are, once/);
    expect(p9).toMatch(/only when you tap, never in the background/);
  });

  it('says what Pam keeps and that it does not keep the location the phone sends', () => {
    expect(p9).toMatch(/Pam does not keep the location your phone sends\./);
    expect(p9).not.toMatch(/does not keep where you are/); // too broad: the request log keeps the IP address and the time
    // Three ways to be marked: “I’m here” (checked against the place), “I went”, or the program. The page names all
    // three, so nobody has to guess what “how” means.
    expect(p9).toMatch(/keeps only that you were there, when, and who marked it: you, with “I’m here” or “I went”, or the program\./);
    expect(p9).toMatch(/to check that you are at the place/);
  });

  it('gives a way to say no that costs nothing but points, and does not name the points', () => {
    expect(p9).toMatch(/If you would rather not share your location, or your phone cannot find it, tap “I went” instead\./);
    expect(p9).toMatch(/fewer points and costs you nothing else/);
    expect(p9).not.toMatch(/\b\d+\b/); // a number of points or metres would be a promise that goes stale
  });

  it('quotes the two buttons as the app’s own words', () => {
    // The labels are Piper's strings; when they are in the bundle this reads them from it by key.
    const labels = Object.entries(EN).filter(([k]) => /^checkin\./.test(k)).map(([, v]) => v);
    if (labels.length) {
      expect(labels).toEqual(expect.arrayContaining(['I’m here', 'I went']));
    }
  });

  it('is one place where a member is told, and the contract says nobody can see where they are', () => {
    expect(ADMIN_CANNOT_SEE).toContain('member_location');
    expect(ADMIN_CAN_SEE.join(' ')).not.toMatch(/location|position/i);
    for (const line of TRANSPARENCY_SCREEN.canSee) expect(line.en).not.toMatch(/where you are|your location|your position/i);
  });
});
