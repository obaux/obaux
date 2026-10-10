import { describe, expect, it } from 'vitest';
import { BUNDLES } from './_bundles.js';
import {
  LEGAL_DOCUMENTS,
  PRIVACY,
  PRIVACY_VISIBILITY_SECTION,
  legalKeys,
} from '../src/legal.js';
import { ADMIN_CANNOT_SEE, TRANSPARENCY_SCREEN } from '../src/transparency.js';
import { MESSAGE_TRANSLATION } from '../src/translation.js';
import { fleschKincaidGrade, findDignityViolations } from '../src/language.js';

const en = BUNDLES.en;
const bundles: Record<string, Record<string, string>> = BUNDLES;

describe('the privacy notice and the terms', () => {
  it.each(LEGAL_DOCUMENTS.map((d) => [d.id, d] as const))(
    '%s has every string in every language',
    (_id, doc) => {
      for (const key of legalKeys(doc)) {
        for (const [locale, bundle] of Object.entries(bundles)) {
          expect(bundle[key], `${key} missing in ${locale}`).toBeTruthy();
        }
      }
    },
  );

  it.each(LEGAL_DOCUMENTS.map((d) => [d.id, d] as const))(
    '%s has unique section anchors, so a link goes one place',
    (_id, doc) => {
      const ids = doc.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    },
  );

  it('never uses a word that reduces somebody to their record', () => {
    const legal = Object.fromEntries(
      LEGAL_DOCUMENTS.flatMap((doc) =>
        legalKeys(doc).flatMap((k) => Object.entries(BUNDLES).map(([locale, bundle]) => [`${locale}.${k}`, bundle[k]!])),
      ),
    ) as Record<string, string>;
    expect(findDignityViolations(legal)).toEqual([]);
  });

  it('reads at roughly the level the rest of Pam does', () => {
    // Legal pages are where plain language usually goes to die. The rule here is
    // the same one the product is held to: if the median paragraph is harder
    // than the app, the page is not doing its job.
    const grades = LEGAL_DOCUMENTS.flatMap((doc) =>
      legalKeys(doc)
        .map((k) => en[k as keyof typeof en] as string)
        .filter((v) => v.split(/\s+/).length >= 6)
        .map((v) => fleschKincaidGrade(v)),
    ).sort((a, b) => a - b);

    const median = grades[Math.floor(grades.length / 2)]!;
    expect(median, `median grade ${median.toFixed(1)}`).toBeLessThanOrEqual(7);
  });
});

