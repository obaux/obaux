import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';
import { PRIVACY } from '../src/legal.js';

/**
 * Privacy on the Google Calendar sync (D-539, Piper; Sage signed 11 October 2026, 18:02). It merges WITH the switch
 * (`GOOGLE_SYNC_LIVE`), not before: the line first, then the switch.
 *
 * Read from the edge function `google-calendar`, which this test holds the paragraphs to:
 *   - one permission, `calendar.app.created`: Pam sees and changes only the calendar it made, never the member's own;
 *   - the calendar is called “Pam visits” and an event says “Pam visit” and the time (the same words as the calendar link);
 *   - the refresh token is sealed (AES-GCM, a key held as a function secret); the access token is never stored;
 *   - Disconnect always deletes Pam's own record; deleting the calendar and revoking the token are TRIED and their result told
 *     (`leftover`), so the line does not say "at once" and says what Pam does if Google doesn't answer;
 *   - what Pam keeps is the sealed key and a note of which visits it wrote (the event id) — nothing of what the calendar shows.
 */
const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const fn = (file: string) => readFileSync(join(ROOT, 'supabase/functions/google-calendar', file), 'utf8');
const migrations = () =>
  readdirSync(join(ROOT, 'packages/db/migrations'))
    .filter((f) => /google_calendar/.test(f))
    .map((f) => readFileSync(join(ROOT, 'packages/db/migrations', f), 'utf8'))
    .join('\n');

describe('Privacy on the Google Calendar sync (D-539)', () => {
  const p7 = EN['privacy.s.sharing.p7'] ?? '';
  const p13 = EN['privacy.s.what-we-keep.p13'] ?? '';
  const sharing = PRIVACY.sections.find((s) => s.id === 'sharing');
  const keep = PRIVACY.sections.find((s) => s.id === 'what-we-keep');

  it('comes after the calendar link’s paragraphs', () => {
    expect(sharing?.bodyKeys[6]).toBe('privacy.s.sharing.p7');
    expect(keep?.bodyKeys[12]).toBe('privacy.s.what-we-keep.p13');
  });

  it('says what Pam makes in Google and what goes in it, in the same words as the calendar link', () => {
    expect(p7).toMatch(/^If you connect Google Calendar, Pam makes one calendar called “Pam visits” in your Google account and puts your visits in it\./);
    expect(p7).toMatch(/Each visit says only “Pam visit” and its time, unless you turn on the place’s name and address\./);
    expect(fn('google.ts')).toMatch(/summary: 'Pam visits'/);
    expect(fn('event.ts')).toMatch(/summary: named \? `Pam visit: \$\{visit\.name\}` : 'Pam visit'/);
  });

  it('says Pam can see and change only that calendar, which the one permission it asks for allows', () => {
    expect(p7).toMatch(/Pam can see and change only that calendar, not your others\./);
    expect(fn('google.ts')).toMatch(/export const SCOPE = 'https:\/\/www\.googleapis\.com\/auth\/calendar\.app\.created';/);
    // If Google ever grants more, or less, Pam refuses it.
    expect(fn('google.ts')).toMatch(/granted\.length === 1 && granted\[0\] === SCOPE/);
  });

  it('says what disconnecting does, and what Pam does if Google does not answer, not “at once”', () => {
    expect(p7).toMatch(/If you disconnect, Pam deletes that calendar and gives up its access to your Google account\. If Google doesn’t answer, Pam tells you how to remove both yourself\./);
    expect(p7).not.toMatch(/at once|immediately|straight away/i);
    const handler = fn('handler.ts');
    // Pam's own record is deleted whatever Google says; the calendar and the token are tried and the result told.
    expect(handler).toMatch(/the row goes whatever Google says/);
    expect(handler).toMatch(/calendarRemoved, revoked/);
  });

  it('says what erasing an account does, and that Pam tries: the cleanup is let go after five runs', () => {
    expect(p7).toMatch(/If you delete your Pam account, Pam tries to delete the calendar and its access too\. What Google keeps/);
    const sql = migrations();
    expect(sql, 'erasing an account queues a cleanup before the profile goes').toMatch(/google_cleanups/);
    expect(sql).toMatch(/before delete on public\.profiles/i);
    expect(sql, 'a cleanup is let go after trying, so the line says “tries”').toMatch(/gave_up/);
  });

  it('says what Google keeps is Google’s, and makes no promise about it', () => {
    expect(p7).toMatch(/What Google keeps is up to Google\.$/);
    expect(p7).not.toMatch(/may not use|will not use|does not keep/i);
  });

  it('says what Pam keeps: a sealed key and a list of visits, deleted when you disconnect', () => {
    expect(p13).toBe(
      'If you connect Google Calendar, Pam keeps a sealed key that lets it change the calendar it made, and a list of which of your visits it put there. Pam deletes both when you disconnect.',
    );
    expect(fn('crypto.ts')).toMatch(/AES-GCM/);
    // The access token is never stored; the refresh token only sealed.
    expect(fn('handler.ts')).not.toMatch(/access_token_enc|accessTokenEnc/);
  });

  it('does not name Google’s own word for the permission', () => {
    for (const line of [p7, p13]) expect(line).not.toMatch(/calendar\.app\.created|scope|OAuth/i);
  });
});
