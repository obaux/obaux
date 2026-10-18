import { describe, expect, it } from 'vitest';
import { BUNDLES, EN, OTHER_LOCALES } from './_bundles.js';
import { PRIVACY } from '../src/legal.js';
import { ADMIN_CAN_SEE, PAM_TEAM_CAN_READ, TRANSPARENCY_I18N_KEYS, TRANSPARENCY_SCREEN } from '../src/transparency.js';

/**
 * What a member is told about Message Pam (D-605; card a101, signed by Will on 18 October 2026, 14:44; Sage's ledger fa8df003).
 *
 * The Pam team reading what a person writes to Pam is new: nobody at Pam reads a message body but one that was reported to them. It
 * is told on the legal pages and on the screen the promise "If this changes, we will tell you first" is printed on, in the same batch
 * as the conversation or before it (D-413, D-595's precedent), and not in the app where the person writes: "Keep the UI clean" (Will).
 *
 * The lines, and what each says that a test can hold:
 *
 *   L1  `privacy.s.what-we-keep.p17`  what is kept and who reads it: both directions ("or Pam writes to you", "what you both write"),
 *                                      only the Pam team, not the guide or a program, and the erasure of the whole conversation.
 *                                      Photos are not in it (Will: "no need to mention photos"); they are `what-we-keep.p3` and
 *                                      `how-long.p1`, and the guard entry says so.
 *   L2  `privacy.s.contact.p3`        the team can start a conversation, as Pam; it is in Messages; only the team can read it.
 *   L3  `privacy.s.limits.p2`, `terms.s.limits.p2`   a limited account can write to Pam and cannot send other messages.
 *   L4  `transparency.pam.*`, `transparency.summary.pam`   "What others can see": a card of its own, never in the guide's list.
 *
 * What the other six languages must keep is what a translator can lose: Pam stays Pam, and each line says Pam where the English does.
 */

const MESSAGE_PAM_KEYS = [
  'privacy.s.what-we-keep.p17',
  'privacy.s.contact.p3',
  'privacy.s.limits.p2',
  'terms.s.limits.p2',
  'transparency.pam.heading',
  'transparency.pam.messages',
  'transparency.summary.pam',
] as const;

