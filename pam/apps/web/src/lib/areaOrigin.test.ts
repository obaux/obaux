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
        removeItem: (k: string) => void store.delete(k),
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

  it('throws away a position an earlier version kept, and starts from City Hall', () => {
    store.set('pam.origin', JSON.stringify({ id: 'here', kind: 'address', label: 'your location', lat: 39.9, lon: -75.1 }));
    expect(loadOrigin()).toEqual(CITY_HALL);
    expect(store.has('pam.origin')).toBe(false);
  });

  // A street address picked from Google's suggestions is used for that search only (D-552; Mira, 13 October): never kept on the phone.
  it('writes nothing for a street address picked from Google, and the next visit starts from City Hall', () => {
    saveOrigin({ id: 'google:ChIJabcdefghijk123', kind: 'address', label: '1500 Market St, Philadelphia, PA 19102', lat: 39.9526, lon: -75.1664 });
    expect(store.size).toBe(0);
    expect(loadOrigin()).toEqual(CITY_HALL);
  });

  it('leaves the last Pam area standing when a Google address is used after it', () => {
    saveOrigin({ id: 'a2', kind: 'zip', label: '19122', lat: 39.977653, lon: -75.143016 });
    saveOrigin({ id: 'google:ChIJabcdefghijk123', kind: 'address', label: '1500 Market St, Philadelphia, PA 19102', lat: 39.9526, lon: -75.1664 });
    expect(loadOrigin().label).toBe('19122');
    expect(JSON.stringify([...store.values()])).not.toMatch(/Market|39\.9526|google:/);
  });

  it('throws away a Google address a stored value somehow holds', () => {
    store.set('pam.origin', JSON.stringify({ id: 'google:ChIJabcdefghijk123', kind: 'address', label: '1500 Market St', lat: 39.95, lon: -75.16 }));
    expect(loadOrigin()).toEqual(CITY_HALL);
    expect(store.has('pam.origin')).toBe(false);
  });
});
