import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';
import { PRIVACY } from '../src/legal.js';

/**
 * Privacy on the calendar link (D-538, Piper; a68, 11 October 2026).
 *
 * A member can make a secret address that a calendar app (Apple, Google, Outlook) follows. The company behind the
 * calendar fetches it from its own servers, not from the member's phone, so `privacy.s.what-we-keep.p11` (“your phone
 * asks Pam”) does not describe it and this line says it itself. Read from the edge function and the migration:
 *   - the address is 256 random bits; Pam stores only its SHA-256, so it can never show it again;
 *   - by default an event says only “Pam visit”, its time and a link to Trips; a switch adds the place's name and address;
 *   - anyone who has the address can read the visits; “Make a new link” stops the old one; “Turn it off” deletes the row;
 *   - Pam's own code records nothing about a read, but the gateway log holds the request path, which carries the address,
 *     with the time and the caller's IP address for as long as the plan keeps logs: so the line does not say that Pam
 *     keeps no record of when the calendar asked (`p11`'s “within a week” applies to it too).
 * The checks on the code start the day Piper's calendar link is on main.
 */
describe('Privacy on the calendar link (D-538)', () => {
  const p6 = EN['privacy.s.sharing.p6'] ?? '';
  const p12 = EN['privacy.s.what-we-keep.p12'] ?? '';
  const sharing = PRIVACY.sections.find((s) => s.id === 'sharing');
  const keep = PRIVACY.sections.find((s) => s.id === 'what-we-keep');

  it('come after the Google map and the request log, in “Who else gets your information” and “What we keep”', () => {
    expect(sharing?.bodyKeys[5]).toBe('privacy.s.sharing.p6');
    expect(keep?.bodyKeys[11]).toBe('privacy.s.what-we-keep.p12');
  });

  it('says who gets the visits: the company behind the calendar, which Pam does not know, not the phone', () => {
    expect(p6).toMatch(/^If you make a calendar link, your visits go to the company behind the calendar you add it to, such as Apple, Google or Microsoft\. Pam does not know which one\./);
    expect(p6).not.toMatch(/your phone/i);
  });

  it('says what an event holds by default and with the switch', () => {
    expect(p6).toMatch(/Each visit says only “Pam visit” and its time, unless you turn on the place’s name and address\./);
    // The event text is English whatever the member's language, so the quoted words stay English in every translation.
  });

  it('says anyone with the link can see the visits, what a new link and turning it off do, and that copies may stay', () => {
    expect(p6).toMatch(/Anyone who has the link can see your visits, so keep it to yourself\./);
    expect(p6).toMatch(/If you make a new link, the old one stops working\./);
    expect(p6).toMatch(/If you turn it off, Pam stops sending your visits at once, but your calendar may keep the ones it already has\.$/);
  });

  it('says what Pam keeps and what the servers write down, with the calendar company’s IP address, not the member’s', () => {
    expect(p12).toMatch(/^Pam keeps only a scrambled copy of your calendar link, so it cannot show you the link again, and whether you turned on the place’s name and address\./);
    expect(p12).toMatch(/the servers that run Pam write down the link, the time and the IP address of the calendar company\./);
    expect(p12).toMatch(/It is deleted within a week\.$/);
    // Not “Pam does not record when it was read”: the server log does, for a short time.
    expect(p12).not.toMatch(/does not (keep|record)|never/i);
  });

  it('keeps the same limit as the request-log line, which the plan note in before-launch covers', () => {
    expect(EN['privacy.s.what-we-keep.p11']).toMatch(/it is deleted within a week\./);
    const list = readFileSync(fileURLToPath(new URL('../../../docs/before-launch.md', import.meta.url)), 'utf8');
    expect(list).toMatch(/privacy\.s\.what-we-keep\.p12/);
  });

  it('is true of the code, once it is on main: only a hash is stored, and the address is never logged', () => {
    const root = fileURLToPath(new URL('../../../', import.meta.url));
    const handler = join(root, 'supabase/functions/calendar-feed/handler.ts');
    const migrations = join(root, 'packages/db/migrations');
    if (!existsSync(handler)) return;
    const code = readFileSync(handler, 'utf8');
    expect(code, 'the feed hashes the address').toMatch(/SHA-256/);
    expect(code, 'the feed does not write the address anywhere').not.toMatch(/console\.(log|info|debug)\(/);
    const migration = readdirSync(migrations).filter((f) => /calendar/.test(f)).map((f) => readFileSync(join(migrations, f), 'utf8')).join('\n');
    expect(migration, 'only the hash of the address is stored').toMatch(/token_hash\s+text not null unique/);
    const table = /create table if not exists public\.calendar_feeds \(([\s\S]*?)\n\);/.exec(migration)?.[1] ?? '';
    expect(table, 'the table definition was not found').not.toBe('');
    expect(table, 'the address itself is not a column (the function makes it, hands it back once and forgets it)').not.toMatch(/^\s*token\s/m);
    expect(migration, 'the table is closed to every client').toMatch(/calendar_feeds_no_client/);
  });
});
