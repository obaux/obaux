import { describe, expect, it } from 'vitest';
import {
  changeRequest,
  editColumns,
  phoneForDatabase,
  programFromRow,
  resendArguments,
  submitArguments,
  type OwnProgramRow,
  type SubmissionRow,
} from './ownProgram';

const ROW: OwnProgramRow = {
  id: 's1',
  name: 'Fresh Start Kitchen',
  category: 'workforce',
  subcategory: null,
  description_plain: 'Cooking classes.',
  address: '12 Main St',
  phone: '+12675550101',
  website: null,
  needs_review: true,
  is_active: true,
  created_at: '2026-10-10T04:00:00Z',
};

describe('programFromRow', () => {
  it('reads a waiting program as not live, with blanks for what is missing', () => {
    const p = programFromRow(ROW);
    expect(p.isLive).toBe(false);
    expect(p.sentAt).toBe('2026-10-10T04:00:00Z');
    expect(p.details).toMatchObject({ name: 'Fresh Start Kitchen', subcategory: '', website: '', services: [] });
  });

  it('is live only when approved and still active', () => {
    expect(programFromRow({ ...ROW, needs_review: false }).isLive).toBe(true);
    expect(programFromRow({ ...ROW, needs_review: false, is_active: false }).isLive).toBe(false);
  });
});

describe('phoneForDatabase', () => {
  it('turns what people type into +digits, and nothing into null', () => {
    expect(phoneForDatabase('(267) 555-0101')).toBe('+12675550101');
    expect(phoneForDatabase('   ')).toBeNull();
  });

  it('passes on a number it cannot read, so the database names it', () => {
    expect(phoneForDatabase('call us')).toBe('call us');
  });
});

describe('submitArguments', () => {
  it('trims, and sends nothing for a blank optional field', () => {
    const args = submitArguments({
      name: '  Fresh Start Kitchen ',
      category: 'workforce',
      subcategory: '',
      description: '  ',
      address: '12 Main St',
      phone: '',
      website: '',
      services: ['Classes'],
    });
    expect(args).toEqual({
      p_name: 'Fresh Start Kitchen',
      p_category: 'workforce',
      p_subcategory: null,
      p_description: null,
      p_address: '12 Main St',
      p_phone: null,
      p_website: null,
    });
  });
});

describe('editColumns (D-447)', () => {
  const draft = { name: ' New name ', category: 'education', description: 'Words', address: '1 A St', phone: '267 555 0101', website: '' };

  it('lets a live program change only its description, phone and website', () => {
    expect(Object.keys(editColumns(draft, true)).sort()).toEqual(['description_plain', 'phone', 'website']);
  });

  it('lets one still waiting for review change everything', () => {
    expect(editColumns(draft, false)).toMatchObject({ name: 'New name', category: 'education', address: '1 A St' });
  });
});

const SUB = (over: Partial<SubmissionRow>): SubmissionRow => ({
  id: 'sub1',
  kind: 'new',
  status: 'in_review',
  details: {},
  sent_at: '2026-10-11T09:00:00Z',
  changes_note: null,
  ...over,
});

describe('programFromRow with what is waiting for Pam (D-462)', () => {
  it('takes the first check from the open `new` send: its id, and when it was sent', () => {
    const p = programFromRow(ROW, [SUB({})]);
    expect(p.submissionId).toBe('sub1');
    expect(p.sentAt).toBe('2026-10-11T09:00:00Z');
    expect(p.changesNote).toBeNull();
    expect(p.pendingChange).toBeNull();
  });

  it('carries Pam\'s note only when it asked for changes', () => {
    expect(programFromRow(ROW, [SUB({ status: 'changes_asked', changes_note: 'Add the street address.' })]).changesNote).toBe(
      'Add the street address.',
    );
    expect(programFromRow(ROW, [SUB({ status: 'in_review', changes_note: 'ignored' })]).changesNote).toBeNull();
  });

  it('shows a live program\'s change as waiting, beside the live details', () => {
    const live = { ...ROW, needs_review: false };
    const p = programFromRow(live, [
      SUB({ id: 'chg', kind: 'change', details: { name: 'New Name', address: '2 Main St', category: 'workforce' } }),
    ]);
    expect(p.isLive).toBe(true);
    expect(p.details.name).toBe('Fresh Start Kitchen');
    expect(p.submissionId).toBeNull();
    expect(p.pendingChange).toEqual({ id: 'chg', name: 'New Name', address: '2 Main St', sentAt: '2026-10-11T09:00:00Z' });
  });

  it('is the same as before for a program that predates the record', () => {
    const p = programFromRow(ROW);
    expect(p.submissionId).toBeNull();
    expect(p.sentAt).toBe('2026-10-10T04:00:00Z');
  });
});

describe('changeRequest (D-447)', () => {
  const live = programFromRow({ ...ROW, needs_review: false });
  const same = { name: 'Fresh Start Kitchen', category: 'workforce', description: 'Cooking classes.', address: '12 Main St', phone: '+12675550101', website: '' };

  it('asks nothing when the name and address are as they were', () => {
    expect(changeRequest(live, same)).toBeNull();
    expect(changeRequest(live, { ...same, description: 'New words', phone: '267 555 0199' })).toBeNull();
  });

  it('asks for a new name, or a new address, keeping the kind of help', () => {
    expect(changeRequest(live, { ...same, name: ' Fresh Start Community Kitchen ' })).toEqual({
      name: 'Fresh Start Community Kitchen',
      category: 'workforce',
      subcategory: null,
      address: '12 Main St',
    });
    expect(changeRequest(live, { ...same, address: '' })?.address).toBeNull();
  });
});

describe('resendArguments', () => {
  it('is a send for the submission being corrected', () => {
    const args = resendArguments('sub-1', {
      name: ' Fresh Start ',
      category: 'workforce',
      subcategory: '',
      description: 'Classes.',
      address: '',
      phone: '',
      website: '',
      services: [],
    });
    expect(args).toMatchObject({ p_id: 'sub-1', p_name: 'Fresh Start', p_category: 'workforce', p_subcategory: null, p_address: null });
  });
});
