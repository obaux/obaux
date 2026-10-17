import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';

/**
 * Cities people are waiting for (D-593; Will on card a96, 17 October 2026).
 *
 * The Pam team sees how many people wait for each city Pam is not in. Privacy says, of the city and the phone number kept for such a
 * person (`what-we-keep.p14`, signed): "so we know where to open next. Only the Pam team can see them." That stays true of a count
 * only while the count is a place and a number and nothing else, for a super admin and nobody else. This holds the one reader
 * of `waiting_cities`, `waiting_city_counts()`, to that:
 *
 *   - it returns a place and a number, never a person, a phone, an id or a date;
 *   - it reads one column of the table (`city`);
 *   - it checks `is_super_admin()` inside and is granted to signed-in callers only (a signed-out caller cannot run it);
 *   - nothing in the app reads the table directly.
 *
 * The line is checked once it is in the bundles (`what-we-keep.p14` ships in the same batch).
 */

const PAM = fileURLToPath(new URL('../../../', import.meta.url));
const MIGRATION_DIR = path.join(PAM, 'packages/db/migrations');
const MIGRATIONS = readdirSync(MIGRATION_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((file) => ({ file, sql: readFileSync(path.join(MIGRATION_DIR, file), 'utf8').replace(/--.*$/gm, '') }));

const DEFINITION = /create\s+or\s+replace\s+function\s+public\.waiting_city_counts\s*\(\s*\)([\s\S]*?)\$\$([\s\S]*?)\$\$\s*;/i;
const defined = MIGRATIONS.filter((m) => DEFINITION.test(m.sql));

function appSources(rel: string): string[] {
  const out: string[] = [];
  const dir = path.join(PAM, rel);
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const sub = path.posix.join(rel, entry.name);
    if (/(^|\/)(stories|__tests__|e2e|gallery|node_modules)(\/|$)/.test(sub)) continue;
    if (entry.isDirectory()) out.push(...appSources(sub));
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec|stories)\./.test(entry.name)) out.push(sub);
  }
  return out;
}

describe('the count of people waiting for each city (what-we-keep.p14: only the Pam team sees them)', () => {
  const latest = defined.at(-1);
  const match = latest?.sql.match(DEFINITION);
  const signature = match?.[1] ?? '';
  const body = match?.[2] ?? '';

  it('exists in exactly one place, the migration that adds it', () => {
    expect(defined.map((m) => m.file)).toHaveLength(1);
  });

  it('returns a place and a number, and nothing about a person', () => {
    expect(signature).toMatch(/returns\s+table\s*\(\s*place\s+text\s*,\s*people\s+integer\s*\)/i);
  });

  it('reads one column of waiting_cities, the city, and no other', () => {
    const columns = [...body.matchAll(/\bw\.(\w+)/g)].map((m) => m[1]);
    expect(columns.length).toBeGreaterThan(0);
    expect(new Set(columns)).toEqual(new Set(['city']));
    expect(body).not.toMatch(/\b(user_id|created_at|wants_updates|phone|auth\.users|profiles)\b/i);
  });

  it('refuses everyone but a super admin, inside the function', () => {
    expect(signature).toMatch(/security\s+definer/i);
    expect(signature).toMatch(/set\s+search_path\s*=\s*public\s*,\s*extensions/i);
    expect(body).toMatch(/if\s+not\s+public\.is_super_admin\(\)\s+then\s+raise\s+exception/i);
  });

  it('is run by signed-in callers only: revoked from public and anon, granted to authenticated', () => {
    const sql = latest?.sql ?? '';
    expect(sql).toMatch(/revoke\s+all\s+on\s+function\s+public\.waiting_city_counts\(\)\s+from\s+public\s*,\s*anon/i);
    expect(sql).toMatch(/grant\s+execute\s+on\s+function\s+public\.waiting_city_counts\(\)\s+to\s+authenticated/i);
    const toAnon = MIGRATIONS.filter((m) => /grant\s+execute\s+on\s+function\s+public\.waiting_city_counts\(\)\s+to\s+[^;]*\banon\b/i.test(m.sql));
    expect(toAnon.map((m) => m.file)).toEqual([]);
  });

  it('is the only way the app reads the table: nothing selects from waiting_cities directly', () => {
    const offenders = appSources('apps/web/src').filter((f) => /from\(\s*['"]waiting_cities['"]\s*\)/.test(readFileSync(path.join(PAM, f), 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('is covered by the signed line, once it is on the page', () => {
    const line = EN['privacy.s.what-we-keep.p14'];
    if (line === undefined) return;
    expect(line).toMatch(/so we know where to open next\. Only the Pam team can see them\./);
  });
});
