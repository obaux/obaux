import { describe, expect, it } from 'vitest';
import {
  hoursFor,
  openState,
  parseHours,
  type PlaceHours,
} from '../src/hours.js';

/**
 * The open/closed line is the one thing on a place card that can send somebody
 * on a walk for nothing, so the tests are about truthfulness first and
 * correctness second.
 */

const week = (days: Record<number, { open: string; close: string }[]>): PlaceHours => ({
  week: Array.from({ length: 7 }, (_, i) => days[i] ?? []),
  isReal: true,
});

/** Sunday 14 September 2026 is a Sunday, so day 0 really is Sunday. */
const at = (day: number, time: string): Date => {
  const [h, m] = time.split(':').map(Number);
  // 13 September 2026 was a Sunday; add `day` to reach the weekday wanted.
  return new Date(2026, 8, 13 + day, h!, m!, 0, 0);
};

describe('what the database gives us', () => {
  it('reads a week, and refuses anything it cannot trust', () => {
    expect(parseHours({ week: Array.from({ length: 7 }, () => []) })).toHaveLength(7);
    expect(parseHours(null)).toBeNull();
    expect(parseHours({ week: [[]] }), 'a short week is not a week').toBeNull();
    expect(parseHours({ week: Array.from({ length: 7 }, () => [{ open: '9am', close: '5pm' }]) }))
      .toBeNull();
  });

  it('prefers a real answer over a stand-in, always', () => {
    const real = { week: Array.from({ length: 7 }, () => [{ open: '11:00', close: '12:00' }]) };
    const answer = hoursFor('any-id', real);
    expect(answer?.isReal).toBe(true);
    expect(answer?.week[3]?.[0]?.open).toBe('11:00');
  });

  it('never makes hours up: a place Pam holds no hours for gets none, whatever its id (D-624)', () => {
    // Will, 31 October: "It's not acceptable to have fake hours on the real app." There is no stand-in week any more, so a real account
    // cannot be shown one, by any screen, however it is signed in.
    for (const id of ['some-place-id', 'place-a', 'svc-1', '', '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11']) {
      for (const raw of [null, undefined, {}, { week: [] }, 'x', 7, [[], [], []]]) {
        expect(hoursFor(id, raw), `${id} ${JSON.stringify(raw)}`).toBeNull();
      }
    }
  });

  it('and with no hours there is no open or closed line', () => {
    expect(openState(hoursFor('any-place', null), new Date(2026, 9, 31, 12, 0))).toEqual({ state: 'unknown' });
  });
});

describe('open or closed', () => {
  const nineToFiveWeekdays = week({
    1: [{ open: '09:00', close: '17:00' }],
    2: [{ open: '09:00', close: '17:00' }],
  });

  it('is open inside the window and closed outside it', () => {
    expect(openState(nineToFiveWeekdays, at(1, '10:00'))).toEqual({
      state: 'open',
      until: '17:00',
    });
    expect(openState(nineToFiveWeekdays, at(1, '08:59')).state).toBe('closed');
    expect(openState(nineToFiveWeekdays, at(1, '17:00')).state).toBe('closed');
  });

  it('says when it opens next, including on a later day', () => {
    expect(openState(nineToFiveWeekdays, at(1, '18:00'))).toEqual({
      state: 'closed',
      opensAt: '09:00',
    });
    // Sunday: shut today, opens Monday.
    expect(openState(nineToFiveWeekdays, at(0, '12:00'))).toEqual({
      state: 'closed',
      opensAt: '09:00',
    });
  });

  it('handles a place open past midnight', () => {
    // The evening centers run 7pm to 2am, so this is the catalogue, not a
    // hypothetical: at 1am the place is open on yesterday's session.
    const evenings = week({ 5: [{ open: '19:00', close: '02:00' }] });
    expect(openState(evenings, at(5, '23:30'))).toEqual({ state: 'open', until: '02:00' });
    expect(openState(evenings, at(6, '01:00'))).toEqual({ state: 'open', until: '02:00' });
    expect(openState(evenings, at(6, '03:00')).state).toBe('closed');
  });

  it('says nothing at all when the hours are unknown', () => {
    // Not "closed". A place Pam knows nothing about is not a place that is shut.
    expect(openState(null, at(1, '12:00'))).toEqual({ state: 'unknown' });
  });

  it('never claims a place is open when it is never open', () => {
    expect(openState(week({}), at(1, '12:00'))).toEqual({ state: 'closed', opensAt: null });
  });
});

import { declaresNoHours as declaresNoHoursFor } from '../src/hours.js';

describe('a place that has no hours on purpose (D-622: Parks & Rec)', () => {
  it('declares it with {"none": true}, and nothing else is read as that', async () => {
    const { declaresNoHours, NO_HOURS } = await import('../src/hours.js');
    expect(declaresNoHours(NO_HOURS)).toBe(true);
    expect(declaresNoHours({ none: true })).toBe(true);
    for (const other of [null, undefined, {}, { none: false }, { none: 'true' }, [], 'none', 0, { week: [] }]) {
      expect(declaresNoHours(other), JSON.stringify(other)).toBe(false);
    }
  });

  it('gets no hours at all: no stand-in, no open or closed line', async () => {
    const { NO_HOURS } = await import('../src/hours.js');
    expect(hoursFor('a-parks-and-rec-place', NO_HOURS)).toBeNull();
    expect(openState(hoursFor('a-parks-and-rec-place', NO_HOURS), new Date(2026, 9, 31, 12, 0))).toEqual({ state: 'unknown' });
  });

  it('is told apart from a place with no hours known: that one has null, this one says "none" (the app links the first to Google)', () => {
    expect(declaresNoHoursFor(null)).toBe(false);
    expect(declaresNoHoursFor({ none: true })).toBe(true);
  });

  it('cannot be mistaken for a closed week: a real week of nothing is still hours', () => {
    const closedAlways = { week: Array.from({ length: 7 }, () => []) };
    expect(hoursFor('x', closedAlways)?.isReal).toBe(true);
  });
});
