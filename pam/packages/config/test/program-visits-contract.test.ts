import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';
import { ADMIN_CANNOT_SEE, ADMIN_CAN_SEE, TRANSPARENCY_SCREEN } from '../src/transparency.js';

/**
 * A program sees the visits planned at its own program (D-526, attendance part A).
 *
 * `my_program_visits()` hands a program lead, for their own program only, every visit that is not
 * cancelled with the member's first name, the day and time, the service they picked and whether the
 * program marked them as there. That is a program seeing more of a member than before, so the contract
 * changes first and members are told before it ships (`CLAUDE.md`, `transparency.ts`): the contract
 * entry, the line on the transparency screen and the sentence on the Privacy page say the same thing.
 * The database side is `56_a_program_lead_reads_the_visits_at_their_own_test.sql`.
 */
describe('a program sees the visits planned at its own program (D-526)', () => {
  const appointments = TRANSPARENCY_SCREEN.canSee.find((l) => l.key === 'transparency.canSee.appointments');
  const sharing = EN['privacy.s.sharing.p2'];

  it('is in the contract, and a member’s trips to other programs still are not', () => {
    expect(ADMIN_CAN_SEE).toContain('visits_planned_at_their_own_program');
    expect(ADMIN_CANNOT_SEE).toContain('member_activity_for_a_program');
  });

  it('is said on the transparency screen, before it ships, in the line about visits', () => {
    expect(appointments?.en).toMatch(/\bA program sees the visits you plan there\b/);
    // The guide's half of the line is unchanged.
    expect(appointments?.en).toMatch(/^Your visits, and if you went or missed one/);
    // The screen and the English bundle are one text (copy.test.ts holds this for every line; named here for the reader).
    expect(EN['transparency.canSee.appointments']).toBe(appointments?.en);
  });

  it('is said on the Privacy page, with exactly what the program sees', () => {
    expect(sharing).toMatch(/after you write to them, sign their rules, sign up with them or plan a visit there/);
    expect(sharing).toMatch(/your first name, the day and time, the service you picked, and whether you were marked as there\. If nobody marks you as there/);
    // Not “they marked you”: a member can mark their own visit (“I’m here”, “I went”, D-535), and the program sees only that the
    // visit is there, never who marked it or how.
    expect(sharing).not.toMatch(/whether they marked you/);
    // The page says the visit is marked as there, by whoever marked it; it does not say "you came".
    expect(sharing).not.toMatch(/\byou (came|went|checked in)\b/i);
  });

  it('uses the same “whether you were marked as there” on the screens that list what the place sees, once they are on main', () => {
    // Piper’s trips.booked.hasLead and place.lead.sees (attendance part D) show BEFORE any mark exists, so they end
    // “whether you were marked as there” and Privacy carries the rest (Sage, 16:15). They are not on main yet: the check
    // starts on the day they land, and “they marked you” is no longer true of either.
    for (const key of ['trips.booked.hasLead', 'place.lead.sees']) {
      const line = EN[key];
      if (line === undefined) continue;
      expect(line, key).toMatch(/whether you were marked as there/);
      expect(line, key).not.toMatch(/whether they marked you/);
    }
    // There is no “marked this visit themselves” label: the lead cannot tell who marked a visit (Mira, 16:15).
    expect(EN['schedule.checkin.byMember']).toBeUndefined();
  });

  it('tells a member what they control: cancelling takes the visit away from the program', () => {
    expect(sharing).toMatch(/If you cancel, they stop seeing it\./);
  });

  it('does not promise the program only sees a member after sign-up, which stopped being true', () => {
    expect(sharing).not.toMatch(/only after you sign up with them,/);
  });

  it('gives a program no more than the first name: no last name, phone, address or photo is named as seen', () => {
    for (const line of [sharing, appointments?.en ?? '']) {
      expect(line).not.toMatch(/last name|phone number|address|photo/i);
    }
  });

  it('names the label a program sees on a visit nobody marked: missed, a day after it ends (part C)', () => {
    // The program sees `status`, so a visit nobody marked reaches it as "missed". A member is told that,
    // in the words of the fact (nobody marked it), not as a claim that they did not come.
    expect(sharing).toMatch(/If nobody marks you as there, the visit shows to them as missed a day after it ends\./);
    expect(sharing).not.toMatch(/\byou (missed|did not come|didn.t come)\b/i);
  });

  it('keeps the transparency line to the visits: the guide’s “went or missed” half is the guide’s, the sentence about a program is not a claim about who came', () => {
    expect(appointments?.en.split('A program sees')[1] ?? '').not.toMatch(/missed|went|came/i);
  });
  it('says a program never sees who marked a visit or how: the status, not the method (D-535)', () => {
    expect(ADMIN_CANNOT_SEE).toContain('who_marked_a_visit_or_how');
    expect(ADMIN_CAN_SEE).not.toContain('visit_marked_by_the_member_themselves');
    // So the Privacy page and the screen name no method to the program: not “checked in”, not “marked by”, not “I’m here”.
    for (const line of [sharing, appointments?.en ?? '']) {
      expect(line).not.toMatch(/checked in|marked by|who marked|I.m here|I went|marked it yourself|by position|by word/i);
    }
  });
});
