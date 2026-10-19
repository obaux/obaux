import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { APP_ERROR_ACTIONS, APP_ERROR_ROUTES } from '../src/appErrors.js';
import { EN } from './_bundles.js';

/**
 * Privacy on the error log (D-616; Lena's read, 18 October 2026, `docs/legal/2026-10-18-error-log-privacy-read.md`).
 *
 * The line Will signs says what a note holds, that only the Pam team reads it, and for how long it is kept. Those are facts about
 * `public.app_errors`, so they are held here against the migration that makes it: a later edit that adds a column, widens who can read,
 * lengthens the keep time or takes the switch off its default makes the line untrue, and this fails until the line (and Will) catch up.
 * Nico's database test 85 holds the behaviour (what comes in is scrubbed, who is refused); this holds what the page promises.
 *
 * The line itself is not signed yet. The checks on its words apply once `privacy.s.what-we-keep.p17` exists in English.
 */
const MIGRATIONS = fileURLToPath(new URL('../../db/migrations/', import.meta.url));
const file = readdirSync(MIGRATIONS).find((name) => /app_errors_a_log_of_what_broke_without_who\.sql$/.test(name));
const sql = file ? readFileSync(MIGRATIONS + file, 'utf8') : '';

/** The column names of `create table public.app_errors ( … );`. */
function columnsOf(table: string): string[] {
  const start = sql.indexOf(`create table public.${table} (`);
  const body = sql.slice(start, sql.indexOf('\n);', start));
  return body
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('--'))
    .map((line) => line.split(/\s+/)[0]!)
    .filter((word) => /^[a-z_]+$/.test(word) && !['primary', 'unique', 'check', 'constraint', 'foreign'].includes(word));
}

/** A function's text, from `create or replace function public.<name>(` to its `$$;` or `end $$;`. */
function functionText(name: string): string {
  const start = sql.indexOf(`function public.${name}(`);
  expect(start, `${name} is in the migration`).toBeGreaterThan(-1);
  const end = sql.indexOf('$$;', sql.indexOf('$$', start) + 2);
  return sql.slice(start, end > start ? end + 3 : undefined);
}

