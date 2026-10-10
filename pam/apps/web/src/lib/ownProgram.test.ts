import { describe, expect, it } from 'vitest';
import { editColumns, phoneForDatabase, programFromRow, submitArguments, type OwnProgramRow } from './ownProgram';

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
