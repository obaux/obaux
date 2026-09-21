import { describe, expect, it } from 'vitest';
import { FIRST_LOOK_WINDOW_MS, isNewSave, peopleSeenKey, rankPeople } from '../src/people-activity.js';

const NOW = new Date('2026-09-21T12:00:00Z');
const at = (hoursAgo: number) => new Date(NOW.getTime() - hoursAgo * 3_600_000).toISOString();

describe('people strip rings (D-198)', () => {
  const people = ['Aaliyah', 'Devon', 'Jordan', 'Keisha', 'Miguel', 'Priya'];

  it('lights nobody and keeps the order when nothing is new', () => {
    const out = rankPeople(people, () => ({ unreadAt: null, lastSavedAt: null }), at(1), NOW);
    expect(out.map((r) => r.person)).toEqual(people);
    expect(out.every((r) => r.reason === null)).toBe(true);
  });

  it('moves lit people to the front, most recent first, and leaves the rest in order', () => {
    const signals: Record<string, { unreadAt: string | null; lastSavedAt: string | null }> = {
      Keisha: { unreadAt: at(5), lastSavedAt: null },
      Miguel: { unreadAt: null, lastSavedAt: at(3) },
      Priya: { unreadAt: null, lastSavedAt: at(48) }, // before the last look — not new
    };
    const out = rankPeople(people, (p) => signals[p] ?? { unreadAt: null, lastSavedAt: null }, at(24), NOW);
    expect(out.map((r) => r.person)).toEqual(['Miguel', 'Keisha', 'Aaliyah', 'Devon', 'Jordan', 'Priya']);
    expect(out[0]!.reason).toBe('save');
    expect(out[1]!.reason).toBe('message');
    expect(out[5]!.reason).toBeNull();
  });

  it('an unread message wins over a new save from the same person', () => {
    const out = rankPeople(['Keisha'], () => ({ unreadAt: at(10), lastSavedAt: at(1) }), at(24), NOW);
    expect(out[0]!.reason).toBe('message');
    expect(out[0]!.activityAt).toBe(at(10));
  });

  it('with no last look recorded, a save inside the last week is new and an older one is not', () => {
    expect(isNewSave(at(24 * 6), null, NOW)).toBe(true);
    expect(isNewSave(at(24 * 8), null, NOW)).toBe(false);
    expect(FIRST_LOOK_WINDOW_MS).toBe(7 * 86_400_000);
  });

  it('a save at or before the last look is not new', () => {
    expect(isNewSave(at(2), at(2), NOW)).toBe(false);
    expect(isNewSave(at(1), at(2), NOW)).toBe(true);
    expect(isNewSave(null, at(2), NOW)).toBe(false);
  });

  it('the last-look key is per account', () => {
    expect(peopleSeenKey('abc')).toBe('pam.peopleSeen.abc');
    expect(peopleSeenKey('abc')).not.toBe(peopleSeenKey('def'));
  });
});
