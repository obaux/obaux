import { describe, expect, it } from 'vitest';
import { visitsFromRows } from './useProgramVisits';

describe('visitsFromRows', () => {
  it('reads a row in the shape the Home uses, with a first name only', () => {
    expect(
      visitsFromRows([
        {
          appointment_id: 'a1',
          member_id: 'm1',
          first_name: 'Tanya',
          starts_at: '2026-10-14T14:00:00Z',
          ends_at: null,
          status: 'scheduled',
          service_name: 'GED class',
          checked_in_at: null,
        },
      ]),
    ).toEqual([
      { id: 'a1', memberId: 'm1', firstName: 'Tanya', startsAt: '2026-10-14T14:00:00Z', endsAt: null, status: 'scheduled', serviceName: 'GED class', checkedInAt: null, markedByMember: false },
    ]);
  });
  it('turns a missing name into an empty one', () => {
    expect(visitsFromRows([{ appointment_id: 'a', member_id: 'm', first_name: null, starts_at: 'x', ends_at: null, status: 'attended', service_name: null, checked_in_at: 'y' }])[0]!.firstName).toBe('');
  });
  it('says which visits the member marked themselves', () => {
    const row = (id: string) => ({ appointment_id: id, member_id: 'm', first_name: 'T', starts_at: 'x', ends_at: null, status: 'attended' as const, service_name: null, checked_in_at: 'y' });
    expect(visitsFromRows([row('a'), row('b')], ['b']).map((v) => v.markedByMember)).toEqual([false, true]);
  });
});
