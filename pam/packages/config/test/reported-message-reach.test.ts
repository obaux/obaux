import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Who can read a reported message (Lena, 18 October 2026, the D-608 audit: the report screens say "Pam and your guide see this one message",
 * and the Privacy page says only the guide does). The sentence that goes to Will for `who-can-see.p3` is "The Pam team can too, and so can
 * the guide of the person who wrote it." That is a property of the database, so it is held here and not only in a sentence:
 *
 *   1. `report_visible_to_me()` lets a super admin (the Pam team) read any report, and lets a case manager read a message report only when
 *      they have an open assignment to the SENDER or to the REPORTER of that message (not to a region, not to a program);
 *   2. the only policies that can read `reports` are the reporter's own and the one that calls that function;
 *   3. a reported message's photo and document go through the same function, so the line "and its photo or document if it has one" is the
 *      same set of people.
 *
 * If this fails, the sentence on the Privacy page is no longer true, or the reach is wider than the page says. Change the page (and tell
 * members first, D-413) before changing this test.
 */

const PAM = fileURLToPath(new URL('../../../', import.meta.url));
const DIR = path.join(PAM, 'packages/db/migrations');
const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => ({ name: f, sql: readFileSync(path.join(DIR, f), 'utf8').replace(/--.*$/gm, '') }));

const squash = (s: string): string => s.replace(/\s+/g, ' ').trim();

/** The body of the last definition of `report_visible_to_me`. */
function reportVisibleToMe(): string {
  const defs = files.flatMap((f) => [...f.sql.matchAll(/create or replace function public\.report_visible_to_me\([\s\S]*?\$\$;/gi)].map((m) => squash(m[0])));
  expect(defs.length, 'report_visible_to_me is defined').toBeGreaterThan(0);
  return defs[defs.length - 1]!;
}

describe('a reported message reaches the Pam team and the guides of the two people in it', () => {
  it('a super admin reads any report', () => {
    expect(reportVisibleToMe()).toMatch(/select public\.is_super_admin\(\) or \(/);
  });

  it('a case manager reads a message report only through an open assignment to the sender or the reporter', () => {
    const body = reportVisibleToMe();
    expect(body).toContain('public.is_admin()');
    expect(body).toContain('from public.messages m');
    expect(body).toContain('join public.admin_assignments a');
    expect(body).toContain('a.admin_id = auth.uid()');
    expect(body).toContain('a.ended_at is null');
    expect(body).toContain('a.member_id in (m.sender_id, p_reporter_id)');
    // The only way past the assignment is a report that is not about a message (a place, a profile): no quoted text.
    expect(body).toContain("p_target_type <> 'message'");
  });

  it('no policy but the reporter\'s own and report_visible_to_me() can read the reports table', () => {
    const live = new Map<string, string>();
    for (const f of files) {
      for (const m of f.sql.matchAll(/drop policy (?:if exists )?(\w+) on public\.reports\s*;/gi)) live.delete(m[1]!);
      for (const m of f.sql.matchAll(/create policy (\w+) on public\.reports\s+for (\w+)([\s\S]*?);/gi)) {
        live.set(m[1]!, `${m[2]!.toLowerCase()} ${squash(m[3]!)}`);
      }
    }
    const readers = [...live.entries()].filter(([, v]) => v.startsWith('select') || v.startsWith('all'));
    expect(readers.map(([k]) => k).sort()).toEqual(['reports_select_own', 'reports_select_review']);
    expect(live.get('reports_select_own')).toContain('reporter_id = auth.uid()');
    expect(live.get('reports_select_review')).toContain('public.report_visible_to_me(target_type, target_id, reporter_id)');
  });

  it("a reported message's photo and document are read through the same function", () => {
    const uses = (name: string) => (files.find((f) => f.name.includes(name))?.sql.match(/report_visible_to_me\(r\.target_type, r\.target_id, r\.reporter_id\)/g) ?? []).length;
    expect(uses('message_photos'), 'the photo path').toBeGreaterThanOrEqual(2);
    expect(uses('message_files'), 'the document path').toBeGreaterThanOrEqual(2);
  });

  it.todo('who-can-see.p3 says the Pam team can read a reported message, and the guide of the person who wrote it (once Will signs)');
});
