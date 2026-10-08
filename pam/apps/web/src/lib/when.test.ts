import { describe, expect, it } from 'vitest';
import { countdown, dayKey, dayLabel, daysUntil } from './when';

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

describe('dayLabel (D-389)', () => {
  const now = new Date(2026, 9, 8, 9, 0); // Thursday 8 October, 9 AM
  const at = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).toISOString();
  it('names today and yesterday by calendar day', () => {
    expect(dayLabel(at(2026, 9, 8, 7), 'en-US', t, now)).toBe('when.today');
    expect(dayLabel(at(2026, 9, 7, 23), 'en-US', t, now)).toBe('when.yesterday');
  });
  it('gives the weekday within the last week', () => {
    expect(dayLabel(at(2026, 9, 5), 'en-US', t, now)).toBe('Monday');
  });
  it('gives the date after that, with the year only when it differs', () => {
    expect(dayLabel(at(2026, 8, 21), 'en-US', t, now)).toBe('Mon, Sep 21');
    expect(dayLabel(at(2025, 11, 30), 'en-US', t, now)).toBe('Tue, Dec 30, 2025');
  });
  it('speaks Spanish', () => {
    expect(dayLabel(at(2026, 9, 5), 'es-US', t, now)).toBe('lunes');
  });
});

describe('dayKey', () => {
  it('is the same for two times on one local day, different across midnight', () => {
    expect(dayKey(new Date(2026, 9, 8, 0, 5).toISOString())).toBe(dayKey(new Date(2026, 9, 8, 23, 55).toISOString()));
    expect(dayKey(new Date(2026, 9, 8, 23, 55).toISOString())).not.toBe(dayKey(new Date(2026, 9, 9, 0, 5).toISOString()));
  });
});
