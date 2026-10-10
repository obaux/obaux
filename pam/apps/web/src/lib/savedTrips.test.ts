import { describe, expect, it } from 'vitest';
import { asksForSavedTrips, isSavedPlace, tripsFromRows, type TripRow } from './savedTrips';
import type { SessionState } from './useSession';

const ROW: TripRow = {
  id: '7a1f0f3c-2b11-4c0f-8b64-000000000001',
  service_id: '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11',
  place_name: 'Riverside Job Center',
  category: 'workforce',
  address: '1234 Market St',
  lat: 39.95,
  lon: -75.16,
  starts_at: '2026-10-14T14:00:00Z',
  note: null,
  status: 'scheduled',
};

const signedIn = (role: string, isDemo = false): SessionState =>
  ({ status: 'signed-in', session: { userId: 'u1', role, isDemo } }) as unknown as SessionState;

describe('isSavedPlace', () => {
  it('is a place from the catalogue, not an example', () => {
    expect(isSavedPlace('4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11')).toBe(true);
    expect(isSavedPlace('dummy-place-learning')).toBe(false);
    expect(isSavedPlace('added-1760000000000')).toBe(false);
  });
});

describe('asksForSavedTrips', () => {
  it('is a signed-in member who is not a demo account', () => {
    expect(asksForSavedTrips(signedIn('member'))).toBe('u1');
  });

  it('is nobody else', () => {
    expect(asksForSavedTrips(signedIn('member', true))).toBeNull();
    expect(asksForSavedTrips(signedIn('provider'))).toBeNull();
    expect(asksForSavedTrips(signedIn('admin'))).toBeNull();
    expect(asksForSavedTrips({ status: 'signed-out' })).toBeNull();
    expect(asksForSavedTrips({ status: 'loading' })).toBeNull();
  });
});

describe('tripsFromRows', () => {
  it('reads a scheduled trip in the shape the screens use', () => {
    expect(tripsFromRows([ROW])).toEqual([
      {
        id: ROW.id,
        placeId: ROW.service_id,
        placeName: 'Riverside Job Center',
        category: 'workforce',
        lat: 39.95,
        lon: -75.16,
        startsAt: '2026-10-14T14:00:00Z',
        note: '',
      },
    ]);
  });

  it('leaves out a trip already attended or missed, and one whose place is gone', () => {
    expect(tripsFromRows([{ ...ROW, status: 'attended' }, { ...ROW, status: 'missed' }, { ...ROW, service_id: null }])).toEqual([]);
  });

  it('keeps a trip whose place has no coordinates, at nowhere rather than lost', () => {
    expect(tripsFromRows([{ ...ROW, lat: null, lon: null }])[0]).toMatchObject({ lat: 0, lon: 0 });
  });
});
