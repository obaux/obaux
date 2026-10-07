import { describe, expect, it } from 'vitest';
import { countdown, daysUntil } from './when';

const t = (key: string, vars?: Record<string, string | number>) => (vars ? `${key}:${vars.count}` : key);

describe('daysUntil (D-336)', () => {
  const now = new Date(2026, 9, 7, 22, 30); // Wednesday 7 October, 10:30 PM
  it('counts calendar days, not 24-hour blocks', () => {
    expect(daysUntil(new Date(2026, 9, 7, 23, 0), now)).toBe(0);
    expect(daysUntil(new Date(2026, 9, 8, 9, 0), now)).toBe(1);
    expect(daysUntil(new Date(2026, 9, 20, 16, 0), now)).toBe(13);
  });
  it('crosses a month and a clock change', () => {
    expect(daysUntil(new Date(2026, 10, 4, 18, 0), now)).toBe(28);
  });
  it('is negative for a day already past', () => {
    expect(daysUntil(new Date(2026, 9, 6, 12, 0), now)).toBe(-1);
  });
});

describe('countdown', () => {
  const now = new Date(2026, 9, 7, 9, 0);
  it('names today and tomorrow, counts the rest', () => {
    expect(countdown(new Date(2026, 9, 7, 16, 0), t, now)).toBe('when.countdown.today');
    expect(countdown(new Date(2026, 9, 8, 9, 0), t, now)).toBe('when.countdown.tomorrow');
    expect(countdown(new Date(2026, 9, 20, 16, 0), t, now)).toBe('when.countdown.days:13');
  });
  it('says nothing for a past day', () => {
    expect(countdown(new Date(2026, 9, 1, 9, 0), t, now)).toBeNull();
  });
});