describe('the error log keeps what Privacy says it keeps (D-616)', () => {
  it('has the migration', () => {
    expect(file, 'a migration named …_app_errors_a_log_of_what_broke_without_who.sql').toBeDefined();
  });

  it('holds when, the screen, the action, the kind of error, the version, the platform, the role and the language, and nothing else', () => {
    expect(columnsOf('app_errors')).toEqual(['id', 'created_at', 'area', 'action', 'code', 'build', 'platform', 'role', 'locale']);
  });

  it('has no column for an account, a phone, a message, a place, a note or an address: the line says none of them is in it', () => {
    const forbidden = /account|user|profile|person|member|phone|email|name|message|body|text|detail|note|place|address|ip\b|agent/i;
    const names = columnsOf('app_errors').filter((c) => !['role'].includes(c));
    expect(names.filter((c) => forbidden.test(c))).toEqual([]);
  });

  it('is written through a function that takes six things, none of them free text', () => {
    const head = functionText('report_app_error').split('returns boolean')[0] ?? '';
    const params = [...head.matchAll(/\bp_[a-z]+/g)].map((m) => m[0]);
    expect(params).toEqual(['p_area', 'p_action', 'p_code', 'p_build', 'p_platform', 'p_locale']);
  });

  it('takes the role from the sign-in, not from the app (a screen cannot say it is a super admin)', () => {
    const fn = functionText('report_app_error');
    expect(fn).toMatch(/select pr\.role::text into v_role from public\.profiles pr where pr\.id = v_uid/);
    expect(fn).not.toMatch(/p_role/);
  });

  it('is read only by a super admin, and only grouped; the table itself is shut', () => {
    expect(sql).toMatch(/alter table public\.app_errors enable row level security;/);
    expect(sql).toMatch(/alter table public\.app_errors force row level security;/);
    expect(sql).toMatch(/revoke all on public\.app_errors from anon, authenticated;/);
    expect(sql).toMatch(/create policy app_errors_nobody on public\.app_errors for all to anon, authenticated using \(false\) with check \(false\);/);
    const grouped = functionText('app_errors_grouped');
    expect(grouped).toMatch(/if not public\.is_super_admin\(\) then\s+raise exception 'ONLY_A_SUPER_ADMIN'/);
    expect(grouped).toMatch(/group by e\.area, e\.action, e\.code/);
    expect(sql).toMatch(/revoke all on function public\.app_errors_grouped\(integer\) from public, anon;/);
  });

  it('is kept thirty days, from one number that the sweep and the read both use, and swept every night', () => {
    expect(functionText('app_errors_keep_days')).toMatch(/select 30\s*\$\$/);
    expect(functionText('sweep_app_errors')).toMatch(/delete from public\.app_errors where created_at < now\(\) - make_interval\(days => public\.app_errors_keep_days\(\)\)/);
    expect(functionText('app_errors_grouped')).toMatch(/public\.app_errors_keep_days\(\)/);
    expect(sql).toMatch(/cron\.schedule\('sweep-app-errors', '[^']+', 'select public\.sweep_app_errors\(\)'\)/);
  });

  it('counts a person\'s reports in a table nobody can read, which holds the account, the minute and a number, and is emptied within ten minutes', () => {
    // Iris D4 (19 October): the rate limit keeps 'u:<account>' for a minute's count. That is not in the note and no role can read it; the line says
    // the note has no account, and the request log (p11) already says the account is written down for a week, so the counter adds nothing to who.
    expect(columnsOf('app_error_limits')).toEqual(['bucket', 'minute', 'n']);
    expect(sql).toMatch(/alter table public\.app_error_limits enable row level security;/);
    expect(sql).toMatch(/alter table public\.app_error_limits force row level security;/);
    expect(sql).toMatch(/revoke all on public\.app_error_limits from anon, authenticated;/);
    expect(sql).toMatch(/create policy app_error_limits_nobody on public\.app_error_limits for all to anon, authenticated using \(false\) with check \(false\);/);
    // The key is the account or one shared word, never an address (the migration says why).
    const fn = functionText('report_app_error');
    expect(fn).toMatch(/when v_uid is not null then 'u:' \|\| v_uid::text/);
    expect(fn).toMatch(/else 's:signed-out'/);
    // Rows older than five minutes go, by a job every five minutes (and on each report): none lives past ten.
    expect(functionText('sweep_app_error_counters')).toMatch(/delete from public\.app_error_limits where minute < now\(\) - interval '5 minutes'/);
    expect(sql).toMatch(/cron\.schedule\('sweep-app-error-counters', '\*\/5 \* \* \* \*', 'select public\.sweep_app_error_counters\(\)'\)/);
  });

  describe('the screen and the action come from two closed lists, so no one can put a name in either (Iris D1)', () => {
    const listed = (name: string): string[] => {
      const block = sql.split(`-- ${name}: begin`)[1]?.split(`-- ${name}: end`)[0] ?? '';
      return Array.from(block.matchAll(/^\s+\('([^']+)'\),?$/gm), (m) => m[1]!);
    };
    const routes = listed('app_error_routes');
    const actions = listed('app_error_actions');

    it('has both lists, and they are the app\'s own (the config test holds them equal; this keeps the line honest if that test goes)', () => {
      expect(routes.length).toBeGreaterThan(10);
      expect(actions.length).toBeGreaterThan(20);
      expect(actions.sort()).toEqual([...APP_ERROR_ACTIONS].sort());
      expect(routes.sort()).toEqual([...APP_ERROR_ROUTES].sort());
    });

    it('lists only fixed screens: words and dashes between slashes, no free segment such as [id] or a typed name', () => {
      expect(routes.filter((r) => !/^(\/|\/([a-z0-9-]+\/)+)$/.test(r))).toEqual([]);
      expect(routes.filter((r) => /[[\]{}:*?]/.test(r))).toEqual([]);
    });

    it('keeps an action only if it is on the list, and a route only if it is on the list, else "/unknown"', () => {
      const fn = functionText('report_app_error');
      expect(fn).toMatch(/not exists \(select 1 from public\.app_error_actions a where a\.action = v_action\) then\s+return false;/);
      expect(fn).toMatch(/if not exists \(select 1 from public\.app_error_routes r where r\.route = v_area\) then v_area := '\/unknown'; end if;/);
    });

    it('never stores what it was given: the route and the action reach the row only through those checks', () => {
      const body = functionText('report_app_error').split('returns boolean')[1] ?? '';
      expect([...body.matchAll(/\bp_area\b/g)]).toHaveLength(1);
      expect([...body.matchAll(/\bp_action\b/g)]).toHaveLength(1);
      expect(body).toMatch(/insert into public\.app_errors[^;]*\bv_area\b/);
      expect(body).toMatch(/insert into public\.app_errors[^;]*\bv_action\b/);
    });

    it('is written to by the migration alone: shut like the log, and nothing in a function adds a route or an action', () => {
      for (const table of ['app_error_actions', 'app_error_routes']) {
        expect(sql).toMatch(new RegExp(`alter table public\\.${table} enable row level security;`));
        expect(sql).toMatch(new RegExp(`alter table public\\.${table} force row level security;`));
        expect(sql).toMatch(new RegExp(`revoke all on public\\.${table} from anon, authenticated;`));
        expect(sql).toMatch(new RegExp(`create policy ${table}_nobody on public\\.${table} for all to anon, authenticated using \\(false\\) with check \\(false\\);`));
      }
      // Two inserts each: none outside the seed blocks.
      expect([...sql.matchAll(/insert into public\.app_error_(actions|routes)\b/g)]).toHaveLength(2);
    });
  });

  it('is off until the switch is turned on, and writes nothing, not even a count, while it is off', () => {
    expect(sql).toMatch(/\('app_errors_live', 'off',/);
    const fn = functionText('report_app_error');
    const off = fn.indexOf("'app_errors_live'");
    expect(off, 'the function reads the switch').toBeGreaterThan(-1);
    // The switch is read before the counters are touched and before anything is inserted.
    expect(off).toBeLessThan(fn.indexOf('insert into public.app_error_limits'));
    expect(off).toBeLessThan(fn.indexOf('insert into public.app_errors'));
  });

  it('tells the team by a bell that holds the action and a count and nothing the log row does not', () => {
    const fn = functionText('report_app_error');
    expect(fn).toMatch(/jsonb_build_object\('action', v_action, 'count', 1\)/);
    expect(sql).toMatch(/delete from public\.notifications where kind = 'app_error' and created_at < now\(\) - make_interval\(days => public\.app_errors_keep_days\(\)\)/);
  });

  it('keeps no network address, not even a hash of one: the line does not mention it and an address is personal data', () => {
    const fn = functionText('report_app_error');
    expect(fn).not.toMatch(/x-forwarded-for|request\.headers|inet_client_addr|client_addr/i);
    expect(sql).not.toMatch(/inet\b/i);
  });

  it('adds no outside company: no http call in the migration', () => {
    expect(sql).not.toMatch(/net\.http|http_post|http_get|pg_net|https?:\/\//i);
  });

  describe('the Privacy line (waits for Will’s signature)', () => {
    const line = EN['privacy.s.what-we-keep.p17'];
    it.skipIf(!line)('says thirty days, as many as the log is kept', () => {
      expect(line).toMatch(/after 30 days/);
    });
    it.skipIf(!line)('says only the Pam team reads it, and does not claim the notes are anonymous', () => {
      expect(line).toMatch(/Only the Pam team reads these notes/);
      // The request log holds the call that wrote a note, with the account, for a week (p11): "anonymous" and "can't show who" would be untrue.
      expect(line).not.toMatch(/anonymous|can.t show who|cannot show who|no one can tell/i);
    });
    it.skipIf(!line)('lists no more than the log holds, and says none of the things it does not', () => {
      expect(line).toMatch(/no name, phone number, account, message or place/i);
      expect(line).not.toMatch(/\bIP\b|address|location|device model/i);
    });
  });
});