describe('Message Pam: the English lines (a101)', () => {
  it('L1 says both directions, only the Pam team, and the whole conversation going with the account', () => {
    const p17 = EN['privacy.s.what-we-keep.p17']!;
    expect(p17).toContain('If you write to Pam in the app, or Pam writes to you, we keep what you both write.');
    expect(p17).toContain('Only the Pam team reads this conversation.');
    expect(p17).toContain("Your guide and your programs don't see it.");
    expect(p17).toContain('if you ask us to delete your account, we delete the whole conversation with it');
  });

  it('L1 does not mention photos: they are what-we-keep.p3 and how-long.p1 (Will, a101: "a hidden feature")', () => {
    expect(EN['privacy.s.what-we-keep.p17']!).not.toMatch(/photo|screenshot/i);
    expect(EN['transparency.pam.messages']!).not.toMatch(/photo|screenshot/i);
    expect(EN['transparency.summary.pam']!).not.toMatch(/photo|screenshot/i);
    expect(EN['privacy.s.what-we-keep.p3']!).toContain('photos');
    expect(EN['privacy.s.how-long.p1']!).toContain('photos');
  });

  it('L2 says the team can start a conversation, as Pam, in Messages, and only the team can read it', () => {
    expect(EN['privacy.s.contact.p3']).toBe(
      'The Pam team can start a conversation with you, as Pam. You will see it in Messages, and only the Pam team can read it.',
    );
  });

  it('L3: a limited account can read and write to Pam and send nothing else, on the Privacy page and in the Terms alike', () => {
    expect(EN['privacy.s.limits.p2']).toContain('A limited account can read messages and write to Pam, but cannot send other messages.');
    expect(EN['terms.s.limits.p2']).toContain('If an account is limited, it can read messages and write to Pam, but not send other messages.');
    // A paused account is as it was.
    expect(EN['privacy.s.limits.p2']).toContain('A paused account cannot sign in.');
    expect(EN['terms.s.limits.p2']).toContain('If an account is paused, it cannot sign in.');
    // Nothing about a limit on the messages to Pam (Will: "no limit there"): neither page mentions one.
    expect(EN['privacy.s.limits.p2']).not.toMatch(/limit(?!ed)/i);
  });

  it('L4: the card says both directions and who cannot see it; the short version says only the Pam team', () => {
    expect(EN['transparency.pam.heading']).toBe('The Pam team can see:');
    expect(EN['transparency.pam.messages']).toBe('What you and Pam write to each other. Your guide and your programs cannot see it.');
    expect(EN['transparency.summary.pam']).toBe('Only the Pam team can see what you and Pam write to each other.');
  });

  it('L1 and L4 tell the same claim: both directions, and only the Pam team', () => {
    const bothWays = /Pam writes to you|you and Pam write to each other/;
    const onlyTheTeam = /Only the Pam team|The Pam team can see|Your guide and your programs (don't|cannot) see it/;
    for (const key of ['privacy.s.what-we-keep.p17', 'transparency.pam.messages', 'transparency.summary.pam']) {
      expect(EN[key]!, `${key} says both directions`).toMatch(bothWays);
      expect(EN[key]!, `${key} says it is the Pam team`).toMatch(onlyTheTeam);
    }
  });
});

describe('Message Pam: where the lines are', () => {
  it('the Privacy page has the two new paragraphs, in the sections the guard and the page name', () => {
    const section = (id: string) => PRIVACY.sections.find((s) => s.id === id)!;
    expect(section('what-we-keep').bodyKeys).toContain('privacy.s.what-we-keep.p17');
    expect(section('contact').bodyKeys).toContain('privacy.s.contact.p3');
    expect(section('what-we-keep').bodyKeys).toHaveLength(17);
    expect(section('contact').bodyKeys).toHaveLength(3);
  });

  it('the Pam card is its own card on the transparency contract, and the guide\'s lists are not widened (PAM_TEAM_CAN_READ is a list of its own)', () => {
    expect(TRANSPARENCY_SCREEN.pamHeadingKey).toBe('transparency.pam.heading');
    expect(TRANSPARENCY_SCREEN.pam.map((l) => l.key)).toEqual(['transparency.pam.messages']);
    expect(TRANSPARENCY_SCREEN.pam.map((l) => l.en)).toEqual([EN['transparency.pam.messages']]);
    expect(TRANSPARENCY_SCREEN.pamHeading).toBe(EN['transparency.pam.heading']);
    for (const key of [TRANSPARENCY_SCREEN.pamHeadingKey, ...TRANSPARENCY_SCREEN.pam.map((l) => l.key), 'transparency.summary.pam']) {
      expect(TRANSPARENCY_I18N_KEYS, `${key} is walked by the completeness test`).toContain(key);
    }
    // A fact only the Pam team reads cannot stand under "Your guide can see": it would tell the member their guide reads it.
    const guideKeys = [...TRANSPARENCY_SCREEN.canSee, ...TRANSPARENCY_SCREEN.cannotSee, ...TRANSPARENCY_SCREEN.program].map((l) => l.key);
    for (const line of TRANSPARENCY_SCREEN.pam) expect(guideKeys).not.toContain(line.key);
    expect([...PAM_TEAM_CAN_READ]).toEqual(['messages_written_to_pam']);
    expect((ADMIN_CAN_SEE as readonly string[]).includes('messages_written_to_pam')).toBe(false);
  });
});

describe('Message Pam: the six other languages keep Pam', () => {
  for (const locale of OTHER_LOCALES) {
    it(`${locale} has every line, says Pam where the English does, and is not the English`, () => {
      for (const key of MESSAGE_PAM_KEYS) {
        const text = BUNDLES[locale][key];
        expect(text, `${locale} ${key}`).toBeTruthy();
        expect(text, `${locale} ${key} is translated`).not.toBe(EN[key]);
        expect(text!.includes('Pam'), `${locale} ${key} names Pam`).toBe(EN[key]!.includes('Pam'));
      }
    });
  }

  it('the limits lines keep Pam in every language: a limited account can write to Pam and to nobody else', () => {
    for (const locale of OTHER_LOCALES) {
      expect(BUNDLES[locale]['privacy.s.limits.p2']).toContain('Pam');
      expect(BUNDLES[locale]['terms.s.limits.p2']).toContain('Pam');
    }
  });
});

// The policies the lines say are true of (L1 "Only the Pam team reads this conversation", the erasure): every read policy on
// `messages`, `conversations`, `conversation_members` and the photo storage that Message Pam adds names `is_pam_team()` and
// `kind = 'support'`, none names the case-manager role or a program, and an erased asker takes the whole conversation. They arrive
// with Nico's migration 4 (the team's policies); this is where they are held when it is on `main`.
describe('Message Pam: the policies the lines are true of', () => {
  it.todo('every new read policy names is_pam_team() and kind = support, and none names the case manager or a program (migration 4)');
  it.todo('deleting the asker deletes the Pam conversation, its messages and its photos in storage (the after-delete trigger)');
});
