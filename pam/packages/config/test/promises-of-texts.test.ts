import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUNDLES } from './_bundles.js';

/**
 * A line on screen must not say Pam will remind you, or text you before a visit, while no such
 * text is sent (Will, 10 October 2026: say only what Pam does). The day it is sent, one line is
 * flipped in two places, and the lines that were made true for today are put back
 * (`docs/before-launch.md` › *Visit reminders go live*).
 *
 * The site holds the switch (`apps/site/src/content/flags.ts`, `VISIT_REMINDERS_LIVE`); this
 * constant is the app's copy of it (`apps/web/src/lib/visitRemindersLive.ts`, which also drives the "Coming soon" badge on the visit-reminder
 * row), and a test fails if the two disagree, so neither is flipped alone.
 */
const APP_FLAG = fileURLToPath(new URL('../../../apps/web/src/lib/visitRemindersLive.ts', import.meta.url));
const appFlag = /export const VISIT_REMINDERS_LIVE_IN_APP = (true|false);/.exec(readFileSync(APP_FLAG, 'utf8'));
const VISIT_REMINDERS_LIVE_IN_APP = appFlag?.[1] === 'true';

const SITE_FLAGS = fileURLToPath(new URL('../../../apps/site/src/content/flags.ts', import.meta.url));

// "Pam reminds you", "Pam reminds people for you", "we will remind you", "We can text you the day before".
const PROMISES_A_REMINDER = /\bremind(s|ed)? (you|people|them|me)\b|\bwill remind\b|\bwe can text you\b.*\bday before\b/i;

describe('promises of a text or a reminder (D-474)', () => {
  it('the app and the site agree on whether visit reminders are live', () => {
    const flag = /export const VISIT_REMINDERS_LIVE = (true|false);/.exec(readFileSync(SITE_FLAGS, 'utf8'));
    expect(flag, 'VISIT_REMINDERS_LIVE not found in apps/site/src/content/flags.ts').not.toBeNull();
    expect(
      VISIT_REMINDERS_LIVE_IN_APP,
      'VISIT_REMINDERS_LIVE changed on the site: set it here too, and put back the lines in docs/before-launch.md › Visit reminders go live',
    ).toBe(flag?.[1] === 'true');
  });

  it.runIf(!VISIT_REMINDERS_LIVE_IN_APP)('no English line says Pam reminds you while no reminder is sent', () => {
    const said = Object.entries(BUNDLES.en)
      .filter(([, words]) => PROMISES_A_REMINDER.test(words))
      .map(([key, words]) => `${key}: ${words}`);
    expect(said, 'These lines promise a reminder Pam does not send yet. Say what Pam does today.').toEqual([]);
  });

  it.runIf(!VISIT_REMINDERS_LIVE_IN_APP)('the flag thank-you does not promise that people who saved the place are told', () => {
    // The only way a saver hears a place was removed is the saved-place text, held with the others
    // (texts_live, D-481); no bell row is made for them. Put the sentence back with the texts.
    expect(BUNDLES.en['flag.done.body']).not.toMatch(/\bis told\b|\bwill be told\b|\bwe will (tell|text)\b/i);
  });

  it('the Text reminders screen marks what is not sent yet with the badge word, not a sentence (D-608)', () => {
    // The two lists (member, staff) carry "Coming soon" on every row whose text is not sent (`textKindsFor`, which `lib/textKinds.test.ts`
    // pins). Texts are held until Will says go (texts_live, D-481). The lines that said it in a sentence are retired, so nothing says
    // "Pam does not send any of these yet" on the screen any more.
    expect(BUNDLES.en['common.comingSoon']).toBe('Coming soon');
    // (Profile's card says it with the same badge now: `profile.promo.reminders.body` is gone, so nothing there to pin.)
  });
});
