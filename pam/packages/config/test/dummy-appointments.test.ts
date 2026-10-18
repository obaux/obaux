import { describe, expect, it } from 'vitest';
import { buildAppointments } from '../src/dummy-appointments';

/**
 * The example schedule (D-218) has to look lived-in on every day it is opened. Its pattern was `offset * 7 + weekday` mod 4, which is a
 * multiple of 4 for every weekday of the coming week when today is a Sunday: a Home with "Nobody booked" five times (Iris's run-through,
 * found when a tap test could not find a visit row). The count is now keyed on the date itself.
 */
const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayKey = (d: Date) => Math.round(startOfDay(d).getTime() / DAY);

/** How many example people there are on each calendar day, by the day's key. */
function perDay(today: Date): Map<number, number> {
  const out = new Map<number, number>();
  for (const a of buildAppointments(today)) out.set(dayKey(new Date(a.startsAt)), (out.get(dayKey(new Date(a.startsAt))) ?? 0) + 1);
  return out;
}

describe('the example schedule', () => {
  // Every day of a year as "today": each weekday, in every month.
  const todays = Array.from({ length: 366 }, (_, n) => new Date(2026, 0, 1 + n, 14, 30));

  it('never has an empty Monday to Friday week within three weeks of today, whichever day today is', () => {
    for (const today of todays) {
      const counts = perDay(today);
      const first = dayKey(today) - 21;
      const last = dayKey(today) + 21;
      // Every Monday whose whole Monday-to-Friday week lies within three weeks either side of today.
      for (let key = first; key + 4 <= last; key += 1) {
        const monday = new Date(key * DAY + 12 * 3_600_000);
        if (new Date(startOfDay(monday)).getDay() !== 1) continue;
        let people = 0;
        for (let d = 0; d < 5; d += 1) people += counts.get(key + d) ?? 0;
        expect(people, `the week of ${startOfDay(monday).toDateString()} seen from ${today.toDateString()}`).toBeGreaterThan(0);
      }
    }
  });

  it('has four people today when today is a weekday, and between none and four on any day', () => {
    for (const today of todays) {
      const counts = perDay(today);
      const weekday = today.getDay();
      if (weekday !== 0 && weekday !== 6) expect(counts.get(dayKey(today)), `today ${today.toDateString()}`).toBe(4);
      for (const n of counts.values()) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(4);
      }
    }
  });

  it('has nobody on a weekend', () => {
    const counts = perDay(new Date(2026, 9, 18, 9, 0));
    for (const key of counts.keys()) {
      const day = new Date(key * DAY + 12 * 3_600_000).getDay();
      expect([0, 6]).not.toContain(day);
    }
  });

  it('shows a day the same from the day before as from the day after (the pattern is keyed on the date, not on today)', () => {
    const a = perDay(new Date(2026, 9, 14, 10, 0));
    const b = perDay(new Date(2026, 9, 16, 10, 0));
    // A day well away from both "todays" has the same people in both (today itself is always four).
    for (const key of a.keys()) {
      if (Math.abs(key - dayKey(new Date(2026, 9, 14))) < 2 || Math.abs(key - dayKey(new Date(2026, 9, 16))) < 2) continue;
      if (b.has(key)) expect(b.get(key)).toBe(a.get(key));
    }
  });

  it('has people on the Sunday that used to leave the coming week empty', () => {
    const sunday = new Date(2026, 9, 18, 0, 10); // a Sunday; the old pattern gave nobody Monday to Friday
    expect(sunday.getDay()).toBe(0);
    const counts = perDay(sunday);
    let people = 0;
    for (let d = 1; d <= 5; d += 1) people += counts.get(dayKey(sunday) + d) ?? 0;
    expect(people).toBeGreaterThan(0);
  });
});
