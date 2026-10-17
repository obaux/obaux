import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';

/**
 * A program books a visit for a member (D-595; Will's option A, card a94, 17 October 2026).
 *
 * The Privacy paragraph that goes with it (Sage's draft, a8021404: "If you have written to a program, signed up with it or
 * planned a visit there, it can book a visit for you. It shows in your Trips with the program's name, and you can cancel it.")
 * is a promise about four things, and each is a property of the database that a test can hold:
 *
 *   1. who may be booked for: a member who wrote to the program, signed up with it or planned a visit there, and nobody else
 *      (`book_visit_for_member`, and `my_program_bookable_members()` for the list the lead picks from, which says the same);
 *   2. what a lead reads of such a member: a first name, never anything else (the list returns an id and a first name);
 *   3. what the booking does: it puts a visit on the member's Trips and tells them by the bell. It pays no points and sends no text
 *      (texts are off, and the registered campaign does not name this one: `docs/before-launch.md`);
 *   4. that the member can cancel it: `cancel_trip` cancels any of the caller's own scheduled visits, whoever booked it.
 *
 * The first name is already covered by Privacy (`sharing.p2`, `transparency.program.firstName`: a program sees your first name once
 * you write to it, sign up or plan a visit there), so this adds no words; it holds the new function to them. The paragraph itself is
 * checked here from the day it is in the bundles.
 */

const PAM = fileURLToPath(new URL('../../../', import.meta.url));
const MIGRATION_DIR = path.join(PAM, 'packages/db/migrations');
const MIGRATIONS = readdirSync(MIGRATION_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((file) => ({ file, sql: readFileSync(path.join(MIGRATION_DIR, file), 'utf8').replace(/--.*$/gm, '') }));

/** The newest definition of a public function: its header (up to `as $$`), its body and the file it is in. */
function latest(name: string): { file: string; header: string; body: string; sql: string } | undefined {
  const re = new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${name}\\s*\\(([\\s\\S]*?)\\bas\\s+\\$\\$([\\s\\S]*?)\\$\\$`, 'i');
  const hits = MIGRATIONS.filter((m) => re.test(m.sql));
  const last = hits.at(-1);
  const match = last?.sql.match(re);
  return last && match ? { file: last.file, header: match[1] ?? '', body: match[2] ?? '', sql: last.sql } : undefined;
}

const book = latest('book_visit_for_member');
const list = latest('my_program_bookable_members');
const cancel = latest('cancel_trip');
const bookedBy = latest('my_trip_booked_by');

describe('who a program may book a visit for (Privacy: written to, signed up with, or planned a visit there)', () => {
  it('is checked against exactly those three, by the booking function', () => {
    expect(book, 'book_visit_for_member is in a migration').toBeDefined();
    const check = book!.body.slice(book!.body.indexOf("raise exception 'MEMBER_NOT_LINKED'") - 1800, book!.body.indexOf("raise exception 'MEMBER_NOT_LINKED'"));
    expect(check).toMatch(/public\.conversation_members/);
    expect(check).toMatch(/public\.enrollments/);
    expect(check).toMatch(/public\.appointments/);
    // Signing a program's rules alone is not one of the three.
    expect(book!.body).not.toMatch(/policy_signatures|signatures/i);
  });

  it('is for a program lead of that organisation, for one of its own live places, and for an active member', () => {
    expect(book!.body).toMatch(/NOT_A_PROGRAM_LEAD/);
    expect(book!.body).toMatch(/s\.org_id\s*=\s*org/);
    expect(book!.body).toMatch(/m\.role\s*=\s*'member'\s+and\s+m\.access_status\s*=\s*'active'/);
  });

  it('is refused to anyone signed out, and to anyone but a signed-in caller', () => {
    expect(book!.sql).toMatch(/revoke\s+all\s+on\s+function\s+public\.book_visit_for_member\([^)]*\)\s+from\s+public\s*,\s*anon/i);
    expect(book!.sql).toMatch(/grant\s+execute\s+on\s+function\s+public\.book_visit_for_member\([^)]*\)\s+to\s+authenticated/i);
  });

  it('leaves out anyone either side has blocked', () => {
    expect(book!.body).toMatch(/public\.blocks/);
  });
});

describe('what a lead reads of the members it can book for: a first name', () => {
  it('returns an id and a first name, and nothing else about the person', () => {
    expect(list, 'my_program_bookable_members is in a migration').toBeDefined();
    expect(list!.header).toMatch(/returns\s+table\s*\(\s*member_id\s+uuid\s*,\s*first_name\s+text\s*\)/i);
    expect(list!.body).toMatch(/select\s+m\.id\s*,\s*m\.first_name\s+from\s+known\s+k/i);
    expect(list!.body).not.toMatch(/\b(last_name|home_city|phone|photo_url|bio|tags|home_zip|last_active_at|preferred_language)\b/i);
  });

  it('lists the same three ways in, each member once', () => {
    expect(list!.body).toMatch(/public\.conversation_members/);
    expect(list!.body).toMatch(/public\.enrollments/);
    expect(list!.body).toMatch(/public\.appointments/);
    expect(list!.body).toMatch(/\bunion\b/i);
    expect(list!.body).toMatch(/public\.blocks/);
  });

  it('is for an active program lead only, and not for anon', () => {
    expect(list!.body).toMatch(/p\.role\s*=\s*'provider'\s+and\s+p\.access_status\s*=\s*'active'/);
    expect(list!.sql).toMatch(/revoke\s+all\s+on\s+function\s+public\.my_program_bookable_members\(\)\s+from\s+public\s*,\s*anon/i);
    expect(list!.sql).toMatch(/grant\s+execute\s+on\s+function\s+public\.my_program_bookable_members\(\)\s+to\s+authenticated/i);
  });
});

describe('what the booking does: a visit on Trips and the bell, no points, no text', () => {
  it('tells the member by the bell, to the member alone, and sends no text', () => {
    expect(book!.body).toMatch(/public\.notify\(\s*array\[p_member_id\]\s*,\s*'visit_booked_for_you'/);
    expect(book!.body).not.toMatch(/outbound_messages|sms|twilio/i);
  });

  it('pays no points', () => {
    expect(book!.body).not.toMatch(/points_ledger|award_points|points_for/i);
  });

  it('keeps who booked it out of what the member can read: only the visit ids come back', () => {
    expect(bookedBy, 'my_trip_booked_by is in a migration').toBeDefined();
    expect(bookedBy!.header).toMatch(/returns\s+table\s*\(\s*appointment_id\s+uuid\s*\)/i);
  });
});

describe('the member can cancel it', () => {
  it('cancels any of the caller\'s own scheduled visits, whoever booked it', () => {
    expect(cancel, 'cancel_trip is in a migration').toBeDefined();
    expect(cancel!.body).toMatch(/where\s+id\s*=\s*p_id\s+and\s+member_id\s*=\s*caller\s+and\s+status\s*=\s*'scheduled'/);
    expect(cancel!.body).not.toMatch(/booked_by_org|provider_id/);
  });
});

describe('the Privacy paragraph, once it is on the page', () => {
  it('names the same three ways in, and the Trips and cancel promises', () => {
    const line = Object.entries(EN).find(([key, text]) => key.startsWith('privacy.s.') && /can book a visit for you/.test(text));
    if (!line) return;
    expect(line[1]).toMatch(/written to a program, signed up with it or planned a visit there/);
    expect(line[1]).toMatch(/shows in your Trips with the program's name, and you can cancel it/);
  });
});
