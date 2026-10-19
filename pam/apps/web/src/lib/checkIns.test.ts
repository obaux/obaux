import { describe, expect, it } from 'vitest';
import { canMarkNow, inCheckInWindow } from './checkIns';

const NOW = new Date('2026-10-12T15:00:00Z').getTime();
const at = (hours: number) => new Date(NOW + hours * 3_600_000).toISOString();
const VISIT = 'aaaaaaaa-0000-4000-8000-000000005701';

describe('the lead\'s check-in window (the database\'s: two hours before, to fourteen days after the end)', () => {
  it('opens two hours before the visit starts', () => {
    expect(inCheckInWindow(at(2.1), 60, NOW)).toBe(false);
    expect(inCheckInWindow(at(1.9), 60, NOW)).toBe(true);
  });
  it('closes fourteen days after the visit ends, its length counted', () => {
    expect(inCheckInWindow(at(-(14 * 24 + 0.9)), 60, NOW)).toBe(true);
    expect(inCheckInWindow(at(-(14 * 24 + 1.1)), 60, NOW)).toBe(false);
    expect(inCheckInWindow(at(-(14 * 24 + 1.9)), 120, NOW)).toBe(true);
  });
  it('is for real visits only: an example visit keeps its circle', () => {
    expect(canMarkNow(VISIT, at(40), 60, NOW)).toBe(false);
    expect(canMarkNow('dummy-visit-1', at(40), 60, NOW)).toBe(true);
  });
});
