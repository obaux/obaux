import { describe, expect, it } from 'vitest';
import { textKindsFor } from './textKinds';

describe('the kinds of texts on the consent screens (D-608)', () => {
  it('a member: the visit reminder is not sent yet; the saved-place note goes with texts_live', () => {
    expect(textKindsFor('member', false)).toEqual([
      { key: 'reminders.what.1', live: false },
      { key: 'reminders.what.2', live: false },
    ]);
    // Rows that are on come first, the ones not yet below them.
    expect(textKindsFor('member', true)).toEqual([
      { key: 'reminders.what.2', live: true },
      { key: 'reminders.what.1', live: false },
    ]);
  });
  it('staff: nothing is sent until the alert texts are switched on too', () => {
    expect(textKindsFor('provider', true).every((row) => !row.live)).toBe(true);
    expect(textKindsFor('admin', false).map((row) => row.key)).toEqual(['reminders.what.messages', 'reminders.what.trips']);
    expect(textKindsFor('provider', false).map((row) => row.key)).toEqual(['reminders.what.messages', 'reminders.what.visits']);
  });
});
