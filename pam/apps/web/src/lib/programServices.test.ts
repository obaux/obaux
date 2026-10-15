import { describe, expect, it } from 'vitest';
import { serviceColumns, serviceFromRow, type ProgramServiceRow } from './programServices';

const ROW: ProgramServiceRow = {
  id: 'a1b2c3d4-0000-4000-8000-000000000001',
  service_id: 'bbbbbbbb-0000-4000-8000-000000000001',
  name: 'Knife skills',
  description: 'Two evenings a week.',
  phone: '+12675550177',
  website: null,
  address: null,
  hours: null,
  sort_order: 0,
};

describe('serviceFromRow and the policies that are only for it (D-313 step 2)', () => {
  it('names the policies a service is only for, and none when none is named', () => {
    expect(serviceFromRow({ ...ROW, program_policy_services: [{ policy_id: 'p1' }, { policy_id: 'p2' }] }).policyIds).toEqual(['p1', 'p2']);
    expect(serviceFromRow({ ...ROW, program_policy_services: [] }).policyIds).toEqual([]);
    expect(serviceFromRow({ ...ROW, program_policy_services: null }).policyIds).toEqual([]);
  });
});

describe('serviceFromRow', () => {
  it('reads a row in the shape the screens use, with the program as its place', () => {
    expect(serviceFromRow(ROW)).toEqual({
      id: ROW.id,
      placeId: ROW.service_id,
      name: 'Knife skills',
      description: 'Two evenings a week.',
      phone: '+12675550177',
      website: null,
      address: null,
      hours: null,
      policyIds: [],
    });
  });

  it('turns a missing description into an empty one, and keeps a week of hours', () => {
    const week = [[], [{ open: '09:00', close: '12:00' }], [], [], [], [], []];
    const s = serviceFromRow({ ...ROW, description: null, hours: week });
    expect(s.description).toBe('');
    expect(s.hours).toEqual(week);
  });

  it('ignores hours that are not a week', () => {
    expect(serviceFromRow({ ...ROW, hours: { monday: 'nine' } }).hours).toBeNull();
  });
});

describe('serviceColumns', () => {
  it('trims, writes nothing for blanks, and keeps the phone as the database holds it', () => {
    expect(
      serviceColumns({
        id: 'x',
        placeId: ROW.service_id,
        name: '  Knife skills ',
        description: '   ',
        phone: '(267) 555-0177',
        website: '',
        address: ' ',
        hours: null,
        policyIds: ['policy-conduct'],
      }),
    ).toEqual({
      service_id: ROW.service_id,
      name: 'Knife skills',
      description: null,
      phone: '+12675550177',
      website: null,
      address: null,
      hours: null,
    });
  });
});
