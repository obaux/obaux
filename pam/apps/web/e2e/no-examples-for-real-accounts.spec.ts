import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * A real account sees only its own places, programs and people (D-509). The
 * example set is for Storybook and for a demo that asks for it.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedIn(page: Page, role: 'member' | 'provider' | 'super_admin') {
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
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({ id: ME, role, first_name: 'Pia', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', org_id: null }),
    ),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trips*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trip_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/service_detail*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/flagged_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/program_services*', (route) => route.fulfill(json([])));
}

test('a member who opens an example place link is told it is not there, not shown the example', async ({ page }) => {
  await signedIn(page, 'member');
  await page.goto('/place/?id=dummy-place-learning');
  await settled(page);
  await expect(page.getByText('Example Learning Center')).toHaveCount(0);
  await expect(page.getByText('We could not find that place')).toBeVisible();
});

test('a program lead booking for someone sees no example people', async ({ page }) => {
  await signedIn(page, 'provider');
  await page.goto('/program/book/');
  await settled(page);
  await expect(page.getByText(/Example /)).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Sandra|Marcus|Tanya|Luis/ })).toHaveCount(0);
});

test('a program lead with no program has no example policies', async ({ page }) => {
  await signedIn(page, 'provider');
  await page.goto('/program/policies/');
  await settled(page);
  await expect(page.getByText('Confidentiality and disclosure')).toHaveCount(0);
});
