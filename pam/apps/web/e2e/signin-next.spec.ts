import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * A way on after Sign in (S1): the website's "Add your program" arrives as /signin/?next=/profile/add-program/. Only that listed screen is
 * followed; anything else (an outside address, another screen) is ignored; and a program lead is not sent there.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedIn(page: Page, role: 'member' | 'provider' | 'admin' | 'super_admin') {
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, ME);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: ME, role, first_name: 'Ada', region_id: null, regions: { name: 'Philadelphia' }, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/staff_requests*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
}

test('a member already in who follows the listed next goes to Add my program', async ({ page }) => {
  await signedIn(page, 'member');
  await page.goto('/signin/?next=/profile/add-program/');
  await expect(page).toHaveURL(/\/profile\/add-program\/$/);
});

test('anything not on the list is ignored: they land Home', async ({ page }) => {
  for (const next of ['https://evil.example/', '//evil.example/', '/admin/', '/profile/']) {
    await signedIn(page, 'member');
    await page.goto(`/signin/?next=${encodeURIComponent(next)}`);
    await settled(page);
    await expect(page, next).not.toHaveURL(/evil\.example|\/admin\/|\/profile\/$/);
    await expect(page).toHaveURL(/localhost|127\.0\.0\.1/);
    await page.context().clearCookies();
    await page.unrouteAll();
  }
});

test('a program lead is not sent to Add my program', async ({ page }) => {
  await signedIn(page, 'provider');
  await page.goto('/signin/?next=/profile/add-program/');
  await settled(page);
  await expect(page).not.toHaveURL(/add-program/);
});

test('a case manager and a super admin are not sent to Add my program either', async ({ page }) => {
  for (const role of ['admin', 'super_admin'] as const) {
    await signedIn(page, role);
    await page.goto('/signin/?next=/profile/add-program/');
    await settled(page);
    await expect(page, role).not.toHaveURL(/add-program/);
    await page.unrouteAll();
  }
});

test('the way on is forgotten when it is not taken: it does not fire on a later visit to Sign in (W6)', async ({ page }) => {
  // A program lead arrives with ?next, is not taken there, and a member signing in later in the same tab is not either.
  await signedIn(page, 'provider');
  await page.goto('/signin/?next=/profile/add-program/');
  await settled(page);
  expect(await page.evaluate(() => window.sessionStorage.getItem('pam.signin-next'))).toBeNull();
});
