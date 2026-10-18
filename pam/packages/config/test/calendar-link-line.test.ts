import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUNDLES, EN, OTHER_LOCALES } from './_bundles.js';
import { PRIVACY } from '../src/legal.js';
import { intlLocale } from '../src/i18n.js';

/**
 * Privacy on the calendar link and on adding one visit (D-538, D-604; a98 plan C; Will signed the three lines on 18 October 2026, 01:46,
 * Sage's ledger f5d64686 for p12, bb474f6d for the one-visit line and e1956821 for p6, word for word).
 *
 * A member can make a secret address that a calendar app (Apple, Google, Outlook) follows, and can add one visit to a calendar from
 * the booked card. What the lines promise, and what the code must keep true for them to stay honest:
 *   - Pam does not save the address. It keeps a random id and a version number (the address is made from them with a key only the
 *     database holds, and made again whenever the member asks), which calendar the member said they use, and the day they linked it.
 *     So `calendar_links` has exactly those columns and no column that could hold the address, a hash of it, or what is in an event.
 *   - Each visit shows the place's name and address and its time, and nothing else: the event's lines are exactly those (a switch for
 *     the place no longer exists).
 *   - Pam's own code records nothing about a read: the gateway log holds the request path (which carries the address), the time and
 *     the caller's IP address, for as long as the plan keeps logs ("deleted within a week", as `p11`).
 *   - One visit added from the booked card goes nowhere through Pam: the file is made on the phone and the Google link is a tap.
 *   - A link made before the new way keeps saying only "Pam visit" and its time, and the line says since which day (the day this
 *     went live: the Privacy page's "Last updated" day, moved by `legal:date`).
 */
