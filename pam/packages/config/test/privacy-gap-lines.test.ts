import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';

/**
 * The five Privacy lines the privacy guard found missing (D-587), signed by Will on card a96 (17 October 2026; Sage's ledger
 * 2430f52f), held to the code and the migrations they describe. The guard (`privacy-guard.test.ts`) makes sure a line exists and
 * still says what it was chosen to say; this file makes sure what it says is still true of the database and the app:
 *
 *   1. `what-we-keep.p1`  — "Only the Pam team can see your last name and your city": nobody signed in or out can select either
 *      column (D-588), and no screen asks for them.
 *   2. `what-we-keep.p14` — the waiting city: nothing texts it, and only its owner (or a super admin) reads the row, which goes
 *      with the account.
 *   3. `what-we-keep.p15` — a report about a place: case managers and the Pam team read it, nobody at the place can, and the
 *      reporter's id is cut when the account goes.
 *   4. `what-we-keep.p16` — a staff photo: staff only upload it, anyone with the address opens it, the old file goes when a
 *      new one is saved, and a nightly sweep removes every file no account uses (so a deleted account's photo goes too).
 *   5. `sharing.p8`       — an approved program and the services it lists are public.
 *
 * The English of each line is also pinned word for word: rewording a signed Privacy line is a new signature (A29), so the test
 * fails until the new words are in `docs/signed-english.md` and here.
 */

const PAM = fileURLToPath(new URL('../../../', import.meta.url));
const read = (rel: string): string => readFileSync(path.join(PAM, rel), 'utf8');
const stripSql = (sql: string): string => sql.replace(/--.*$/gm, '');
const stripTs = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const MIGRATION_DIR = path.join(PAM, 'packages/db/migrations');
const MIGRATIONS = readdirSync(MIGRATION_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((file) => ({ file, sql: stripSql(readFileSync(path.join(MIGRATION_DIR, file), 'utf8')) }));

/** Every `create policy <name> on public.<table> …;` in the migrations, with its text. */
function policiesOn(table: string): { name: string; file: string; body: string }[] {
  const found: { name: string; file: string; body: string }[] = [];
  const re = new RegExp(`create\\s+policy\\s+(\\w+)\\s+on\\s+public\\.${table}\\b([\\s\\S]*?);`, 'gi');
  for (const { file, sql } of MIGRATIONS) {
    for (const m of sql.matchAll(re)) found.push({ name: m[1]!, file, body: m[2]! });
  }
  return found;
}

function sourcesUnder(rel: string, ext = /\.(ts|tsx)$/): string[] {
  const out: string[] = [];
  const dir = path.join(PAM, rel);
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const sub = path.posix.join(rel, entry.name);
    if (/(^|\/)(stories|__tests__|e2e|gallery|node_modules)(\/|$)/.test(sub)) continue;
    if (entry.isDirectory()) out.push(...sourcesUnder(sub, ext));
    else if (ext.test(entry.name) && !/\.(test|spec|stories)\./.test(entry.name)) out.push(sub);
  }
  return out;
}

describe('the five signed Privacy lines (card a96), word for word', () => {
  it('says exactly what Will signed', () => {
    expect(EN['privacy.s.what-we-keep.p1']).toBe(
      'Your first name, your last name if you give it, your city, your phone number, and the language you pick. Only the Pam team can see your last name and your city.',
    );
    expect(EN['privacy.s.what-we-keep.p14']).toBe(
      'If Pam is not in your city yet, we keep the city you typed and your phone number, so we know where to open next. Only the Pam team can see them. We keep them until you ask us to delete your account.',
    );
    expect(EN['privacy.s.what-we-keep.p15']).toBe(
      'If you report a place, we keep the reason you picked, anything you wrote, the day, and that it came from your account. Case managers and the Pam team can read it. Nobody at the place is told who reported it. If you ask us to delete your account, the report stays, but it no longer says it was you.',
    );
    expect(EN['privacy.s.what-we-keep.p16']).toBe(
      'If you work with Pam as a case manager or for a program, you can add a photo of yourself. We keep it. Members you work with may see it, and so can anyone who has its web address. If you change your photo, we delete the old one. If you ask us to delete your account, we delete your photo too.',
    );
    expect(EN['privacy.s.sharing.p8']).toBe(
      'If we add a program you asked for, its name, type, address, phone number, website and description are shown on Pam, and so are the services it lists, with their details and hours.',
    );
  });
});

describe('p1: only the Pam team can see a last name and a city', () => {
  const revoke = /revoke\s+select\s*\(\s*last_name\s*,\s*home_city\s*\)\s+on\s+public\.profiles\s+from\s+anon\s*,\s*authenticated/i;
  const grantOfEither = /grant\s+select\s*\([^)]*\b(last_name|home_city)\b[^)]*\)\s+on\s+public\.profiles/i;

  it('has a migration that takes both columns out of the select grant, for anon as well as authenticated', () => {
    expect(MIGRATIONS.filter((m) => revoke.test(m.sql)).map((m) => m.file)).toHaveLength(1);
  });

  it('never grants them back after that migration', () => {
    const revoking = MIGRATIONS.find((m) => revoke.test(m.sql))!.file;
    const later = MIGRATIONS.filter((m) => m.file > revoking && grantOfEither.test(m.sql)).map((m) => m.file);
    expect(later).toEqual([]);
  });

  it('is asked of no screen: the app never selects either column from profiles', () => {
    const offenders = sourcesUnder('apps/web/src').filter((file) => {
      const src = stripTs(read(file));
      return /from\(\s*['"]profiles['"]\s*\)[\s\S]{0,300}?\.select\(\s*['"`][^'"`]*\b(last_name|home_city)\b/.test(src);
    });
    expect(offenders).toEqual([]);
  });
});

