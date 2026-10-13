import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';

/**
 * Who can START a chat with whom, as the Privacy page says it (D-541, D-543; Will, 11 October: members must be able to
 * message a program before booking; the merge desk's rule, 20:43; Sage signed the sentence 20:55).
 *
 * The rule, for everyone: a member can start a chat with any program that has a lead on Pam (`message_program()`); a program
 * can start one with a member only if the member is signed up with it, or has a visit planned there that is not cancelled
 * (`can_start_conversation()`); otherwise a program can only answer a chat the member started. A message to a program makes a
 * conversation, not a link (DB test 68). The sentence says START, never "can't write first": a program can always answer, and can
 * start a chat with a member it has a tie to. "A program can never write first" is false and must not appear anywhere.
 * The database side is `64_who_can_write_enrollments_test.sql`, `67_message_a_program_before_booking_test.sql` and
 * `68_a_member_who_has_only_written_to_a_program_is_test.sql`.
 */
const sharing = EN['privacy.s.sharing.p2']!;
const SENTENCE =
  'A program can start a chat with you only if you are signed up with them or have a visit planned there. ' +
  'Otherwise only you can start one, and they can answer.';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const MIGRATION = `${REPO}packages/db/migrations/20261011203917_a_member_can_message_a_program_before_booking.sql`;

describe('the Privacy page says who can start a chat with a program', () => {
  it('ends the paragraph about what a program sees with the signed sentence', () => {
    expect(sharing.endsWith(SENTENCE)).toBe(true);
  });

  it('says "start", never that a program cannot write first', () => {
    for (const line of [sharing, ...Object.entries(EN).filter(([k]) => k.startsWith('privacy.') || k.startsWith('transparency.')).map(([, v]) => v)]) {
      expect(line).not.toMatch(/can(no|')?t write (to you )?first|never write first|cannot write to you first|can never (write|message|start)/i);
    }
  });

  it('keeps what a program sees before a visit and the three signed lines ahead of it', () => {
    expect(sharing).toContain('Before a visit, they see your first name, what you write to them');
    expect(sharing).toContain('If nobody marks you as there, the visit shows to them as missed a day after it ends. If you cancel, they stop seeing it.');
  });
});

describe.skipIf(!existsSync(MIGRATION))('and the database does what the sentence says (D-541 part 2, once it is on main)', () => {
  const sql = existsSync(MIGRATION) ? readFileSync(MIGRATION, 'utf8') : '';

  it('lets a program start a chat only through can_message() (signed up) or a visit that is not cancelled', () => {
    expect(sql).toMatch(/create or replace function public\.can_start_conversation/);
    expect(sql).toMatch(/select public\.can_message\(a, b\)/);
    expect(sql).toMatch(/ap\.status <> 'cancelled'/);
  });

  it('lets a member start one with a program through message_program(), which links nobody', () => {
    expect(sql).toMatch(/create or replace function public\.message_program\(p_service_id uuid\)/);
    expect(sql).toMatch(/NOT linked/);
  });
});
