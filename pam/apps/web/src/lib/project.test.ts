import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, APP_URL } from './project';

/**
 * The project this build talks to is checked in, so that PAM needs no
 * configuration to run. That trade is only safe while one thing stays true:
 * nothing in this file grants anything the access rules do not.
 *
 * These tests are the guard on that. A service role key here would bypass every
 * policy in `packages/db` and every promise in §4.1, and it would do it
 * silently, in a public repository.
 */
const source = readFileSync(new URL('./project.ts', import.meta.url), 'utf8');

describe('the checked-in project settings', () => {
  it('point at a real Supabase project over https', () => {
    expect(SUPABASE_URL).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
  });

  it('carry a publishable key, which is meant to ship in a browser', () => {
    expect(SUPABASE_PUBLISHABLE_KEY).toMatch(/^(sb_publishable_|eyJ)/);
  });

  it('never carry a secret', () => {
    // Shapes of the things that must live in Edge Function secrets instead:
    // Supabase's secret keys, a legacy service-role JWT, a Twilio account SID
    // or auth token.
    expect(source).not.toMatch(/sb_secret_/);
    expect(source).not.toMatch(/service_role/);
    expect(source).not.toMatch(/\bAC[0-9a-f]{32}\b/);
    expect(source).not.toMatch(/TWILIO/);
  });

  it('point somewhere a text message can reach', () => {
    // An invite arrives as a link before anybody has installed anything, so
    // this has to be a public address rather than a local one.
    expect(APP_URL).toMatch(/^https:\/\//);
    expect(APP_URL).not.toMatch(/localhost|127\.0\.0\.1|capacitor:/);
  });
});
