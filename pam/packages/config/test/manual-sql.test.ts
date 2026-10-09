import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * The file Will pastes into the Supabase SQL editor (D-428) is the four
 * migrations the connector cannot apply, in order, in one transaction. It is
 * built from them by hand, so this is what stops it drifting: edit a migration
 * before it is applied and this fails until the file is rebuilt and re-proved
 * (packages/db/manual/README.md).
 */
const root = new URL('../../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

const FILE = read('packages/db/manual/2026-10-09-photos-documents-links-and-languages.sql');
const MIGRATIONS = [
  '0079_message_photos',
  '0080_message_files',
  '0081_link_previews',
  '0085_language_where_there_is_no_profile',
];

describe('the one SQL file for the SQL editor', () => {
  it('contains every migration it stands in for, whole, in order', () => {
    let at = 0;
    for (const name of MIGRATIONS) {
      const sql = read(`packages/db/migrations/${name}.sql`).trimEnd();
      const found = FILE.indexOf(sql, at);
      expect(found, `${name}.sql is not in the file, or is out of order`).toBeGreaterThanOrEqual(at);
      at = found + sql.length;
    }
  });

  it('is one transaction: begins once, commits once, and is safe to run twice', () => {
    expect(FILE.match(/^begin;$/gm)).toHaveLength(1);
    expect(FILE.match(/^commit;$/gm)).toHaveLength(1);
    // Refuses a database it was not written for, and says so in words.
    expect(FILE).toContain("name = '0078_one_account_two_roles'");
    expect(FILE).toContain("name = '0084_message_translations'");
  });

  it('checks its own work before it commits, and records itself once', () => {
    const checks = FILE.slice(FILE.indexOf('Check the work before keeping it'));
    expect(checks).toContain('three private buckets');
    expect(checks).toContain('message_link_previews');
    expect(checks).toContain('an old function signature is still there');
    expect(checks).toContain('where not exists');
    for (const name of MIGRATIONS) expect(checks).toContain(`'${name}'`);
  });

  it('does not hold the migrations it stands in for as separate steps nobody applied', () => {
    // 0079–0081 and 0085 are held (STATUS row 36). If one is ever applied the
    // normal way, this file must not be run on top of it as if it were new.
    expect(read('packages/db/manual/README.md')).toContain('Run it once');
  });
});
