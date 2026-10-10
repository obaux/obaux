import type { DummyPolicy } from '@pam/config/dummy-policies';

/**
 * A program's policies for participants, as the database keeps them (D-261,
 * migration 20261010144052, Will's card a25). The pure half: what is read, the
 * shape the screens already use (`DummyPolicy`, the example set's), and what an
 * upload must be before it is sent. `usePolicies` does the asking.
 *
 * A policy is never edited after it is made: a new version replaces it, and the
 * old one is archived with its files, so the people who signed it keep their
 * copy. Signatures are the next part; until then nobody has signed anything.
 */
export const POLICY_FILE_COLUMNS = 'id, path, name, content_type, size_bytes, position';
export const POLICY_COLUMNS = `id, service_id, title, version, replaces_id, created_at, archived_at, program_policy_files(${POLICY_FILE_COLUMNS})`;

export const MAX_POLICY_FILES = 5;
export const MAX_POLICY_FILE_BYTES = 10 * 1024 * 1024;
/** What the bucket accepts (migration 20261010144052). */
export const POLICY_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const;
export const POLICY_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.heic,application/pdf,image/jpeg,image/png,image/webp,image/heic';

export interface PolicyFileRow {
  readonly id: string;
  readonly path: string;
  readonly name: string;
  readonly content_type: string;
  readonly size_bytes: number;
  readonly position: number;
}

export interface PolicyRow {
  readonly id: string;
  readonly service_id: string;
  readonly title: string;
  readonly version: number;
  readonly replaces_id: string | null;
  readonly created_at: string;
  readonly archived_at: string | null;
  readonly program_policy_files: readonly PolicyFileRow[] | null;
}

/** A real policy, in the example set's shape, with what only a real one has. */
export interface ProgramPolicy extends DummyPolicy {
  readonly version: number;
  readonly files: readonly { readonly path: string; readonly name: string; readonly contentType: string }[];
  /** Always true: tells a screen this is the database's, not the example set's. */
  readonly isReal: true;
}

/** The policies a program asks now (not the archived), newest first, in the shape the screens read. */
export function policiesFromRows(rows: readonly PolicyRow[]): ProgramPolicy[] {
  return rows
    .filter((row) => row.archived_at === null)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((row) => {
      const files = [...(row.program_policy_files ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((f) => ({ path: f.path, name: f.name, contentType: f.content_type }));
      return {
        id: row.id,
        title: row.title,
        fileName: files[0]?.name ?? row.title,
        uploadedAt: row.created_at,
        body: [],
        signedBy: [],
        version: row.version,
        files,
        isReal: true as const,
      };
    });
}

export type UploadProblem = 'none' | 'too_many' | 'too_big' | 'bad_type';

/** What is wrong with the files somebody chose, before anything is sent. */
export function checkPolicyFiles(files: readonly Pick<File, 'name' | 'size' | 'type'>[]): UploadProblem {
  if (files.length === 0) return 'none';
  if (files.length > MAX_POLICY_FILES) return 'too_many';
  if (files.some((f) => f.size > MAX_POLICY_FILE_BYTES)) return 'too_big';
  if (files.some((f) => !POLICY_TYPES.includes(contentTypeOf(f) as (typeof POLICY_TYPES)[number]))) return 'bad_type';
  return 'none';
}

const BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

/** A file's type: what the browser said, else what its name says (a phone photo can come with none). */
export function contentTypeOf(file: Pick<File, 'name' | 'type'>): string {
  if (file.type) return file.type;
  return BY_EXTENSION[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? '';
}

/** A title from the first file's name: "code-of-conduct.pdf" → "Code of conduct". */
export function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim();
  const title = base ? base.charAt(0).toUpperCase() + base.slice(1) : fileName;
  return title.slice(0, 120);
}

/** The file's name as the database accepts it: no slashes or control characters, not too long. */
export function safeFileName(name: string): string {
  // eslint-disable-next-line no-control-regex
  const cleaned = name.replace(/[\u0000-\u001f\u007f/\\]+/g, ' ').trim();
  return (cleaned || 'file').slice(0, 200);
}
