import { describe, expect, it, vi } from 'vitest';
import { countOnce, dayOf } from './screenOpens';

function notes(start: Record<string, string> = {}) {
  const store = { ...start };
  return {
    store,
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  };
}

const monday = new Date(2026, 9, 12, 9, 0);
const mondayLater = new Date(2026, 9, 12, 21, 30);
const tuesday = new Date(2026, 9, 13, 8, 0);

describe('dayOf', () => {
  it('is this phone\'s date, padded', () => {
    expect(dayOf(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('countOnce', () => {
  it('counts the first open of the day, and not the second', async () => {
    const call = vi.fn().mockResolvedValue(true);
    const n = notes();
    expect(await countOnce('points', call, n, monday)).toBe(true);
    expect(await countOnce('points', call, n, mondayLater)).toBe(false);
    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith('points');
  });

  it('counts again the next day', async () => {
    const call = vi.fn().mockResolvedValue(true);
    const n = notes();
    await countOnce('points', call, n, monday);
    expect(await countOnce('points', call, n, tuesday)).toBe(true);
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('counts each screen on its own', async () => {
    const call = vi.fn().mockResolvedValue(true);
    const n = notes();
    await countOnce('points', call, n, monday);
    expect(await countOnce('profile', call, n, monday)).toBe(true);
    expect(call.mock.calls.map((c) => c[0])).toEqual(['points', 'profile']);
  });

  it('keeps only a date on the phone, nothing about the person', async () => {
    const call = vi.fn().mockResolvedValue(true);
    const n = notes();
    await countOnce('profile', call, n, monday);
    expect(n.store).toEqual({ 'pam.counted.profile': '2026-10-12' });
  });

  it('tries again at the next open if the call failed', async () => {
    const call = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const n = notes();
    await countOnce('points', call, n, monday);
    expect(n.store).toEqual({});
    await countOnce('points', call, n, mondayLater);
    expect(call).toHaveBeenCalledTimes(2);
    expect(n.store).toEqual({ 'pam.counted.points': '2026-10-12' });
  });

  it('does not throw if the call does', async () => {
    const call = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(countOnce('points', call, notes(), monday)).resolves.toBe(true);
  });

  it('does not count at all on a phone with no storage, rather than on every open', async () => {
    const call = vi.fn().mockResolvedValue(true);
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    expect(await countOnce('points', call, broken, monday)).toBe(false);
    expect(call).not.toHaveBeenCalled();
  });
});