const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('Privacy on the calendar link and on one visit (D-538, D-604)', () => {
  const p6 = EN['privacy.s.sharing.p6'] ?? '';
  const p10 = EN['privacy.s.sharing.p10'] ?? '';
  const p12 = EN['privacy.s.what-we-keep.p12'] ?? '';
  const sharing = PRIVACY.sections.find((s) => s.id === 'sharing');
  const keep = PRIVACY.sections.find((s) => s.id === 'what-we-keep');

  it('are in "Who else gets your information" (p6, and p10 after the program booking line) and "What we keep" (p12)', () => {
    expect(sharing?.bodyKeys[5]).toBe('privacy.s.sharing.p6');
    expect(sharing?.bodyKeys[9]).toBe('privacy.s.sharing.p10');
    expect(sharing?.bodyKeys).toHaveLength(10);
    expect(keep?.bodyKeys[11]).toBe('privacy.s.what-we-keep.p12');
    // Numbering has no gaps: the held Google calendar line (D-539) is the one after p10.
    expect(EN['privacy.s.sharing.p11']).toBeUndefined();
  });

  it('p6 says who gets the visits, what an event shows, who can see it, and what a new link, disconnecting and an older link do', () => {
    expect(p6).toMatch(/^If you make a calendar link, your visits go to the company behind the calendar you add it to, such as Apple, Google or Microsoft\./);
    expect(p6).toMatch(/Each visit shows the place's name and address and its time, so anyone who has the link, or who can see your calendar, can see where you are going and when\./);
    expect(p6).toMatch(/Keep the link to yourself\./);
    expect(p6).toMatch(/If you make a new link, the old one stops working\./);
    expect(p6).toMatch(/If you disconnect it, Pam stops sending your visits at once, but your calendar may keep the ones it already has\./);
    expect(p6).toMatch(/A link made before \d{1,2} [A-Z][a-z]+ keeps showing only “Pam visit” and its time until you make a new one\.$/);
    // It no longer says "Pam does not know which one" (Pam keeps which calendar the member said they use) or "unless you turn on".
    expect(p6).not.toMatch(/does not know|unless you turn/i);
  });

  it('p6\'s date is the day it went live, the Privacy page\'s "Last updated" day, in every language', () => {
    const { date } = JSON.parse(readFileSync(join(ROOT, 'packages/config/src/legal-updated.json'), 'utf8')).privacy as { date: string };
    const day = (locale: string) =>
      new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : intlLocale(locale), { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
    expect(p6, 'en').toContain(day('en'));
    for (const locale of OTHER_LOCALES) {
      expect((BUNDLES as Record<string, Record<string, string>>)[locale]!['privacy.s.sharing.p6'], `${locale} p6 carries ${day(locale)}`).toContain(day(locale));
    }
  });

  it('p10 says what one visit does: it goes to the calendar the member picks, Pam does not see which, and it is a copy', () => {
    expect(p10).toMatch(/^If you add one visit to your calendar, it goes to the calendar you choose: a file your phone opens in Apple Calendar, Outlook or another calendar, or a link that opens Google Calendar with the visit filled in\./);
    expect(p10).toMatch(/For one visit, Pam does not see which calendar you choose\./);
    expect(p10).toMatch(/The visit shows the place's name and address and its time, so anyone who can see that calendar can see where you are going and when\./);
    expect(p10).toMatch(/It is a copy: if the visit moves or is cancelled, the copy does not change\. To keep every visit up to date, use a calendar link instead\.$/);
  });

  it('p12 says what Pam keeps and what the servers write down, with the calendar company\'s IP address, not the member\'s', () => {
    expect(p12).toMatch(/^Pam does not save your calendar link with the rest of your information\. Instead it keeps a secret code it can make the link from again, so it can show you the link whenever you ask\./);
    expect(p12).toMatch(/It also notes which link is your newest, so an older one stops working, and which calendar you told Pam you use and the day you linked it\./);
    expect(p12).toMatch(/the servers that run Pam write down the link, the time and the IP address of the calendar company\./);
    expect(p12).toMatch(/It is deleted within a week\.$/);
    // Not "Pam does not record when it was read": the server log does, for a short time.
    expect(p12).not.toMatch(/does not (keep|record)|\bnever\b|scrambled/i);
  });

  it('keeps the same limit as the request-log line, which the plan note in before-launch covers', () => {
    expect(EN['privacy.s.what-we-keep.p11']).toMatch(/it is deleted within a week\./);
    expect(read('docs/before-launch.md')).toMatch(/privacy\.s\.what-we-keep\.p12/);
  });

  it('is true of the table: a random id, a version, which calendar and the day, and nothing that holds the address', () => {
    const migrations = join(ROOT, 'packages/db/migrations');
    const sql = readdirSync(migrations)
      .filter((f) => /calendar/.test(f))
      .map((f) => readFileSync(join(migrations, f), 'utf8').replace(/--.*$/gm, ''))
      .join('\n');
    const body = /create table if not exists public\.calendar_links \(([\s\S]*?)\n\);/.exec(sql)?.[1] ?? '';
    expect(body, 'the calendar_links definition was not found').not.toBe('');
    const columns = body
      .split('\n')
      .map((l) => /^\s*([a-z_]+)\s+(uuid|bigint|text|date)\b/.exec(l)?.[1])
      .filter(Boolean);
    expect(columns, 'what Pam keeps about a link').toEqual(['member_id', 'lookup_id', 'version', 'calendar', 'linked_on']);
    expect(body, 'no column can hold the address, a hash of it, or what an event says').not.toMatch(/token|hash|secret|url|link\b|details|place|address/i);
    expect(sql, 'the table is closed to every client').toMatch(/calendar_links_no_client/);
    expect(sql, 'the key that makes the address is in the vault, not in the table').toMatch(/vault\.decrypted_secrets/);
  });

  it('is true of the feed: it writes no log line of its own for a request, only an error message when the database fails', () => {
    const code = stripComments(read('supabase/functions/calendar-feed/handler.ts') + read('supabase/functions/calendar-feed/index.ts'));
    expect(code, 'nothing is logged on a good request').not.toMatch(/console\.(log|info|debug|warn)\(/);
    const errors = code.match(/console\.error\([^)]*\)/g) ?? [];
    for (const e of errors) expect(e, 'an error line carries a message, never the address').not.toMatch(/token|url|path|member|calendar_link/i);
  });

  it('is true of an event: the name, the address, the time, and nothing about the member or Pam', async () => {
    const { linkEventLines } = await import('../../../supabase/functions/calendar-feed/ics');
    const event = linkEventLines({ id: 'v1', starts_at: '2026-11-02T15:00:00Z', ends_at: null, name: 'Fresh Start Kitchen', address: '1234 Market St, Philadelphia' } as never, new Date('2026-10-18T00:00:00Z'));
    const names = event.map((l) => l.split(':')[0]);
    expect(names).toEqual(['BEGIN', 'UID', 'DTSTAMP', 'DTSTART', 'DTEND', 'SUMMARY', 'LOCATION', 'TRANSP', 'END']);
    expect(event.join('\n')).not.toMatch(/URL|DESCRIPTION|ATTENDEE|ORGANIZER|pam visit/i);
  });

  it('is true of one visit: nothing is sent to Pam or stored, the file is made on the phone and Google is a tap', () => {
    const code = stripComments(read('apps/web/src/screens/AddVisitToCalendar.tsx'));
    expect(code, 'no request, no database, no storage').not.toMatch(/fetch\(|\.rpc\(|createClient|lib\/supabase|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB/i);
    expect(code, 'the file is made here').toMatch(/URL\.createObjectURL\(new Blob\(/);
    expect(code, 'Google is a link the person taps').toMatch(/googleEventUrl\(/);
  });

  it('is true of an older link: it keeps saying only "Pam visit" and its time', () => {
    const ics = stripComments(read('supabase/functions/calendar-feed/ics.ts'));
    expect(ics).toMatch(/'Pam visit'|"Pam visit"|SUMMARY:Pam visit/);
  });
});
