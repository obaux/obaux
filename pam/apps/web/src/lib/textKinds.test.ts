import { describe, expect, it } from 'vitest';
import { textKindsFor } from './textKinds';

describe('the kinds of texts on the consent screens (D-608)', () => {
  it('a member: the visit reminder is not sent yet; the saved-place note goes with texts_live', () => {
    expect(textKindsFor('member', false)).toEqual([
      { key: 'alerts.visit', live: false },
      { key: 'alerts.closed', live: false },
    ]);
    // Rows that are on come first, the ones not yet below them.
    expect(textKindsFor('member', true)).toEqual([
      { key: 'alerts.closed', live: true },
      { key: 'alerts.visit', live: false },
    ]);
  });
  it('staff: nothing is sent until the alert texts are switched on too', () => {
    expect(textKindsFor('provider', true).every((row) => !row.live)).toBe(true);
    expect(textKindsFor('admin', false).map((row) => row.key)).toEqual(['alerts.message', 'alerts.trip']);
    expect(textKindsFor('provider', false).map((row) => row.key)).toEqual(['alerts.booked', 'alerts.changed', 'alerts.message']);
  });
});
