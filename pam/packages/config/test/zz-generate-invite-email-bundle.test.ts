import { it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { FONT_STACK, RIGHT_TO_LEFT, STAFF_INVITE_EMAIL } from '../src/invite-email.js';

/**
 * Not a test — a generator, like the dispatcher's. The deployed sender must
 * carry the exact wording the tests check, so it is produced from the source of
 * truth rather than retyped, and `reviewedBy` travels with it: a language
 * nobody has signed is not sent.
 */
it('writes the invite email bundle for the sender', () => {
  const dir = '../../supabase/functions/send-invite-emails';
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    `${dir}/bundle.json`,
    `${JSON.stringify({ locales: STAFF_INVITE_EMAIL, fonts: FONT_STACK, rtl: RIGHT_TO_LEFT }, null, 2)}\n`,
  );
});
