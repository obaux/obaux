import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';
import {
  ADMIN_CANNOT_SEE,
  ADMIN_CAN_SEE,
  TRANSPARENCY_GROUPS,
  TRANSPARENCY_I18N_KEYS,
  TRANSPARENCY_SCREEN,
} from '../src/transparency.js';

/**
 * What a program sees of a member before any visit (D-541; Will, 11 October, 20:22 and 20:24: "members must be
 * able to message a program before booking" and "communicate what programs can see, even before the person books").
 *
 * A member can write to a program with no sign-up and no visit. Before a visit a program's lead sees the member's first
 * name and what they write, and a first name and a date if the member signed its rules; after a sign-up, how it is
 * going; after a planned visit, the four things on a visit. Four places say it, and this holds them to one story:
 * the contract (`transparency.ts`), the Privacy page (`privacy.s.sharing.p2`), the "A program can see:" card and the
 * short version on the transparency screen, and the site's "What others can see" post. The database side is
 * `64_who_can_write_enrollments_test.sql` and the tests beside it.
 */
const sharing = EN['privacy.s.sharing.p2']!;
const program = TRANSPARENCY_SCREEN.program;
const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const site = readFileSync(`${REPO}apps/site/src/content/WhatOthersCanSee.tsx`, 'utf8').replace(/\s+/g, ' ');

/** The two sentences the Privacy page and the site both carry (the site's JSX wraps its lines). */
const FIRST = 'A program sees you only after you write to them, sign their rules, sign up with them or plan a visit there, and only what they need to help you.';
const BRIDGE =
  'Before a visit, they see your first name, what you write to them, the day you signed their rules and, if you signed up, how that is going and when you save a new place, but not which one.';

describe('the Privacy page says what a program sees, before a visit and for one', () => {
  it('names every way a program comes to see a member, and what it sees before a visit', () => {
    expect(sharing.startsWith(`${FIRST} ${BRIDGE} `)).toBe(true);
  });

  it('keeps the four things on a visit, and the two sentences after them, as Will signed them (a63, lines 2–4)', () => {
    expect(sharing).toContain(
      'For a visit, that is your first name, the day and time, the service you picked, and whether you were marked as there. ' +
        'If nobody marks you as there, the visit shows to them as missed a day after it ends. If you cancel, they stop seeing it.',
    );
  });

  it('no longer says a program sees a member only after they sign up', () => {
    expect(sharing).not.toMatch(/only after you sign up with them/);
  });

  it('never names more than a first name: no last name, phone number, address, photo, note or points', () => {
    expect(sharing).not.toMatch(/last name|phone|address|photo|\bnote\b|points|level/i);
  });
});

describe('the transparency screen has a card for what a program can see', () => {
  it('has its own heading, because the first list is headed "Your guide can see:"', () => {
    expect(TRANSPARENCY_SCREEN.programHeading).toBe('A program can see:');
    expect(TRANSPARENCY_SCREEN.canSeeHeading).toBe('Your guide can see:');
    expect(TRANSPARENCY_I18N_KEYS).toContain('transparency.program.heading');
    for (const line of program) expect(TRANSPARENCY_I18N_KEYS).toContain(line.key);
  });

  it('says first name and what you write first, and the condition for all of it', () => {
    expect(program[0]?.en).toBe('Your first name, once you write to it, sign its rules, sign up or plan a visit there.');
    expect(program[1]?.en).toBe('What you write to it, even before you plan a visit.');
  });

  it('says a program sees when a member saved a place, never which, and only after a sign-up (P10, D-199)', () => {
    expect(program.find((l) => l.key === 'transparency.program.saves')?.en).toBe(
      'When you save a new place — not which one. Only after you sign up with it.',
    );
    // The same two facts, in the Privacy page's words and on the site, and the guide's list still says it too.
    expect(sharing).toContain('if you signed up, how that is going and when you save a new place, but not which one.');
    expect(TRANSPARENCY_SCREEN.canSee.find((l) => l.key === 'transparency.canSee.saves')?.en).toContain('A program you joined sees this too.');
    expect(site).toContain("cells: ['Yes', 'Yes, but only once you sign up with them', 'No']");
  });

  it('says the day a member signed its rules, and never the signature', () => {
    expect(program.find((l) => l.key === 'transparency.program.signed')?.en).toBe(
      'The day you signed its rules. Never your signature.',
    );
  });

  it('gives the four things on a visit in the words of the Privacy page', () => {
    expect(program.find((l) => l.key === 'transparency.program.visits')?.en).toBe(
      'The visits you plan there: the day and time, the service you picked, and whether you were marked as there.',
    );
    expect(sharing).toContain('the day and time, the service you picked, and whether you were marked as there');
  });

  it('keeps a program-only fact out of the list headed "Your guide can see:"', () => {
    // No case manager reads a member's signature, or what they write to a program.
    for (const line of TRANSPARENCY_SCREEN.canSee) {
      expect(line.en, line.key).not.toMatch(/\bits rules\b|policies you sign|write to (it|a program)/i);
    }
    expect(EN['transparency.canSee.signed']).toBeUndefined();
    expect(TRANSPARENCY_GROUPS.flatMap((g) => [...g.keys])).not.toContain('transparency.canSee.signed');
  });

  it('says it once more, short, in the short version', () => {
    expect(EN['transparency.summary.program']).toBe(
      'A program sees your first name and what you write to them, even before you plan a visit.',
    );
  });

  it('never names more than a program sees: no last name, phone, address, note or points', () => {
    for (const line of program) expect(line.en, line.key).not.toMatch(/last name|phone|address|photo|\bnote\b|points|level|signature picture/i);
  });
});

