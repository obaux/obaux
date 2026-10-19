import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUNDLES, EN } from './_bundles.js';
import { PRIVACY } from '../src/legal.js';
import { SUPPORTED_LOCALES } from '../src/i18n.js';

/**
 * Privacy on the list of numbers that said STOP and have no account (Lena's read, 19 October 2026,
 * `docs/legal/2026-10-19-stop-start-and-stopped-numbers-privacy-read.md`; Nico's migration
 * `…_a_stopped_number_is_kept_as_a_keyed_hash_and_follows_the.sql`, test 86).
 *
 * The line says what Pam keeps about a person with no account (a scrambled code made from the number, not the number), why (so a person who
 * joins later is not texted), that nobody reads it, and when it goes (a START). Those are facts about `public.phone_stops` and the functions
 * around it, so they are held here against the migrations: a later edit that stores the number, goes back to a plain hash, lets the service
 * role ask about a number it did not mean to, or writes a log line about a stopped number makes the line untrue, and this fails until the
 * line (and Will) catch up. Nico's database test 86 holds the behaviour; this holds what the page promises.
 *
 * Two things were still being decided when this was written (whether the table keeps a day, and whether an erased account puts its code
 * back): neither is pinned here, and the checks on the line's own words apply once `privacy.s.texts.p4` exists in English.
 */
const MIGRATIONS = fileURLToPath(new URL('../../db/migrations/', import.meta.url));
const names = readdirSync(MIGRATIONS);
const read = (name: string | undefined) => (name ? readFileSync(MIGRATIONS + name, 'utf8') : '');
const keyed = read(names.find((n) => /a_stopped_number_is_kept_as_a_keyed_hash_and_follows_the\.sql$/.test(n)));
const original = read(names.find((n) => /support_texts_to_a_number_typed_into_the_help_form\.sql$/.test(n)));

/** A function's text, from `create or replace function public.<name>(` to its closing `$$;`, searched in the given migration. */
function functionText(sql: string, name: string): string {
  const start = sql.indexOf(`function public.${name}(`);
  expect(start, `${name} is in the migration`).toBeGreaterThan(-1);
  const end = sql.indexOf('$$;', sql.indexOf('$$', start) + 2);
  return sql.slice(start, end > start ? end + 3 : undefined);
}

