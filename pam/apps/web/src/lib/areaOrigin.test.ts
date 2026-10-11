import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CITY_HALL, loadOrigin, saveOrigin } from './useAreaSearch';

/** "Use my current location" is for this search only: the phone's position is never kept (D-536). */
describe('the remembered starting point', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
      },
    });
  });

  it('keeps a chosen area for the next visit', () => {
    saveOrigin({ id: 'a2', kind: 'zip', label: '19122', lat: 39.977653, lon: -75.143016 });
    expect(loadOrigin().label).toBe('19122');
  });

  it('writes nothing for the phone\'s own position', () => {
    saveOrigin({ id: 'here', kind: 'address', label: 'your location', lat: 39.9, lon: -75.1 });
    expect(store.size).toBe(0);
    expect(loadOrigin()).toEqual(CITY_HALL);
  });

  it('leaves the last chosen area standing when the phone\'s position is used after it', () => {
    saveOrigin({ id: 'a2', kind: 'zip', label: '19122', lat: 39.977653, lon: -75.143016 });
    saveOrigin({ id: 'here', kind: 'address', label: 'your location', lat: 39.9, lon: -75.1 });
    expect(loadOrigin().label).toBe('19122');
  });
});
