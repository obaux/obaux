import { describe, expect, it } from 'vitest';
import {
  hoursFor,
  openState,
  parseHours,
  USE_PLACEHOLDER_HOURS,
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

  it('marks a stand-in as not real, so nothing can present it as fact', () => {
    const answer = hoursFor('some-place-id', null);
    if (USE_PLACEHOLDER_HOURS) {
      expect(answer).not.toBeNull();
      expect(answer!.isReal).toBe(false);
    } else {
      expect(answer).toBeNull();
    }
  });

  it('gives the same place the same stand-in every time', () => {
    // Hours that change between two renders would show a place open and closed
    // within a minute of each other.
    expect(hoursFor('place-a', null)).toEqual(hoursFor('place-a', null));
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
    // Not "closed". A place PAM knows nothing about is not a place that is shut.
    expect(openState(null, at(1, '12:00'))).toEqual({ state: 'unknown' });
  });

  it('never claims a place is open when it is never open', () => {
    expect(openState(week({}), at(1, '12:00'))).toEqual({ state: 'closed', opensAt: null });
  });
});
