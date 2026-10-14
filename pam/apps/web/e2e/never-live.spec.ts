import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { LIVE_REF, STUB_URL, whyNotTestable } from './liveGuard';

/**
 * The web e2e suite never reaches the live project (D-576): the build check, and the browser that cannot leave this machine.
 */
test.describe('the build check', () => {
  const build = (js: string) => {
    const dir = mkdtempSync(join(tmpdir(), 'pam-out-'));
    mkdirSync(join(dir, '_next', 'static'), { recursive: true });
    writeFileSync(join(dir, '_next', 'static', 'a.js'), js);
    return dir;
  };
  test('a build for the stub project may be tested', () => {
    expect(whyNotTestable(build(`const u="https://${STUB_URL}"`))).toBeNull();
  });
  test('a build that names the live project may not, and the reason says which file', () => {
    expect(whyNotTestable(build(`const u="https://${LIVE_REF}.supabase.co"`))).toContain('_next/static/a.js');
  });
  test('a build that names neither may not either, and a missing build may not', () => {
    expect(whyNotTestable(build('const u=1'))).toContain('stub');
    expect(whyNotTestable(join(tmpdir(), 'pam-no-such-build'))).toContain('no build');
  });
});

test.describe('the browser cannot leave this machine', () => {
  test('a request to the live project, or any other outside host, fails in the browser; the local server still answers', async ({ page }) => {
    await page.goto('/');
    const reach = (url: string) =>
      page.evaluate((u) => fetch(u, { mode: 'no-cors' }).then(() => 'reached', () => 'blocked'), url);
    expect(await reach(`https://${LIVE_REF}.supabase.co/auth/v1/health`)).toBe('blocked');
    expect(await reach(`https://${LIVE_REF}.supabase.co/functions/v1/help-request`)).toBe('blocked');
    expect(await reach('https://example.com/')).toBe('blocked');
    expect(await reach('/')).toBe('reached');
  });
});
