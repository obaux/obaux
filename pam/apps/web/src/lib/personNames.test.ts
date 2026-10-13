import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recalledPersonName, rememberPersonName } from './personNames';

describe('personNames', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
  });

  it('hands a first name from one page to the next in the tab', () => {
    rememberPersonName('p1', 'Tanya');
    expect(recalledPersonName('p1')).toBe('Tanya');
    expect(recalledPersonName('p2')).toBeNull();
  });

  it('keeps nothing for an empty name', () => {
    rememberPersonName('p1', '');
    expect(recalledPersonName('p1')).toBeNull();
  });
});