describe('the privacy page and the transparency screen agree', () => {
  /**
   * The transparency screen is shown after somebody joins. The privacy page is
   * what they can read before. If the page promised more than the screen — or
   * less — the quieter one would be the real contract, and nobody reads the
   * quieter one.
   */
  const visibility = PRIVACY.sections.find((s) => s.id === PRIVACY_VISIBILITY_SECTION);

  it('the privacy page carries a section about who can see what', () => {
    expect(visibility).toBeDefined();
  });

  it('it repeats the same limits the screen states', () => {
    const text = visibility!.bodyKeys
      .map((k) => (en[k as keyof typeof en] as string).toLowerCase())
      .join(' ');

    // Each promise the screen makes about what an admin CANNOT see has to be
    // restated here. These are the three that matter most to somebody deciding
    // whether to type their number in.
    // Whose messages is said in so many words: the messages to OTHER people.
    // A guide does see what you send them (see below), so a bare "cannot read
    // your messages" would promise something the screen does not (Will,
    // 10 October 2026: the page and the screen read as a contradiction).
    expect(text).toMatch(/cannot read your messages to other people/);
    expect(text).not.toMatch(/cannot read your messages(?! to other people)/);
    expect(text).toMatch(/buddies/);
    expect(text).toMatch(/not on their list/);

    // And the exceptions, stated as exceptions rather than buried: what you
    // send the guide directly, and one reported message.
    expect(text).toMatch(/reports it as not safe/);
  });

  it('says a guide sees what you send them, as the screen does', () => {
    const text = visibility!.bodyKeys.map((k) => (en[k as keyof typeof en] as string).toLowerCase()).join(' ');
    expect(text).toMatch(/everything you say or send to them, when they message you directly/);
    const direct = TRANSPARENCY_SCREEN.canSee.find((l) => l.key === 'transparency.canSee.directMessages');
    expect(direct?.en).toMatch(/everything you say or send to them, if they message you directly/i);
    const cannot = TRANSPARENCY_SCREEN.cannotSee.find((l) => l.key === 'transparency.cannotSee.messages');
    expect(cannot?.en).toMatch(/to someone else/);
  });

  it('names photos wherever it names messages (D-394)', () => {
    // A photo is part of a message, and nobody reading "your messages" should
    // have to guess whether that includes the pictures. Both the page and the
    // screen say so in words.
    const text = visibility!.bodyKeys.map((k) => (en[k as keyof typeof en] as string).toLowerCase()).join(' ');
    expect(text).toMatch(/cannot read your messages to other people, or see the photos/);
    expect(text).toMatch(/its photo/);
    const flagged = TRANSPARENCY_SCREEN.canSee.find((l) => l.key === 'transparency.canSee.flagged');
    expect(flagged?.en).toMatch(/message, photo/);
  });

  it('names documents wherever it names photos (D-399)', () => {
    // A PDF or a Word file is sent as it is — unlike a photo, nothing is
    // taken out of it — and a Google Docs link is Google's to share, not
    // Pam's. The page says both, and every line about who sees a photo says
    // the same of a document.
    const keep = PRIVACY.sections
      .flatMap((s) => s.bodyKeys)
      .map((k) => en[k as keyof typeof en] as string)
      .join(' ');
    expect(keep).toMatch(/messages, photos and documents you send/);
    expect(keep).toMatch(/sends it just as it is/);
    expect(keep).toMatch(/Google decides who can see that doc, not Pam/);
    const text = visibility!.bodyKeys.map((k) => (en[k as keyof typeof en] as string).toLowerCase()).join(' ');
    expect(text).toMatch(/photos or documents you send to other people/);
    expect(text).toMatch(/its photo or document/);
    const flagged = TRANSPARENCY_SCREEN.canSee.find((l) => l.key === 'transparency.canSee.flagged');
    expect(flagged?.en).toMatch(/message, photo or document/);
  });

  it('says that Pam\'s server opens a shared link for its preview, and the phone does not (D-407)', () => {
    const keep = PRIVACY.sections
      .flatMap((s) => s.bodyKeys)
      .map((k) => en[k as keyof typeof en] as string)
      .join(' ');
    expect(keep).toMatch(/Pam's server opens the page once/);
    expect(keep).toMatch(/Your phone does not visit the page until you tap the link/);
    expect(ADMIN_CANNOT_SEE).toContain('message_link_previews');
  });

  it('promises to tell members before the list changes, exactly as the screen does', () => {
    const page = visibility!.bodyKeys.map((k) => en[k as keyof typeof en] as string).join(' ');
    expect(page).toMatch(/we will tell you first/i);
    expect(TRANSPARENCY_SCREEN.footer).toMatch(/we will tell you first/i);
  });
});

describe('messages read in the reader’s language (D-423)', () => {
  const TRANSLATION_KEYS = ['title', 'p1', 'p2', 'p3'].map((k) => `privacy.s.translation.${k}`);

  it('is off until somebody turns it on (and Will has been told)', () => {
    // Flip MESSAGE_TRANSLATION.enabled only with the items in
    // docs/before-launch.md done. This test is here so that is a decision,
    // not a side effect: it will fail, and whoever flips it updates it.
    expect(MESSAGE_TRANSLATION.enabled).toBe(false);
  });

  it('is on the privacy page exactly when it is true — never before, never after', () => {
    const says = PRIVACY.sections.some((s) => s.id === 'translation');
    expect(says).toBe(MESSAGE_TRANSLATION.enabled);
    if (!MESSAGE_TRANSLATION.enabled) {
      // While it is off, nothing on the page claims or hints at it.
      for (const key of legalKeys(PRIVACY)) {
        expect(en[key as keyof typeof en] as string, key).not.toMatch(/translat/i);
      }
    }
  });

  it('is already written in every language, so turning it on cannot ship a gap', () => {
    for (const key of TRANSLATION_KEYS) {
      for (const [locale, bundle] of Object.entries(bundles)) {
        expect(bundle[key], `${key} missing in ${locale}`).toBeTruthy();
      }
    }
  });

  it('tells people what is sent, what is not, and what is kept', () => {
    const text = TRANSLATION_KEYS.map((k) => en[k as keyof typeof en] as string).join(' ');
    expect(text).toMatch(/sends the words/i);
    expect(text).toMatch(/not get your name, your phone number/i);
    expect(text).toMatch(/keeps nothing/i);
    expect(text).toMatch(/Only the people in that chat/i);
    expect(text).toMatch(/can be wrong/i);
  });

  it('reads like the rest of the page and never reduces anybody to their record', () => {
    const strings = Object.fromEntries(
      TRANSLATION_KEYS.flatMap((k) => Object.entries(bundles).map(([locale, bundle]) => [`${locale}.${k}`, bundle[k]!])),
    );
    expect(findDignityViolations(strings)).toEqual([]);
    for (const k of TRANSLATION_KEYS.slice(1)) {
      expect(fleschKincaidGrade(en[k as keyof typeof en] as string), k).toBeLessThanOrEqual(9);
    }
  });
});

/**
 * A promise on a screen is a promise Pam keeps (Will, 10 October 2026, via the merge desk: "every screen that
 * promises something Pam doesn't do is built to keep the promise or rewritten", D-465). Two were found that
 * were not true; these keep their wording true to what is built.
 */
describe('promises that are kept (D-465)', () => {
  it('does not say a program sees the last day a member used Pam: the database does not give it to one (0062)', () => {
    const line = TRANSPARENCY_SCREEN.canSee.find((l) => l.key === 'transparency.canSee.lastActive');
    expect(line?.en).toBe('The last day you used Pam.');
    expect(line?.en).not.toMatch(/program/i);
    // In every language: the one sentence, and nothing about a program after it.
    for (const [locale, bundle] of Object.entries(bundles)) {
      const text = bundle['transparency.canSee.lastActive'] as string;
      expect(text.split(/[.。]/).filter(Boolean), `${locale}: one sentence`).toHaveLength(1);
    }
    // A program does see when a member saved a new place, and the line that says so stays.
    const saves = TRANSPARENCY_SCREEN.canSee.find((l) => l.key === 'transparency.canSee.saves');
    expect(saves?.en).toMatch(/A program you joined sees this too/);
  });

  it('says where blocking is, and never that the other person will not know (they are told: D-463)', () => {
    const privacy = en['privacy.s.your-choices.p3'] as string;
    const terms = en['terms.s.being-decent.p3'] as string;
    // The control is in a conversation's ⋯ menu ("Block this person", messages.block.*).
    expect(privacy).toMatch(/⋯ menu/);
    expect(terms).toMatch(/⋯ menu/);
    // "anyone" was never true: you block a person you talk to.
    expect(terms).not.toMatch(/block anyone/i);
    // The blocked person sees that messages are blocked (messages.blocked.theirs.*).
    expect(terms).not.toMatch(/will not know|won't know|not be told/i);
    expect(terms).toMatch(/will see that messages are blocked/);
    // Every language names the ⋯ menu too, so none keeps the old words.
    for (const [locale, bundle] of Object.entries(bundles)) {
      expect(bundle['privacy.s.your-choices.p3'], `${locale} privacy`).toContain('⋯');
      expect(bundle['terms.s.being-decent.p3'], `${locale} terms`).toContain('⋯');
    }
  });
});

describe('the mail service, said before the first email goes out (D-482, a21)', () => {
  it('says what Will approved, word for word, on the privacy page', () => {
    // Will approved this English on 10 October 2026, 14:37 UTC (a21). Change it only with him.
    expect(en['privacy.s.sharing.p4']).toBe(
      'When Pam emails a case manager or a program, a company that sends email for us gets the email address and the email. It may not use them for anything else.',
    );
  });

  it('is the last paragraph of "Who else gets your information", in every language', () => {
    const sharing = PRIVACY.sections.find((s) => s.id === 'sharing');
    expect(sharing?.bodyKeys.at(-1)).toBe('privacy.s.sharing.p4');
    for (const [locale, bundle] of Object.entries(bundles)) {
      const text = bundle['privacy.s.sharing.p4'];
      expect(text, `${locale} has it`).toBeTruthy();
      // Not a copy of the English: a language that has not been translated would fall back to it.
      if (locale !== 'en') expect(text, `${locale} is translated`).not.toBe(en['privacy.s.sharing.p4']);
    }
  });
});
