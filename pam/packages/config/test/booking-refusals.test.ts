import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUNDLES, EN } from './_bundles.js';

/**
 * What a program lead is told when the database refuses a booking for a member (D-595, Sage's ledger 33175aed; Iris's b58 finding).
 *
 * Seven lines under "We could not save that", one for each refusal the function can give. Two things are held here because they are
 * promises, not wording:
 *
 *   1. The member line gives no reason, in any language. `MEMBER_NOT_LINKED` is the one answer for "not linked to your program" and
 *      for "one of you has blocked the other", so a lead cannot learn who has an account or who blocked whom. The function must keep
 *      giving that one code for both, and must not grow a code of its own for a member-side cause without somebody choosing its words.
 *   2. Every other refusal the function can give has a line, and the staff-side ones (not a lead, account not active, not signed in)
 *      have none: they are the generic "try again" message, because a lead who is not allowed to book is not helped by being told why.
 */

const PAM = fileURLToPath(new URL('../../../', import.meta.url));
const MIGRATION_DIR = path.join(PAM, 'packages/db/migrations');
const MIGRATIONS = readdirSync(MIGRATION_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((file) => ({ file, sql: readFileSync(path.join(MIGRATION_DIR, file), 'utf8').replace(/--.*$/gm, '') }));

function latestBody(name: string): string {
  const re = new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${name}\\s*\\(([\\s\\S]*?)\\bas\\s+\\$\\$([\\s\\S]*?)\\$\\$`, 'i');
  const hit = MIGRATIONS.filter((m) => re.test(m.sql)).at(-1);
  return hit?.sql.match(re)?.[2] ?? '';
}

const LINES = {
  member: ['MEMBER_NOT_LINKED', ['name']],
  already: ['ALREADY_BOOKED', ['name']],
  limit: ['RATE_LIMIT', []],
  past: ['TRIP_IN_THE_PAST', []],
  far: ['TRIP_TOO_FAR', []],
  place: ['PLACE_NOT_FOUND', ['place']],
  service: ['SERVICE_NOT_FOUND', []],
} as const;
const NO_LINE = ['NOT_A_PROGRAM_LEAD', 'ACCOUNT_NOT_ACTIVE'];

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();

describe('the seven refusal lines a program lead reads', () => {
  const locales = Object.keys(BUNDLES).filter((l) => l !== 'en');

  for (const [key, [, names]] of Object.entries(LINES)) {
    it(`trips.new.refused.${key} carries ${names.length ? names.map((n) => `{${n}}`).join(' ') : 'no placeholder'}, in every language, and is translated`, () => {
      const id = `trips.new.refused.${key}` as keyof typeof EN;
      expect(placeholders(EN[id]), 'en').toEqual([...names]);
      for (const locale of locales) {
        const text = (BUNDLES as Record<string, Record<string, string>>)[locale]![id]!;
        expect(text, `${locale} has ${id}`).toBeTruthy();
        expect(placeholders(text), `${locale} ${id}`).toEqual([...names]);
        expect(text, `${locale} ${id} is not the English stand-in`).not.toBe(EN[id]);
      }
    });
  }

  it('the member line is the only one that names the member and gives no reason: it says nothing of a block, an account or a link', () => {
    for (const locale of ['en', ...locales]) {
      const text = (BUNDLES as Record<string, Record<string, string>>)[locale]!['trips.new.refused.member']!;
      expect(placeholders(text), locale).toEqual(['name']);
    }
    expect(EN['trips.new.refused.member']).toBe('Pam cannot book a visit for {name} right now.');
    expect(EN['trips.new.refused.member']).not.toMatch(/block|account|linked|written|sign/i);
  });
});

describe('the database gives one answer for every cause on the member side', () => {
  const body = latestBody('book_visit_for_member');
  const codes = [...body.matchAll(/raise\s+exception\s+'([A-Z][A-Z_]+)'/g)].map((m) => m[1]!);

  it('raises MEMBER_NOT_LINKED both when the member is not linked to the program and when either has blocked the other', () => {
    expect(body, 'book_visit_for_member is in a migration').not.toBe('');
    expect(codes.filter((c) => c === 'MEMBER_NOT_LINKED').length).toBeGreaterThanOrEqual(2);
    expect(body).toMatch(/public\.blocks/);
  });

  it('raises no other code about the member: every code it can raise is one with a line below, or a staff-side one with none', () => {
    const known = new Set<string>([...Object.values(LINES).map(([code]) => code), ...NO_LINE]);
    for (const code of new Set(codes)) expect(known.has(code), `${code} has a refusal line or is staff-side: choose its words (Sage) before adding a code`).toBe(true);
  });

  it('the app turns each code that has a line into that line, and the staff-side ones into none', () => {
    const app = readFileSync(path.join(PAM, 'apps/web/src/lib/savedTrips.ts'), 'utf8');
    const mapped = [...app.matchAll(/\['([A-Z][A-Z_]+)',\s*'(\w+)'\]/g)].map((m) => [m[1]!, m[2]!]);
    expect(Object.fromEntries(mapped)).toEqual(Object.fromEntries(Object.entries(LINES).map(([key, [code]]) => [code, key])));
    for (const code of NO_LINE) expect(app).not.toContain(`'${code}'`);
  });
});
