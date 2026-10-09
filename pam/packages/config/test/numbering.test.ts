import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

/**
 * Numbers that sessions hand out (docs/allocations.md).
 *
 * Three sessions once took D-404 at the same time, two took migration 0082 and
 * two took A22; each was found by a person at merge time. A merge that brings
 * two branches' numbers into one tree now fails here instead. This cannot see
 * a branch that is not merged yet — the rule in allocations.md is how a session
 * does — but it stops a duplicate landing on `main`.
 */
const root = new URL('../../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

function duplicates(items: string[]): string[] {
  const seen = new Set<string>();
  const twice = new Set<string>();
  for (const item of items) (seen.has(item) ? twice : seen).add(item);
  return [...twice].sort();
}

const decisions = [...read('DECISIONS.md').matchAll(/^#{2,3} (D-\d+)\b/gm)].map((m) => m[1]!);
const amendments = [...read('docs/sop-amendments.md').matchAll(/^#{2,3} (A\d+)\b/gm)].map((m) => m[1]!);
const versions = [...read('CHANGELOG.md').matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map((m) => m[1]!);
const migrations = readdirSync(new URL('packages/db/migrations/', root))
  .map((f) => /^(\d{4})_.+\.sql$/.exec(f)?.[1])
  .filter((n): n is string => Boolean(n));

const number = (id: string) => Number(id.replace(/\D/g, ''));
const nextFree = (label: string): string => {
  const row = read('docs/allocations.md')
    .split('\n')
    .find((line) => line.startsWith(`| ${label} |`));
  const cell = row?.split('|')[2]?.replace(/\*/g, '').trim();
  if (!cell) throw new Error(`docs/allocations.md has no "${label}" row`);
  return cell;
};

describe('numbers that more than one session hands out', () => {
  it('no decision number is used twice', () => {
    // D-024 was written twice on 12 September 2026, before anyone ran two sessions.
    expect(duplicates(decisions).filter((d) => d !== 'D-024')).toEqual([]);
  });

  it('no SOP amendment number is used twice', () => {
    expect(duplicates(amendments)).toEqual([]);
  });

  it('no migration number is used twice', () => {
    expect(duplicates(migrations)).toEqual([]);
  });

  it('no changelog version is used twice', () => {
    expect(duplicates(versions)).toEqual([]);
  });

  it('allocations.md is ahead of the highest number in the repo', () => {
    // A session that takes a number and forgets to bump the table would leave
    // the next one to take it again. A conflict on that row is also the signal
    // that two sessions claimed the same number.
    expect(number(nextFree('Decision'))).toBeGreaterThan(Math.max(...decisions.map(number)));
    expect(number(nextFree('SOP amendment'))).toBeGreaterThan(Math.max(...amendments.map(number)));
    expect(number(nextFree('Migration'))).toBeGreaterThan(Math.max(...migrations.map(Number)));
  });
});
