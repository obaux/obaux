import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * A real account sees only what is really theirs (D-509; Will, 11 October 2026:
 * "I haven't signed up to any trips, but it shows I did"). No example trips, no
 * example places' policies, no drawn map with pretend pins. Examples stay for
 * Storybook and for an explicit demo (`sessionStorage['pam.examples']`).
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const PLACE = '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

async function signedIn(page: Page, rows: unknown[], extra?: { examples?: boolean }) {
  await page.addInitScript(
    ([userId, examples]: [string, boolean]) => {
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
      if (examples) window.sessionStorage.setItem('pam.examples', '1');
    },
    [ME, extra?.examples === true] as [string, boolean],
  );
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({ id: ME, role: 'member', first_name: 'Marcus', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' }),
    ),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trip_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trips*', (route) => route.fulfill(json(rows)));
  await page.route('**/rest/v1/program_policies*', (route) => route.fulfill(json([])));
}

const row = (id: string, startsAt: string) => ({
  id, service_id: PLACE, place_name: 'Riverside Job Center', category: 'workforce', address: '1234 Market St',
  lat: 39.95, lon: -75.16, starts_at: startsAt, note: null, status: 'scheduled',
});

test('no trips: an empty drawer, no example cards, no policies banner, no drawn map', async ({ page }) => {
  await signedIn(page, []);
  await page.goto('/trips/');
  await settled(page);
  await expect(page.getByRole('heading', { name: 'No trips yet' })).toBeVisible();
  await expect(page.getByText('Plan a visit and it shows here.')).toBeVisible();
  await expect(page.getByText(/Example /)).toHaveCount(0);
  await expect(page.getByText(/policies .* before you go/)).toHaveCount(0);
  await expect(page.getByText('Map preview')).toHaveCount(0);
  await expect(page.getByText('Past visits')).toHaveCount(0);
});

test('one real trip: exactly that trip, and its one pin', async ({ page }) => {
  await signedIn(page, [row('7a1f0f3c-2b11-4c0f-8b64-000000000002', daysFromNow(6))]);
  await page.goto('/trips/');
  await settled(page);
  await expect(page.getByText(/Example /)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No trips yet' })).toHaveCount(0);
  await expect(page.getByText('1 coming up')).toBeVisible();
  // The drawn map's pin and the card are the two links to this place.
  await expect(page.getByRole('link', { name: /Riverside Job Center/ })).toHaveCount(2);
});

test('Explore has no example next visit for a real account', async ({ page }) => {
  await signedIn(page, []);
  await page.goto('/');
  await settled(page);
  await expect(page.getByText(/Example Learning Center/)).toHaveCount(0);
});

test('a demo that asks for the examples gets them', async ({ page }) => {
  await signedIn(page, [], { examples: true });
  await page.goto('/trips/');
  await settled(page);
  await expect(page.getByText(/Example Learning Center/).first()).toBeVisible();
});

test('two trips whose labels would overprint are one pin, "2 trips"', async ({ page }) => {
  // The drawn map spreads pins across the band; side by side at the same latitude, a 320px phone
  // leaves them 115px apart, which is closer than a 120px name.
  test.skip((page.viewportSize()?.width ?? 0) > 330, 'only the narrowest phone puts them closer than a name');
  await signedIn(page, [
    row('7a1f0f3c-2b11-4c0f-8b64-000000000003', daysFromNow(2)),
    { ...row('7a1f0f3c-2b11-4c0f-8b64-000000000004', daysFromNow(4)), service_id: '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b12', place_name: 'Market Street Library', lat: 39.95, lon: -75.1601 },
  ]);
  await page.goto('/trips/');
  await settled(page);
  await expect(page.getByText('2 trips')).toBeVisible();
});
