import { describe, expect, it } from 'vitest';
import { inMarkWindow, refusalOf } from './imHere';

const NOW = new Date('2026-10-12T15:00:00Z').getTime();
const at = (hours: number) => new Date(NOW + hours * 3_600_000).toISOString();

describe('inMarkWindow', () => {
  it('opens two hours before the visit and closes four hours after it starts', () => {
    expect(inMarkWindow(at(2.1), NOW)).toBe(false);
    expect(inMarkWindow(at(1.9), NOW)).toBe(true);
    expect(inMarkWindow(at(-3.9), NOW)).toBe(true);
    expect(inMarkWindow(at(-4.1), NOW)).toBe(false);
  });
  it('closes three hours after the visit ends, so a longer visit stays open longer and a shorter one closes sooner', () => {
    expect(inMarkWindow(at(-4.9), NOW, 120)).toBe(true);
    expect(inMarkWindow(at(-5.1), NOW, 120)).toBe(false);
    expect(inMarkWindow(at(-3.4), NOW, 30)).toBe(true);
    expect(inMarkWindow(at(-3.6), NOW, 30)).toBe(false);
  });
});

describe('refusalOf', () => {
  it('tells the database refusals apart', () => {
    expect(refusalOf('PLANNED_TOO_LATE')).toBe('too-late');
    expect(refusalOf('SELF_REPORT_LIMIT')).toBe('limit');
    expect(refusalOf('NO_PLACE_LOCATION')).toBe('no-location');
    expect(refusalOf('VISIT_NOT_FOUND')).toBe('error');
    expect(refusalOf(undefined)).toBe('error');
  });
});
