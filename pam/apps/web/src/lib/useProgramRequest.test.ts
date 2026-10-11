import { describe, expect, it } from 'vitest';
import { requestFromRow } from './useProgramRequest';

const ROW = {
  wants_role: 'provider',
  decision: null,
  program_name: 'Ada’s Atelier',
  program_category: 'education',
  program_subcategory: null,
  program_description: 'Open studio.',
  program_address: '1 Elm St',
  program_phone: null,
  program_website: null,
};

describe('requestFromRow', () => {
  it('is none when there is no request, or it was for another role', () => {
    expect(requestFromRow(null)).toEqual({ status: 'none' });
    expect(requestFromRow({ ...ROW, wants_role: 'admin' })).toEqual({ status: 'none' });
  });
  it('is waiting while nobody has decided, with what was sent', () => {
    const state = requestFromRow(ROW);
    expect(state.status).toBe('waiting');
    expect(state.status === 'waiting' && state.details.name).toBe('Ada’s Atelier');
    expect(state.status === 'waiting' && state.details.phone).toBe('');
  });
  it('is denied, keeping what was sent so it can be changed and asked again', () => {
    const state = requestFromRow({ ...ROW, decision: 'denied' });
    expect(state.status).toBe('denied');
    expect(state.status === 'denied' && state.details.address).toBe('1 Elm St');
  });
  it('is approved once approved', () => {
    expect(requestFromRow({ ...ROW, decision: 'approved' })).toEqual({ status: 'approved' });
  });
});
