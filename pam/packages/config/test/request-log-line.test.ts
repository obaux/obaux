import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';
import { PRIVACY } from '../src/legal.js';

/**
 * Privacy says what the servers write down about every request (a66, Piper's log check of 11 October 2026).
 *
 * What the gateway and the sign-in log keep, from the live project: the time, the part of Pam asked for (the
 * path, and for a GET its query string: ids and states only, `no-typed-text-in-urls.test.ts`), the account's id,
 * the IP address, the kind of phone or browser, and at sign-in the phone number. Nothing from a request's body:
 * no message, no search word, no location. Retention follows the plan: Supabase Free keeps logs a day, Pro 7,
 * Team 28; Vercel's request records are an hour (Hobby) to a day (Pro). "Within a week" is true on Free and on
 * Pro and must change before the Supabase plan goes to Team (`docs/before-launch.md`, request log).
 */
describe('Privacy on the request log (a66)', () => {
  const p11 = EN['privacy.s.what-we-keep.p11'] ?? '';
  const keep = PRIVACY.sections.find((s) => s.id === 'what-we-keep');

  it('is the last paragraph of “What we keep”', () => {
    expect(keep?.bodyKeys.at(-1)).toBe('privacy.s.what-we-keep.p11');
  });

  it('lists what is written down, including the IP address and, at sign-in, the phone number', () => {
    expect(p11).toMatch(/write down when, what it asked for, which account, the IP address, and the kind of phone or browser/);
    expect(p11).toMatch(/When you sign in, they also write down your phone number\./);
  });

  it('says what is not written down: messages and searches (held by the guard on GET filters and the POST bodies)', () => {
    expect(p11).toMatch(/They do not write down your messages or what you search for\./);
    // Not “never what you typed”: the phone number typed at sign-in is in the sign-in log.
    expect(p11).not.toMatch(/what you typed|anything you type/i);
  });

  it('says an IP address is a rough location, so the page does not claim Pam keeps no trace of where you are', () => {
    expect(p11).toMatch(/An IP address shows roughly where you are, such as your city\./);
  });

  it('says why and for how long, with a limit that holds on both plans the project may be on', () => {
    expect(p11).toMatch(/to keep Pam working and safe/);
    expect(p11).toMatch(/it is deleted within a week\./);
    expect(p11).not.toMatch(/short time|a few days|one day|1 day/i);
  });

  it('does not contradict the location paragraphs: they claim the location the phone sends, not the call', () => {
    expect(EN['privacy.s.what-we-keep.p9']).toMatch(/does not keep the location your phone sends/);
    expect(EN['privacy.s.what-we-keep.p10']).toMatch(/your phone’s location for that search and does not keep it/);
  });

  it('is pinned to the plan facts in before-launch, which says to change the line before the plan goes to Team', () => {
    const list = readFileSync(fileURLToPath(new URL('../../../docs/before-launch.md', import.meta.url)), 'utf8');
    expect(list).toMatch(/privacy\.s\.what-we-keep\.p11/);
    expect(list).toMatch(/Team/);
  });
});
