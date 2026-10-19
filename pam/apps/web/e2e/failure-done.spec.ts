import { test, expect } from '@playwright/test';
import { settled } from './settled';

/**
 * An outcome that has in fact already happened shows no alert and logs nothing (D-618, Iris b77): saving a place that is already saved
 * (the database answers 23505, the row is there). The same goes for a visit already cancelled and a request already decided.
 */
const USER = '**/auth/v1/user*';
const PROFILES = '**/rest/v1/profiles*';
const NOTIFICATIONS = '**/rest/v1/notifications*';
const SAVED = '**/rest/v1/rpc/saved_places_mine*';
const SAVED_ROWS = '**/rest/v1/saved_places*';
const NEAR = '**/rest/v1/rpc/services_near*';
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const PLACE = {
  id: 'svc-1', name: 'Example Learning Center', lookup_name: 'Example Learning Center', category: 'education', subcategory: null,
  address: '123 Main St', phone: '+12155550100', place_id: null, lat: 39.95, lon: -75.16, meters: 900, has_hours: false,
  description_plain: 'Free classes and a computer room. Walk in and ask at the desk.', website: null, audience: null, hours: null,
};

test('saving a place that is already saved shows no alert and sends nothing to the error log', async ({ page }) => {
  const reports: unknown[] = [];
  await page.addInitScript((userId: string) => {
    const session = { access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: userId, aud: 'authenticated', role: 'authenticated' } };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, ME);
  await page.route(USER, (route) => route.fulfill(json({ id: ME })));
  await page.route(PROFILES, (route) => route.fulfill(json({ id: ME, role: 'member', first_name: 'Will', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-12T00:00:00Z' })));
  await page.route(NOTIFICATIONS, (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/member_points*', (route) => route.fulfill(json(25)));
  await page.route(SAVED, (route) => route.fulfill(json([])));
  await page.route(NEAR, (route) => route.fulfill(json([PLACE])));
  await page.route('**/rest/v1/rpc/report_app_error', (route) => {
    reports.push(route.request().postDataJSON());
    return route.fulfill(json(false));
  });
  // The row is already there: the insert is refused as a duplicate.
  await page.route(SAVED_ROWS, (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ code: '23505', message: 'duplicate key value' }) })
      : route.fulfill(json([])),
  );
  await page.goto('/');
  await settled(page);
  await page.getByRole('button', { name: 'Save' }).click();
  // Nothing is said: not the server's line, not any other.
  await page.waitForTimeout(1_500);
  await expect(page.locator('[data-pam-malfunction]')).toHaveCount(0);
  await expect(page.getByRole('alert').filter({ hasText: /Something's wrong|didn't go through|Still not working|already changed/ })).toHaveCount(0);
  expect(reports).toHaveLength(0);
});
