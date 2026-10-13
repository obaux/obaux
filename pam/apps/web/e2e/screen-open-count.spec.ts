import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * A member's phone counts Your points and Profile once a day each (a69, a76; D-555). The call
 * carries only the screen's name; the phone keeps a dated note on itself and never sends it.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedIn(page: Page, role: 'member' | 'admin') {
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 't',
      refresh_token: 'r',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) {
      window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
    }
  }, ME);
  await page.route('**/rest/v1/**', (route) => route.fulfill(json([])));
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({ id: ME, role, first_name: 'Pia', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', org_id: null }),
    ),
  );
}

function watchCounts(page: Page): unknown[] {
  const calls: unknown[] = [];
  void page.route('**/rest/v1/rpc/count_screen_open*', (route) => {
    calls.push(route.request().postDataJSON());
    return route.fulfill(json(null));
  });
  return calls;
}

test.describe('counting screen opens', () => {
  test('Your points: one call the first time today, none on the next open, and only a date kept', async ({ page }) => {
    await signedIn(page, 'member');
    const calls = watchCounts(page);
    await page.goto('/points/');
    await settled(page);
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0]).toEqual({ p_screen: 'points' });
    const note = await page.evaluate(() => window.localStorage.getItem('pam.counted.points'));
    expect(note).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await page.reload();
    await settled(page);
    await page.waitForTimeout(500);
    expect(calls.length).toBe(1);
  });

  test('Profile is counted on its own, and carries nothing but the screen name', async ({ page }) => {
    await signedIn(page, 'member');
    const calls = watchCounts(page);
    await page.goto('/profile/');
    await settled(page);
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0]).toEqual({ p_screen: 'profile' });
  });

  test('a day later it counts again', async ({ page }) => {
    await signedIn(page, 'member');
    const calls = watchCounts(page);
    await page.addInitScript(() => window.localStorage.setItem('pam.counted.points', '2000-01-01'));
    await page.goto('/points/');
    await settled(page);
    await expect.poll(() => calls.length).toBe(1);
  });

  test('a failed call is tried again at the next open', async ({ page }) => {
    await signedIn(page, 'member');
    let calls = 0;
    await page.route('**/rest/v1/rpc/count_screen_open*', (route) => {
      calls += 1;
      return calls === 1
        ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'down' }) })
        : route.fulfill(json(null));
    });
    await page.goto('/points/');
    await settled(page);
    await expect.poll(() => calls).toBe(1);
    await page.reload();
    await settled(page);
    await expect.poll(() => calls).toBe(2);
  });

  test('staff looking at the same screens are not counted', async ({ page }) => {
    await signedIn(page, 'admin');
    const calls = watchCounts(page);
    await page.goto('/points/');
    await settled(page);
    await page.waitForTimeout(500);
    expect(calls.length).toBe(0);
  });
});
