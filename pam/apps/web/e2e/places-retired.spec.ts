import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * The old Places list is retired (Will, 13 October 2026). Its address only forwards, with replace so Back does not bounce: a member
 * to Explore, a case manager or a program to All programs, and ?filter=reported to Reported places for the people who review them.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedIn(page: Page, role: 'member' | 'admin' | 'provider' | 'super_admin') {
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
    route.fulfill(json({ id: ME, role, first_name: 'Pia', region_id: null, regions: { name: 'Philadelphia' }, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', org_id: null })),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/services_near*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/flagged_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
}

const where = [
  ['member', '/places/', /\/$/],
  ['admin', '/places/', /\/programs\/$/],
  ['provider', '/places/', /\/programs\/$/],
  ['super_admin', '/places/', /\/$/],
  ['admin', '/places/?filter=reported', /\/places\/reported\/$/],
  ['super_admin', '/places/?filter=reported', /\/places\/reported\/$/],
  // Somebody who cannot review it is not sent there.
  ['member', '/places/?filter=reported', /\/$/],
] as const;

for (const [role, path, expected] of where) {
  test(`${role} on ${path} is forwarded to ${expected}`, async ({ page }) => {
    await signedIn(page, role);
    await page.goto(path);
    await expect(page).toHaveURL(expected);
    await settled(page);
    // replace, not push: Back does not come back to the retired address.
    expect(await page.evaluate(() => window.history.length)).toBeLessThanOrEqual(2);
  });
}

test('a signed-out visitor is forwarded too, to the front door', async ({ page }) => {
  await page.route('**/auth/v1/user*', (route) => route.fulfill({ status: 401, body: '{}' }));
  await page.goto('/places/');
  await expect(page).not.toHaveURL(/\/places\/$/);
});
