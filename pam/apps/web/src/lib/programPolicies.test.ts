import { describe, expect, it } from 'vitest';
import {
  checkPolicyFiles,
  contentTypeOf,
  policiesFromRows,
  safeFileName,
  titleFromFileName,
  type PolicyRow,
} from './programPolicies';

const file = (name: string, size = 1000, type = 'application/pdf') => ({ name, size, type });

describe('checkPolicyFiles (a25: PDFs or photos, 10 MB each, five a policy)', () => {
  it('accepts a PDF and a few photos', () => {
    expect(checkPolicyFiles([file('a.pdf')])).toBe('none');
    expect(checkPolicyFiles([file('1.jpg', 5, 'image/jpeg'), file('2.png', 5, 'image/png')])).toBe('none');
  });

  it('says nothing when nothing was chosen', () => {
    expect(checkPolicyFiles([])).toBe('none');
  });

  it('refuses a sixth file, a file over ten megabytes, and a type that is not a PDF or a photo', () => {
    expect(checkPolicyFiles(Array.from({ length: 6 }, (_, i) => file(`${i}.pdf`)))).toBe('too_many');
    expect(checkPolicyFiles(Array.from({ length: 5 }, (_, i) => file(`${i}.pdf`)))).toBe('none');
    expect(checkPolicyFiles([file('big.pdf', 10 * 1024 * 1024 + 1)])).toBe('too_big');
    expect(checkPolicyFiles([file('exactly.pdf', 10 * 1024 * 1024)])).toBe('none');
    expect(checkPolicyFiles([file('clip.mp4', 10, 'video/mp4')])).toBe('bad_type');
  });

  it('reads a photo that came with no type from its name', () => {
    expect(contentTypeOf({ name: 'IMG_0001.HEIC', type: '' })).toBe('image/heic');
    expect(checkPolicyFiles([file('IMG_0001.HEIC', 10, '')])).toBe('none');
    expect(checkPolicyFiles([file('notes.txt', 10, '')])).toBe('bad_type');
  });
});

describe('titles and names', () => {
  it('makes a title from the first file', () => {
    expect(titleFromFileName('code-of-conduct.pdf')).toBe('Code of conduct');
    expect(titleFromFileName('x'.repeat(200) + '.pdf')).toHaveLength(120);
  });

  it('cleans a file name of anything the database refuses', () => {
    expect(safeFileName('a/b\\c.pdf')).toBe('a b c.pdf');
    expect(safeFileName('   ')).toBe('file');
    expect(safeFileName('y'.repeat(300))).toHaveLength(200);
  });
});

describe('policiesFromRows', () => {
  const rows: PolicyRow[] = [
    {
      id: 'old', service_id: 'p', title: 'Confidentiality', version: 1, replaces_id: null,
      created_at: '2026-10-01T10:00:00Z', archived_at: '2026-10-05T10:00:00Z', program_policy_files: [],
    },
    {
      id: 'new', service_id: 'p', title: 'Confidentiality', version: 2, replaces_id: 'old',
      created_at: '2026-10-05T10:00:00Z', archived_at: null,
      program_policy_files: [
        { id: 'f2', path: 'p/2.pdf', name: 'page two.pdf', content_type: 'application/pdf', size_bytes: 10, position: 1 },
        { id: 'f1', path: 'p/1.pdf', name: 'page one.pdf', content_type: 'application/pdf', size_bytes: 10, position: 0 },
      ],
    },
    {
      id: 'liability', service_id: 'p', title: 'Liability', version: 1, replaces_id: null,
      created_at: '2026-10-07T10:00:00Z', archived_at: null, program_policy_files: null,
    },
  ];

  it('lists the current policies, newest first, leaving out the archived', () => {
    expect(policiesFromRows(rows).map((p) => p.id)).toEqual(['liability', 'new']);
  });

  it('puts the pages in order and carries the version; nobody has signed yet', () => {
    const [, current] = policiesFromRows(rows);
    expect(current?.files.map((f) => f.name)).toEqual(['page one.pdf', 'page two.pdf']);
    expect(current).toMatchObject({ version: 2, fileName: 'page one.pdf', signedBy: [], isReal: true });
  });
});
