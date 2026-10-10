import { it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  FONT_STACK,
  INVITE_EMAIL,
  INVITE_EMAIL_MORE,
  RIGHT_TO_LEFT,
  STAFF_INVITE_EMAIL,
} from '../src/invite-email.js';
import { SUPPORTED_LOCALES } from '../src/i18n.js';

/**
 * Not a test — a generator, like the dispatcher's. The deployed sender must
 * carry the exact wording the tests check, so it is produced from the source of
 * truth rather than retyped, and `reviewedBy` travels with it: a language
 * nobody has signed is not sent.
 */
it('writes the invite email bundle for the sender', () => {
  // The email with a fresh link (Will, 4 October): English and Spanish are signed together, the rest each on their own.
  const linkLocales = Object.fromEntries(
    SUPPORTED_LOCALES.map((l) => [
      l,
      l === 'en' || l === 'es'
        ? { reviewedBy: INVITE_EMAIL.reviewedBy, copy: INVITE_EMAIL[l] }
        : INVITE_EMAIL_MORE[l],
    ]),
  );
  const dir = '../../supabase/functions/send-invite-emails';
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    `${dir}/bundle.json`,
    `${JSON.stringify({ locales: STAFF_INVITE_EMAIL, linkLocales, fonts: FONT_STACK, rtl: RIGHT_TO_LEFT }, null, 2)}\n`,
  );
});