describe('the contract says it, and says what stays hidden', () => {
  it('lists what a program sees before a visit and when a member signed its rules', () => {
    expect(ADMIN_CAN_SEE).toContain('first_name_and_words_to_a_program_they_message');
    expect(ADMIN_CAN_SEE).toContain('first_name_and_day_signed_on_a_programs_policy');
    expect(ADMIN_CAN_SEE).toContain('visits_planned_at_their_own_program');
  });

  it('keeps hidden what two gaps found on 11 October would have shown, and what a program never sees of a member', () => {
    // A lead could read whole appointment rows (the member's note, how a visit was marked); members and leads could write
    // enrollments (D-541, test 64). Both are being closed, not disclosed: nothing a member reads says otherwise, and the
    // contract names them as hidden so a later session cannot quietly widen them.
    for (const field of [
      'the_note_a_member_keeps_on_a_visit',
      'who_marked_a_visit_or_how',
      'a_sign_up_written_by_the_member_or_a_lead_directly',
      'member_activity_for_a_program',
    ] as const) {
      expect(ADMIN_CANNOT_SEE, field).toContain(field);
      expect(ADMIN_CAN_SEE as readonly string[], field).not.toContain(field);
    }
  });

  it('says nothing to a member that a program reads a note, who marked a visit, or how', () => {
    const lines = [sharing, ...program.map((l) => l.en), ...TRANSPARENCY_SCREEN.canSee.map((l) => l.en), EN['transparency.summary.program']!];
    for (const line of lines) {
      expect(line).not.toMatch(/\bnote\b|who marked|marked it|how you were marked|attendance method|check-in code/i);
    }
  });
});

describe('the site says the same true thing', () => {
  it('carries the Privacy page’s two sentences word for word', () => {
    expect(site).toContain(FIRST);
    expect(site).toContain(BRIDGE);
  });

  it('no longer says a program sees a member only after they sign up', () => {
    expect(site).not.toMatch(/only after you sign up with them/);
  });

  it('names a program, not "a program you joined", because writing to one or signing its rules needs no sign-up', () => {
    expect(site).toContain("columns={['Your guide', 'A program', 'Other members']}");
    expect(site).not.toMatch(/A program you joined/);
  });

  it('says a program reads what you write to it before a visit, and only the day you signed its rules', () => {
    expect(site).toContain('Yes, if you write to them, even before you plan a visit');
    expect(site).toContain('Yes, the day only. Never your signature');
    // A case manager and other members read neither.
    expect(site).toMatch(/The day you signed a program’s rules', cells: \['No', 'Yes, the day only\. Never your signature', 'No'\]/);
  });
});

/**
 * The code behind the hidden list (D-542, a63): once Piper's two migrations are on main, what a lead can read of a visit and of a
 * member is exactly what the Privacy page says, and the contract's hidden entries name what stays out of it.
 */
const NARROW = `${REPO}packages/db/migrations/20261011060000_a_program_lead_reads_no_appointment_row_directly.sql`;
const CARD = `${REPO}packages/db/migrations/20261011203852_a_program_lead_reads_a_small_card_for_a_member_linked_to.sql`;

describe.skipIf(!existsSync(NARROW))('a lead reads no appointment row (20261011060000)', () => {
  const sql = existsSync(NARROW) ? readFileSync(NARROW, 'utf8') : '';

  it('has no policy that lets a lead read the table: the visit’s four things come through a function', () => {
    expect(sql).toMatch(/alter policy appointments_provider_select on public\.appointments using \(false\)/);
  });

  it('is why the contract can keep the member’s note and how a visit was marked hidden', () => {
    for (const field of ['the_note_a_member_keeps_on_a_visit', 'who_marked_a_visit_or_how'] as const) {
      expect(ADMIN_CANNOT_SEE).toContain(field);
    }
  });
});

describe.skipIf(!existsSync(CARD))('the lead’s card is a first name and the visits at its own program (20261011203852)', () => {
  const sql = existsSync(CARD) ? readFileSync(CARD, 'utf8') : '';
  const keysOf = (text: string) => [...text.matchAll(/'([a-z_]+)'\s*,/g)].map((m) => m[1]);

  it('returns exactly a member id, a first name and the visits', () => {
    expect(sql).toContain("return jsonb_build_object('member_id', p_member_id, 'first_name', name, 'visits', visits);");
  });

  it('puts into each visit only what the Privacy page names: the day and time, the service, and whether it is marked as there', () => {
    const visit = /jsonb_agg\(jsonb_build_object\(([^)]*?)\) order by/s.exec(sql)?.[1] ?? '';
    expect(keysOf(visit)).toEqual(['appointment_id', 'starts_at', 'ends_at', 'status', 'service_name', 'checked_in_at']);
  });

  it('never selects a note, how a visit was marked, a last name or a phone number', () => {
    const code = sql.replace(/--[^\n]*/g, '');
    expect(code).not.toMatch(/\bnote\b|attendance_method|check_in_code|last_name|\bphone\b|location_text|\bgeo\b/);
  });

  it('is for a program lead only, and for a member linked to the program', () => {
    expect(sql).toMatch(/NOT_A_PROGRAM_LEAD/);
    expect(sql).toMatch(/MEMBER_NOT_LINKED/);
    expect(ADMIN_CAN_SEE).toContain('first_name_and_words_to_a_program_they_message');
    expect(ADMIN_CAN_SEE).toContain('visits_planned_at_their_own_program');
  });
});
