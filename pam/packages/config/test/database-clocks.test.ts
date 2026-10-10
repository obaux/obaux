import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The database clocks (D-484). The scheduler and the vault do not exist in the test database, so the
 * migration cannot be run against them; what can be held is its text. These checks keep the three
 * promises that matter: the secret is never written down, both clocks send it and run every five
 * minutes, and the migration can be run again.
 */
const dir = fileURLToPath(new URL('../../db/migrations/', import.meta.url));
const file = readdirSync(dir).find((name) => name.includes('the_clocks_send_the_shared_secret'));
const sql = file ? readFileSync(dir + file, 'utf8') : '';
// The code, not the comments that explain it.
const code = sql
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('--'))
  .join('\n');

describe('the clocks send the shared secret from the vault (D-484)', () => {
  it('the migration exists', () => {
    expect(file, 'no migration named …the_clocks_send_the_shared_secret…').toBeDefined();
  });

  it('is guarded for a database with no scheduler or no vault', () => {
    expect(code).toMatch(/pg_available_extensions where name = 'pg_cron'/);
    expect(code).toMatch(/pg_available_extensions where name = 'supabase_vault'/);
  });

  it('makes the secret in the database from random bytes, once, and never writes a value down', () => {
    expect(code).toMatch(/vault\.create_secret\(\s*encode\(extensions\.gen_random_bytes\(32\), 'hex'\)/);
    expect(code).toMatch(/if not exists \(select 1 from vault\.secrets where name = 'dispatch_secret'\)/);
    // No long hex or base64 literal anywhere that could be a secret.
    expect(code).not.toMatch(/'[0-9a-fA-F]{32,}'/);
    expect(code).not.toMatch(/dispatch_secret',\s*'[^']{16,}'\s*,/);
  });

  for (const job of ['dispatch-sms', 'send-invite-emails']) {
    it(`${job}: unscheduled by name first, then scheduled every five minutes with the header read at run time`, () => {
      const unschedule = code.indexOf(`jobname = '${job}'`);
      const schedule = code.indexOf(`'${job}',\n    '*/5 * * * *'`);
      expect(unschedule, `${job} is not unscheduled by name`).toBeGreaterThan(-1);
      expect(schedule, `${job} is not scheduled every five minutes`).toBeGreaterThan(unschedule);
      const body = code.slice(schedule, code.indexOf('$cron$;', schedule));
      expect(body).toContain(`/functions/v1/${job}`);
      expect(body).toMatch(
        /'x-dispatch-secret', \(select decrypted_secret from vault\.decrypted_secrets where name = 'dispatch_secret'\)/,
      );
      // Under the five minutes between runs.
      const timeout = /timeout_milliseconds := (\d+)/.exec(body)?.[1];
      expect(Number(timeout)).toBeGreaterThan(0);
      expect(Number(timeout)).toBeLessThan(300_000);
    });
  }

  it('sends only the publishable key as a bearer token, never a service key', () => {
    expect(code).toMatch(/Bearer sb_publishable_/);
    expect(code).not.toMatch(/service_role|sb_secret_|eyJ[A-Za-z0-9_-]{20,}/);
  });
});
