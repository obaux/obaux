import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';
import { ADMIN_CANNOT_SEE, ADMIN_CAN_SEE, PAM_TEAM_CAN_READ, TRANSPARENCY_SCREEN } from '../src/transparency.js';

/**
 * What the Pam team reads is a list of its own (D-605), so the guide's list is never widened by it and the two cannot be confused.
 * These hold the shape. The lines that tell a member about it (Privacy, the transparency screen, Terms) are Lena's, and are added to this
 * file's checks when they are on `main`; they must be live before the switch is turned on (D-413). They are here from a101 (Will signed
 * them on 18 October, 14:44); `message-pam-line.test.ts` holds their words.
 */
describe('PAM_TEAM_CAN_READ (D-605)', () => {
  it('has the one entry Will asked for: the messages written to Pam', () => {
    expect([...PAM_TEAM_CAN_READ]).toEqual(['messages_written_to_pam']);
  });

  it('never appears in the guide\'s list: ADMIN_CAN_SEE does not change', () => {
    for (const field of PAM_TEAM_CAN_READ) {
      expect((ADMIN_CAN_SEE as readonly string[]).includes(field), `${field} is in ADMIN_CAN_SEE`).toBe(false);
    }
  });

  it('is told to the person on the Privacy page (what-we-keep.p17) and on the transparency screen (the Pam card), and in no list of the guide\'s (a101)', () => {
    expect(EN['privacy.s.what-we-keep.p17']).toContain('Only the Pam team reads this conversation.');
    expect(TRANSPARENCY_SCREEN.pamHeading).toBe('The Pam team can see:');
    expect(TRANSPARENCY_SCREEN.pam.length).toBeGreaterThan(0);
  });

  it('does not widen what the guide cannot see: message bodies stay out of the guide\'s reach', () => {
    expect((ADMIN_CANNOT_SEE as readonly string[]).includes('message_bodies')).toBe(true);
    expect((ADMIN_CANNOT_SEE as readonly string[]).includes('message_photos')).toBe(true);
    for (const field of PAM_TEAM_CAN_READ) {
      expect((ADMIN_CANNOT_SEE as readonly string[]).includes(field), `${field} is also in ADMIN_CANNOT_SEE`).toBe(false);
    }
  });
});
