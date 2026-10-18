import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';
import { ADMIN_CANNOT_SEE, ADMIN_CAN_SEE, TRANSPARENCY_GROUPS, TRANSPARENCY_I18N_KEYS, TRANSPARENCY_SCREEN } from '../src/transparency.js';

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

describe('the audit row names the member where the six-month purge looks (D-443, D-595)', () => {
  // `purge_erased_audit()` deletes the rows whose actor_id or target_id is an erased account. A person named only in `meta` is
  // never found, and Privacy says an erased account's rows go six months later.
  const insert = book?.body.match(/insert\s+into\s+public\.audit_log\s*\(([^)]*)\)\s*values\s*\(([\s\S]*?)\)\s*;/i);

  it('is about the member: the target is the profile, and the lead is the actor', () => {
    expect(insert, 'book_visit_for_member writes one audit row').toBeTruthy();
    expect(insert![1]!.replace(/\s+/g, '')).toBe('actor_id,action,target_type,target_id,meta');
    expect(insert![2]!).toMatch(/^\s*caller\s*,\s*'visit\.booked_for_member'\s*,\s*'profile'\s*,\s*p_member_id\s*,/);
  });

  it('does not name the member again, or anybody else, in meta: only the visit and the place', () => {
    const meta = insert![2]!.slice(insert![2]!.indexOf('jsonb_build_object'));
    expect(meta).toMatch(/'appointment'\s*,\s*visit\.id/);
    expect(meta).toMatch(/'service'\s*,\s*svc\.id/);
    expect(meta).not.toMatch(/p_member_id|member_id|caller|lead|first_name|name/i);
  });
});

describe('the member can cancel it', () => {
  it('cancels any of the caller\'s own scheduled visits, whoever booked it', () => {
    expect(cancel, 'cancel_trip is in a migration').toBeDefined();
    expect(cancel!.body).toMatch(/where\s+id\s*=\s*p_id\s+and\s+member_id\s*=\s*caller\s+and\s+status\s*=\s*'scheduled'/);
    expect(cancel!.body).not.toMatch(/booked_by_org|provider_id/);
  });
});

describe('the Privacy paragraph Will signed (card a94, 17 October 15:21)', () => {
  it('says exactly what he signed, as the last paragraph of "sharing"', () => {
    expect(EN['privacy.s.sharing.p9']).toBe(
      "If you have written to a program, signed up with it or planned a visit there, it can book a visit for you. It shows in your Trips with the program's name, and you can cancel it.",
    );
    // Numbering has no gaps: one visit added to a calendar (a98, Will signed it 18 October) is the one after it, `sharing.p10`, and
    // the held Google calendar line (D-539) the one after that, `sharing.p11`.
    expect(EN['privacy.s.sharing.p10']).toMatch(/^If you add one visit to your calendar/);
    expect(EN['privacy.s.sharing.p11']).toBeUndefined();
    expect(EN['privacy.s.sharing.p8']).toBeDefined();
  });

  it('names the same three ways in as the function and the lead\'s list (`book.intro`, `book.empty`)', () => {
    expect(EN['privacy.s.sharing.p9']).toMatch(/written to a program, signed up with it or planned a visit there/);
    expect(EN['book.intro']).toMatch(/wrote to your program, signed up with it or planned a visit there/);
    expect(EN['book.empty']).toMatch(/written to your program, signed up with it or planned a visit there/);
  });
});

