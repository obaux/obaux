import { describe, expect, it } from 'vitest';
import { ADMIN_CANNOT_SEE, ADMIN_CAN_SEE, PAM_TEAM_CAN_READ } from '../src/transparency.js';

/**
 * What the Pam team reads is a list of its own (D-605), so the guide's list is never widened by it and the two cannot be confused.
 * These hold the shape. The lines that tell a member about it (Privacy, the transparency screen, Terms) are Lena's, and are added to this
 * file's checks when they are on `main`; they must be live before the switch is turned on (D-413).
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

  it('does not widen what the guide cannot see: message bodies stay out of the guide\'s reach', () => {
    expect((ADMIN_CANNOT_SEE as readonly string[]).includes('message_bodies')).toBe(true);
    expect((ADMIN_CANNOT_SEE as readonly string[]).includes('message_photos')).toBe(true);
    for (const field of PAM_TEAM_CAN_READ) {
      expect((ADMIN_CANNOT_SEE as readonly string[]).includes(field), `${field} is also in ADMIN_CANNOT_SEE`).toBe(false);
    }
  });
});