describe('p14: a waiting city is not texted, is read only by its owner (or a super admin), and goes with the account', () => {
  it('has no text in the templates or the edge functions', () => {
    const files = ['packages/config/src/sms-templates.ts', ...sourcesUnder('supabase/functions')];
    const offenders = files.filter((f) => /waiting_cities|join_waiting_city|city_?open|opens?_?in_?city/i.test(stripTs(read(f))));
    expect(offenders).toEqual([]);
  });

  it('has a row policy only for its owner, and any other only for a super admin', () => {
    const policies = policiesOn('waiting_cities');
    expect(policies.length).toBeGreaterThan(0);
    for (const p of policies) {
      if (p.name === 'waiting_cities_own') expect(p.body, p.name).toMatch(/user_id\s*=\s*auth\.uid\(\)/);
      else expect(p.body, `${p.name} in ${p.file}`).toMatch(/is_super_admin\(\)/);
    }
  });

  it('is deleted with the sign-in account', () => {
    const create = MIGRATIONS.map((m) => m.sql).join('\n').match(/create\s+table\s+if\s+not\s+exists\s+public\.waiting_cities\s*\(([\s\S]*?)\);/i);
    expect(create?.[1]).toMatch(/user_id\s+uuid\s+primary\s+key\s+references\s+auth\.users\s*\(id\)\s+on\s+delete\s+cascade/i);
  });
});

describe('p15: a report about a place is read by case managers and the Pam team, and by nobody at the place', () => {
  const policies = policiesOn('service_flags');

  it('can be read by the reporter, by case managers and super admins, and by no one else', () => {
    expect(policies.map((p) => p.name).sort()).toEqual(['service_flags_select_admin', 'service_flags_select_own', 'service_flags_super_admin_write']);
    for (const p of policies) {
      expect(p.body, p.name).toMatch(/flagged_by\s*=\s*auth\.uid\(\)|\bis_admin\(\)|\bis_super_admin\(\)/);
      // A program lead is a provider of an organisation: no policy may let either through.
      expect(p.body, p.name).not.toMatch(/my_org\(\)|my_role\(\)|provider/i);
    }
  });

  it('cuts the reporter when the account goes, and keeps the report', () => {
    const table = MIGRATIONS.map((m) => m.sql).join('\n').match(/create\s+table\s+if\s+not\s+exists\s+public\.service_flags\s*\(([\s\S]*?)\n\);/i);
    expect(table?.[1]).toMatch(/flagged_by\s+uuid\s+references\s+public\.profiles\s*\(id\)\s+on\s+delete\s+set\s+null/i);
  });

  it('is sent as a reason and an optional note and nothing else about the person', () => {
    const page = stripTs(read('apps/web/src/app/flag/page.tsx'));
    expect(page).toMatch(/rpc\(\s*'flag_service'/);
    expect(page).toMatch(/p_reason/);
    expect(page).toMatch(/p_note/);
  });
});

describe('p16: a staff photo is uploaded by staff, opens by its address, and is removed when replaced or when its account goes', () => {
  it('lives in a public bucket that only active staff can write to', () => {
    const sql = MIGRATIONS.find((m) => m.file.startsWith('0074_staff_photos'))!.sql;
    expect(sql).toMatch(/values\s*\(\s*'staff-photos'\s*,\s*'staff-photos'\s*,\s*true/);
    expect(sql).toMatch(/my_role\(\)\s+in\s*\(\s*'admin'\s*,\s*'provider'\s*,\s*'super_admin'\s*\)/);
    expect(sql).toMatch(/my_access_status\(\)\s*=\s*'active'/);
  });

  it('removes the previous file once the new one is saved', () => {
    const src = stripTs(read('apps/web/src/lib/staffPhoto.ts'));
    expect(src).toMatch(/olderPhotos\(/);
    expect(src).toMatch(/\.from\('staff-photos'\)\.remove\(/);
  });

  it('is swept every night of every file no account uses, which is how a deleted account\'s photo goes', () => {
    expect(existsSync(path.join(PAM, 'supabase/functions/sweep-staff-photos/handler.ts'))).toBe(true);
    const scheduled = MIGRATIONS.filter((m) => /cron\.schedule\(\s*'sweep-staff-photos'\s*,\s*'35 4 \* \* \*'/.test(m.sql));
    expect(scheduled).toHaveLength(1);
    const handler = stripTs(read('supabase/functions/sweep-staff-photos/handler.ts'));
    expect(handler).toMatch(/toRemove\(/);
    expect(handler).toMatch(/GRACE_MS/);
  });
});

describe('sharing.p8: an approved program, and the services it lists, are shown to everyone', () => {
  it('reads a program\'s services as a visitor once it is live', () => {
    const [policy] = policiesOn('program_services').filter((p) => p.name === 'program_services_select_public');
    expect(policy?.body).toMatch(/s\.is_active\s+and\s+not\s+s\.needs_review/);
    expect(policy?.body).not.toMatch(/to\s+authenticated/i);
  });

  it('reads the program itself as a visitor once it is live', () => {
    const [policy] = policiesOn('services').filter((p) => p.name === 'services_select_published');
    expect(policy?.body).toMatch(/is_active\s+and\s+not\s+needs_review/);
  });

  it('asks a lead for each service\'s name, description, phone, website, address and hours', () => {
    const src = stripTs(read('apps/web/src/screens/ServiceEditView.tsx'));
    for (const key of ['program.service.name', 'program.service.description', 'program.service.phone', 'program.service.website', 'program.service.address', 'program.service.hours']) {
      expect(src, key).toContain(key);
    }
  });
});
