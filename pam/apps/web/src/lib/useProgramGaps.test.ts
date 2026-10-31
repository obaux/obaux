import { describe, expect, it } from 'vitest';
import { filterGaps, readProgramGaps, type GapPlace } from './useProgramGaps';

const PLACES: GapPlace[] = [
  { id: 'a', name: 'Café Recovery Center', address: '12 Market St', kind: 'health', missing: ['phone', 'hours'] },
  { id: 'b', name: 'Northeast Library', address: null, kind: 'library', missing: ['address'] },
  { id: 'c', name: 'Fox Chase Playground', address: null, kind: 'parks', missing: ['address'] },
  { id: 'd', name: 'Culinary Arts', address: '1231 N Broad St', kind: 'hand', missing: ['hours'] },
];

describe('readProgramGaps (D-623)', () => {
  it('reads the counts and the list as the function answers them', () => {
    const read = readProgramGaps({
      total: 754,
      phone_need: 588,
      phone_have: 331,
      website_need: 588,
      website_have: 207,
      address_need: 754,
      address_have: 750,
      hours_need: 588,
      hours_have: 6,
      missing: 590,
      places: [{ id: 'x', name: 'Somewhere', address: '  ', kind: 'parks', missing: ['address', 'nonsense'] }],
    });
    expect(read?.counts).toEqual({
      total: 754,
      missing: 590,
      details: {
        phone: { need: 588, have: 331 },
        website: { need: 588, have: 207 },
        address: { need: 754, have: 750 },
        hours: { need: 588, have: 6 },
      },
    });
    // A blank address is no address, and a detail it does not know is dropped.
    expect(read?.places).toEqual([{ id: 'x', name: 'Somewhere', address: null, kind: 'parks', missing: ['address'] }]);
  });

  it('is null for an answer that is not the right shape, so the screen says it could not load rather than show a wrong number', () => {
    expect(readProgramGaps(null)).toBeNull();
    expect(readProgramGaps([])).toBeNull();
    expect(readProgramGaps({ places: [] })).toBeNull();
  });

  it('asked without the list, has no places', () => {
    expect(readProgramGaps({ total: 3, missing: 1, places: null })?.places).toEqual([]);
  });

  it('reads a kind it does not know as added by hand', () => {
    expect(readProgramGaps({ total: 1, places: [{ id: 'q', name: 'Q', kind: 'other', missing: [] }] })?.places[0]?.kind).toBe('hand');
  });
});

describe('filterGaps (D-623)', () => {
  const all = { missing: null, kind: null, query: '' };

  it('with no filter and no search, keeps every place, in order', () => {
    expect(filterGaps(PLACES, all).map((p) => p.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('keeps the places missing the chosen detail', () => {
    expect(filterGaps(PLACES, { ...all, missing: 'address' }).map((p) => p.id)).toEqual(['b', 'c']);
    expect(filterGaps(PLACES, { ...all, missing: 'hours' }).map((p) => p.id)).toEqual(['a', 'd']);
  });

  it('keeps the chosen kind of place, and both filters together', () => {
    expect(filterGaps(PLACES, { ...all, kind: 'parks' }).map((p) => p.id)).toEqual(['c']);
    expect(filterGaps(PLACES, { ...all, missing: 'address', kind: 'library' }).map((p) => p.id)).toEqual(['b']);
  });

  it('finds every word typed in the name or the address, ignoring case, accents and extra spaces', () => {
    expect(filterGaps(PLACES, { ...all, query: '  cafe   MARKET ' }).map((p) => p.id)).toEqual(['a']);
    expect(filterGaps(PLACES, { ...all, query: 'broad' }).map((p) => p.id)).toEqual(['d']);
    expect(filterGaps(PLACES, { ...all, query: 'library fox' })).toEqual([]);
  });
});
