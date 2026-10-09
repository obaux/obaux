import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * The file Will can paste into the Supabase SQL editor for migration 0085
 * (D-428). The live connector hangs on a `drop`, and 0085 replaces two
 * functions, so it is applied by hand. The file is the migration, whole, in one
 * transaction with a pre-flight check and a self-check; this stops it drifting
 * from the migration (packages/db/manual/README.md).
 */
const root = new URL('../../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

const FILE = read('packages/db/manual/2026-10-09-language-where-there-is-no-profile.sql');
const MIGRATION = read('packages/db/migrations/0085_language_where_there_is_no_profile.sql').trimEnd();

describe('the SQL editor file for migration 0085', () => {
  it('contains the migration, whole', () => {
    expect(FILE.includes(MIGRATION), '0085 changed after the file was built — rebuild it and re-prove it').toBe(true);
  });

  it('is one transaction, and refuses a database it was not written for', () => {
    expect(FILE.match(/^begin;$/gm)).toHaveLength(1);
    expect(FILE.match(/^commit;$/gm)).toHaveLength(1);
    expect(FILE).toContain("name = '0078_one_account_two_roles'");
    expect(FILE).toContain("name = '0084_message_translations'");
    // Before the migration, not after it.
    expect(FILE.indexOf('STOP:')).toBeLessThan(FILE.indexOf(MIGRATION));
  });

  it('checks its own work before it commits, and records itself once', () => {
    const checks = FILE.slice(FILE.indexOf(MIGRATION) + MIGRATION.length);
    expect(checks).toContain('an old function signature is still there');
    expect(checks).toContain('a new function signature is missing');
    expect(checks).toContain('a language column is missing');
    expect(checks).toContain('where not exists');
    expect(checks).toContain("'0085_language_where_there_is_no_profile'");
  });

  it('says that nothing waits on it: the app asks again without the language when it is not applied', () => {
    expect(FILE).toContain('rpcLanguage.ts');
    expect(read('apps/web/src/lib/rpcLanguage.ts')).toContain("'PGRST202'");
  });
});
