import { describe, expect, it } from 'vitest';
import { isLate, programFromRow, sentFields, type ProgramToCheckRow } from './programsToCheck';

const ROW: ProgramToCheckRow = {
  id: 's1',
  service_id: 'p1',
  kind: 'new',
  status: 'in_review',
  sent_at: '2026-10-06T12:00:00Z',
  days_waiting: 4,
  program_name: 'Fresh Start Kitchen',
  details: { name: 'Fresh Start Kitchen', category: 'workforce', subcategory: null, address: '1 Main St', phone: '', website: 'https://example.org' },
  lead_name: 'Lou',
  replaces_id: null,
  replaced_by: null,
  withdrawn_at: null,
};

describe('programFromRow', () => {
  it('reads a row the way the screens do', () => {
    const program = programFromRow(ROW);
    expect(program).toMatchObject({ kind: 'new', status: 'in_review', programName: 'Fresh Start Kitchen', leadName: 'Lou', daysWaiting: 4 });
  });

  it('reads an unknown kind or status as the plainest one, never as a decision it could not make', () => {
    expect(programFromRow({ ...ROW, kind: 'weird', status: 'weird' })).toMatchObject({ kind: 'new', status: 'in_review' });
    expect(programFromRow({ ...ROW, status: 'withdrawn' }).status).toBe('withdrawn');
    expect(programFromRow({ ...ROW, status: 'changes_asked' }).status).toBe('changes_asked');
  });

  it('copes with no details and no lead name', () => {
    expect(programFromRow({ ...ROW, details: null, lead_name: null, program_name: null })).toMatchObject({ details: {}, leadName: null, programName: '' });
  });
});

describe('isLate', () => {
  it('is a request in review that has waited the lead page\'s three days', () => {
    expect(isLate(programFromRow({ ...ROW, days_waiting: 3 }))).toBe(true);
    expect(isLate(programFromRow({ ...ROW, days_waiting: 2 }))).toBe(false);
  });

  it('is never a withdrawn one, or one waiting on the lead', () => {
    expect(isLate(programFromRow({ ...ROW, status: 'withdrawn', days_waiting: 9 }))).toBe(false);
    expect(isLate(programFromRow({ ...ROW, status: 'changes_asked', days_waiting: 9 }))).toBe(false);
  });
});

describe('sentFields', () => {
  it('lists what was sent in reading order, leaving out what is empty', () => {
    expect(sentFields(programFromRow(ROW)).map((f) => f.field)).toEqual(['name', 'category', 'address', 'website']);
  });
});