describe('the member is told what the guide sees of a booked visit, in four places that agree (a94, `ADMIN_CAN_SEE`)', () => {
  const GUIDE_FIELD = 'which_visits_a_program_booked_for_them';

  it('has the field in the contract, and not among the things a guide cannot see', () => {
    expect(ADMIN_CAN_SEE as readonly string[]).toContain(GUIDE_FIELD);
    expect(ADMIN_CANNOT_SEE as readonly string[]).not.toContain(GUIDE_FIELD);
  });

  it('says it on the guide\'s list once, in the contract\'s own words, in one of its groups', () => {
    const line = TRANSPARENCY_SCREEN.canSee.find((l) => l.key === 'transparency.canSee.bookedBy');
    expect(line?.en).toBe('Which of your visits a program booked for you.');
    expect(EN['transparency.canSee.bookedBy']).toBe(line!.en);
    expect(TRANSPARENCY_I18N_KEYS).toContain('transparency.canSee.bookedBy');
    expect(TRANSPARENCY_GROUPS.filter((g) => g.keys.includes('transparency.canSee.bookedBy'))).toHaveLength(1);
    // `canSee.appointments` is pinned elsewhere and is not edited for this.
    expect(EN['transparency.canSee.appointments']).toBe('Your visits, and if you went or missed one. A program sees the visits you plan there too.');
  });

  it('says it on the Privacy page where the guide is named, and on the staff\'s own list', () => {
    expect(EN['privacy.s.who-can-see.p1']).toMatch(/your visits and which ones a program booked for you, your points/);
    expect(EN['join.privacy.admin.2']).toBe(
      'The programs they sign up for and how they are going, their visits, which ones a program booked and if they went or missed one, and the names of the people they connect with, and if they are a mentor or buddy.',
    );
  });

  it('shows the guide "Booked by {program}" beside every booked visit, which is what Will signed (not only a missed one)', () => {
    expect(EN['person.trip.bookedBy']).toBe('Booked by {program}');
    const line = readFileSync(path.join(PAM, 'apps/web/src/lib/bookedByLine.ts'), 'utf8');
    expect(line).toMatch(/BOOKED_BY_SHOWN_ON:\s*'every'\s*\|\s*'missed'\s*=\s*'every'/);
    // Both screens that show the guide a member's visits go through the one rule.
    for (const file of ['apps/web/src/app/person/page.tsx', 'apps/web/src/screens/PastTripsView.tsx']) {
      expect(readFileSync(path.join(PAM, file), 'utf8'), file).toMatch(/showsBookedBy\(trip\)/);
    }
  });

  it('is an organisation the guide learns, never the lead: the migration adds no column that names a person', () => {
    const adds = MIGRATIONS.filter((m) => /alter\s+table\s+public\.appointments[\s\S]*?add\s+column/i.test(m.sql) && /booked_by/i.test(m.sql));
    expect(adds.map((m) => m.file)).toHaveLength(1);
    const columns = [...adds[0]!.sql.matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?(\w+)\s+([^,;]+)/gi)].map((m) => [m[1], m[2]!.trim()]);
    expect(columns).toEqual([['booked_by_org', expect.stringMatching(/^uuid references public\.orgs/)]]);
  });
});

describe('what the member sees on the card (Will, card a94: under the trip card say "booked for you", that is it)', () => {
  it('is "Booked for you", with no program name in it: the card\'s own title is the place', () => {
    expect(EN['trips.bookedForYou']).toBe('Booked for you');
    const card = readFileSync(path.join(PAM, 'packages/ui/src/TripCard.tsx'), 'utf8');
    expect(card).toMatch(/\{placeName\}/);
  });
});

describe('the Text reminders screen, which the carrier reads as the opt-in (Sage 06:15 and 06:20; Will signed)', () => {
  it('lists what it can send and covers a booked visit: "before each visit", not "a visit you planned"', () => {
    expect(EN['reminders.intro']).toBe(
      'Pam can text you the reminders and notes listed below. It is your choice, and you can change it whenever you want.',
    );
    expect(EN['reminders.what.1']).toBe('A reminder before each visit, with the address.');
    // No text goes to a member when a program books for them: the bell tells them (D-595), so no row for it.
    expect(EN['reminders.what.4']).toBeUndefined();
    expect(book!.body).not.toMatch(/outbound_messages|sms|twilio/i);
  });
});
