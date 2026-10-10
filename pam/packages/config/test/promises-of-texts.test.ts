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
 * constant is the app's copy of it, and a test fails if the two disagree, so neither is flipped alone.
 */
const VISIT_REMINDERS_LIVE_IN_APP = false;

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

  it('the Text reminders screen still says what is and is not sent today', () => {
    // The honest line each of the two opt-in screens carries (D-453); the lists above it say "would".
    expect(BUNDLES.en['reminders.today.member']).toMatch(/only one/i);
    expect(BUNDLES.en['reminders.today.staff']).toMatch(/does not send any/i);
  });
});