describe('the list of stopped numbers keeps what Privacy says it keeps (D-524, 19 October)', () => {
  it('has both migrations', () => {
    expect(keyed, 'the keyed-hash migration').not.toBe('');
    expect(original, 'the D-524 migration that made phone_stops').not.toBe('');
  });

  it('scrambles the number with a keyed hash (HMAC-SHA256) and not with a plain digest anyone could try every number against', () => {
    const hash = functionText(keyed, 'phone_hash');
    expect(hash).toMatch(/extensions\.hmac\(\s*v_e164\s*,\s*public\.phone_stop_key\(\)\s*,\s*'sha256'\s*\)/);
    expect(hash).not.toMatch(/digest\(/);
    expect(keyed, 'a plain-hash function for old rows is gone').not.toMatch(/function public\.phone_hash_legacy/);
    expect(keyed, 'no other place in the migration hashes a number with a digest').not.toMatch(/\bdigest\(/);
  });

  it('keeps the key in the Vault, made in the database, and lets no role read it', () => {
    expect(keyed).toMatch(/vault\.create_secret\([\s\S]*?'phone_stop_key'/);
    expect(keyed).toMatch(/revoke all on function public\.phone_stop_key\(\) from public, anon, authenticated, service_role;/);
  });

  it('lets the service role ask whether a number has stopped, and neither compute the code nor read the list', () => {
    expect(keyed).toMatch(/revoke all on function public\.phone_hash\(text\) from public, anon, authenticated, service_role;/);
    expect(keyed).toMatch(/revoke all on public\.phone_stops from service_role;/);
    expect(original).toMatch(/revoke all on public\.phone_stops from public, anon, authenticated;/);
    expect(original).toMatch(/grant execute on function public\.phone_is_stopped\(text\) to service_role;/);
  });

  it('refuses to apply over rows made before it, because an old row is a plain hash and cannot be re-keyed', () => {
    expect(keyed).toMatch(/if exists \(select 1 from public\.phone_stops\) then\s+raise exception/);
  });

  it('holds the code and nothing about the person: no column for a number, an account, a message or a count', () => {
    const created = original.slice(original.indexOf('create table if not exists public.phone_stops ('));
    const columns = created
      .slice(0, created.indexOf('\n);'))
      .split('\n')
      .slice(1)
      .map((line) => line.trim().split(/\s+/)[0]!)
      .filter((word) => /^[a-z_]+$/.test(word));
    const added = [...keyed.matchAll(/alter table public\.phone_stops\s+(?:add|alter) column ([a-z_]+)/g)].map((m) => m[1]!);
    for (const column of [...columns, ...added]) {
      expect(['phone_hash', 'stopped_at'], `phone_stops column ${column}`).toContain(column);
    }
    expect(columns[0]).toBe('phone_hash');
  });

  it('keeps no readable number: the only notice a function raises is about the Vault being missing, and none names the number', () => {
    const notices = [...keyed.matchAll(/raise (?:notice|warning|log|info)\s+'([^']*)'/g)].map((m) => m[1]!);
    expect(notices).toEqual(['supabase_vault is unavailable here; the stop key is read from the stand-in the test database provides']);
    expect(keyed).not.toMatch(/raise (?:notice|warning|log|info)[^;]*(?:p_phone|new\.phone|old\.phone)/);
  });

  it('writes nothing but the code when a number with no account says STOP: no audit row, no log line, no count', () => {
    const stop = functionText(original, 'record_sms_stop');
    const branch = stop.slice(stop.indexOf('if v_member is null then'), stop.indexOf('end if;', stop.indexOf('if v_member is null then')));
    expect(branch).toMatch(/insert into public\.phone_stops \(phone_hash\) values \(public\.phone_hash\(p_phone\)\) on conflict do nothing;/);
    expect(branch).not.toMatch(/audit_log|raise |notice|log/i);
  });

  it('removes the code, and clears the account’s own stop, when the person texts START', () => {
    const start = functionText(keyed, 'record_sms_start');
    expect(start).toMatch(/delete from public\.phone_stops\s+where phone_hash = public\.phone_hash\(p_phone\);/);
    expect(start).toMatch(/set sms_stopped_at = null/);
  });

  it('carries the stop onto an account that takes the number, and never a yes: texts stay off', () => {
    const carry = functionText(keyed, 'carry_a_stopped_number_onto_the_account');
    expect(keyed).toMatch(/after insert or update of phone on public\.profiles/);
    expect(carry).toMatch(/insert into public\.notification_preferences \(member_id, sms_stopped_at\)/);
    expect(carry).not.toMatch(/sms_enabled|alert_(?:message|booked|changed|trip)/);
    expect(carry, 'it only ever sets a stop, never clears one').not.toMatch(/sms_stopped_at\s*=\s*null/);
  });

  it('records a carried stop in the audit log by account, with no number in it', () => {
    const carry = functionText(keyed, 'carry_a_stopped_number_onto_the_account');
    const audit = carry.slice(carry.indexOf('insert into public.audit_log'));
    expect(audit).toContain(`'{"carried": true}'::jsonb`);
    expect(audit).not.toMatch(/phone/);
  });

  describe('the line in Privacy (privacy.s.texts.p4; Sage writes, Will signs, it goes live the day sms-inbound turns on)', () => {
    const KEY = 'privacy.s.texts.p4';
    const text = EN[KEY];
    const texts = PRIVACY.sections.find((s) => s.id === 'texts');

    it.runIf(text)('is the fourth paragraph of “Text messages”', () => {
      expect(texts?.bodyKeys[3]).toBe(KEY);
    });

    it.runIf(text)('says it is a scrambled code and not the number, that nobody reads it, and how it ends, and does not say nobody can compare', () => {
      expect(text).toMatch(/scrambled/i);
      expect(text).toMatch(/not the number/i);
      expect(text).toMatch(/nobody reads it/i);
      expect(text).toMatch(/START/);
      expect(text, 'the service role can check a number against the list, so the line must not promise otherwise').not.toMatch(/nobody can/i);
    });

    for (const locale of SUPPORTED_LOCALES.filter((l) => l !== 'en')) {
      it.runIf(text)(`${locale}: keeps STOP and START in Latin letters, as the carrier needs them`, () => {
        const line = BUNDLES[locale][KEY]!;
        expect(line, `${locale} has the line`).toBeTruthy();
        expect(line).toContain('STOP');
        expect(line).toContain('START');
      });
    }
  });
});
