import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { isRealStamp, numberFromFileName } from '../../../scripts/lib/claims.mjs';

/**
 * Numbers that sessions hand out (docs/lanes.md, "Claiming a number").
 *
 * Decisions and SOP amendments are numbered by *file*: `docs/decisions/D-442-…`
 * is the claim, and `pnpm claim` looks at every pushed branch before it picks
 * one. Migrations, changelog fragments and session logs are named by the day and
 * time instead, so they have no number to collide on. Everything written before
 * that lives on in DECISIONS.md, docs/sop-amendments.md and the four-digit
 * migrations.
 *
 * This cannot see a branch that is not merged yet — the script is how a session
 * does — but it stops a duplicate landing on `main`, and it checks that the new
 * files are what the script would have made.
 */
const root = new URL('../../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const list = (path: string, extension: string): string[] =>
  existsSync(new URL(path, root)) ? readdirSync(new URL(path, root)).filter((f) => f.endsWith(extension)) : [];

function duplicates(items: string[]): string[] {
  const seen = new Set<string>();
  const twice = new Set<string>();
  for (const item of items) (seen.has(item) ? twice : seen).add(item);
  return [...twice].sort();
}

const decisionFiles = list('docs/decisions/', '.md').filter((f) => f !== 'README.md');
const amendmentFiles = list('docs/amendments/', '.md').filter((f) => f !== 'README.md');
const changelogFragments = list('docs/changelog/unreleased/', '.md').filter((f) => f !== 'README.md');

const decisions = [
  ...[...read('DECISIONS.md').matchAll(/^#{2,3} (D-\d+)\b/gm)].map((m) => m[1]!),
  ...decisionFiles.map((f) => `D-${numberFromFileName(f, 'D-')}`),
];
const amendments = [
  ...[...read('docs/sop-amendments.md').matchAll(/^#{2,3} (A\d+)\b/gm)].map((m) => m[1]!),
  ...amendmentFiles.map((f) => `A${numberFromFileName(f, 'A')}`),
];
const versions = [...read('CHANGELOG.md').matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map((m) => m[1]!);

const migrationFiles = list('packages/db/migrations/', '.sql');
const numbered = migrationFiles.map((f) => /^(\d{4})_.+\.sql$/.exec(f)?.[1]).filter((n): n is string => Boolean(n));
const stamped = migrationFiles.filter((f) => /^\d{14}_/.test(f));

describe('numbers that more than one session hands out', () => {
  it('no decision number is used twice', () => {
    // D-024 was written twice on 12 September 2026, before anyone ran two sessions.
    expect(duplicates(decisions).filter((d) => d !== 'D-024')).toEqual([]);
  });

  it('no SOP amendment number is used twice', () => {
    expect(duplicates(amendments)).toEqual([]);
  });

  it('no changelog version is used twice', () => {
    expect(duplicates(versions)).toEqual([]);
  });

  it('every decision and amendment file is headed with its own number', () => {
    // A file renamed or copied by hand would otherwise cite one number and file under another.
    for (const [dir, files, prefix] of [
      ['docs/decisions', decisionFiles, 'D-'],
      ['docs/amendments', amendmentFiles, 'A'],
    ] as const) {
      for (const file of files) {
        const number = numberFromFileName(file, prefix);
        expect(number, `${dir}/${file} must be named ${prefix}<number>-<words>.md`).not.toBeNull();
        const first = read(`${dir}/${file}`).split('\n')[0];
        expect(first, `${dir}/${file}: first line`).toMatch(new RegExp(`^# ${prefix}${number} — .+`));
      }
    }
  });

  it('every unreleased changelog fragment starts with a title', () => {
    for (const file of changelogFragments) {
      expect(file, 'named by the day and time').toMatch(/^\d{14}-[a-z0-9-]+\.md$/);
      expect(isRealStamp(file.slice(0, 14))).toBe(true);
      expect(read(`docs/changelog/unreleased/${file}`).split('\n')[0], file).toMatch(/^# .+/);
    }
  });
});

describe('migrations', () => {
  it('no four-digit migration number is used twice', () => {
    expect(duplicates(numbered)).toEqual([]);
  });

  it('a migration named by day and time has a real one, and a name not used twice', () => {
    // 14 digits, UTC, to the second: 20261010031209_audit_log_keeps_six_months.sql
    const names = stamped.map((f) => f.slice(15));
    expect(duplicates(names)).toEqual([]);
    for (const file of stamped) {
      expect(isRealStamp(file.slice(0, 14)), `${file}: the first 14 digits are not a date and time`).toBe(true);
      expect(file, `${file}: name is snake_case after the stamp`).toMatch(/^\d{14}_[a-z0-9_]+\.sql$/);
      // A typo'd year would sort a migration behind every later one forever.
      const when = Date.UTC(
        Number(file.slice(0, 4)),
        Number(file.slice(4, 6)) - 1,
        Number(file.slice(6, 8)),
        Number(file.slice(8, 10)),
        Number(file.slice(10, 12)),
        Number(file.slice(12, 14)),
      );
      expect(when, `${file}: that time has not happened yet`).toBeLessThan(Date.now() + 24 * 3600 * 1000);
    }
  });

  it('every migration is either four digits or a stamp, so the order is the file order', () => {
    for (const file of migrationFiles) expect(file, file).toMatch(/^(\d{4}|\d{14})_[a-z0-9_]+\.sql$/);
  });

  it('a stamped migration that removes or tightens something says "-- contract:" and why', () => {
    // Database changes go in two steps (docs/lanes.md): add the new thing while the old app
    // still works, remove the old thing once no live app uses it. The second step says so.
    const removes =
      /\b(drop\s+(table|column|function|type|trigger|policy|constraint|index|view|schema|extension)|rename\s+(column|to)|alter\s+column\s+\S+\s+(set\s+not\s+null|type)|truncate)\b/i;
    for (const file of stamped) {
      const sql = read(`packages/db/migrations/${file}`);
      const code = sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
      if (!removes.test(code)) continue;
      expect(sql, `${file} removes or tightens something: add a line "-- contract: <release that stopped using it>"`).toMatch(
        /^-- contract: \S.+$/m,
      );
    }
  });
});
