import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * A member's saved visits (D-454): one whose time has gone moves out of the
 * coming-up list into "Past visits", and cancelling a saved one asks the
 * database (`cancel_trip`), which also cancels its day-before text.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const PLACE = '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11';
const NEXT = '7a1f0f3c-2b11-4c0f-8b64-000000000002';
const LAST = '7a1f0f3c-2b11-4c0f-8b64-000000000001';

const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

const row = (id: string, startsAt: string) => ({
  id,
  service_id: PLACE,
  place_name: 'Riverside Job Center',
  category: 'workforce',
  address: '1234 Market St',
  lat: 39.95,
  lon: -75.16,
  starts_at: startsAt,
  note: null,
  status: 'scheduled',
});

async function signedIn(page: import('@playwright/test').Page, rows: unknown[]) {
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
      json({ id: ME, role: 'member', first_name: 'Marcus', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' }),
    ),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trip_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trips*', (route) => route.fulfill(json(rows)));
}

test.describe('past visits and cancelling', () => {
  test('a visit whose time has gone is under Past visits, not coming up', async ({ page }) => {
    await signedIn(page, [row(NEXT, daysFromNow(6)), row(LAST, daysFromNow(-3))]);
    await page.goto('/trips/');
    await settled(page);

    const past = page.getByRole('heading', { name: 'Past visits' });
    await expect(past).toBeVisible();
    // Exactly one visit card sits below the heading (the map's pin is another link, above it).
    const pastY = (await past.boundingBox())!.y;
    const links = await page.getByRole('link', { name: /Riverside Job Center/ }).all();
    const below = [];
    for (const link of links) if (((await link.boundingBox())?.y ?? 0) > pastY) below.push(link);
    expect(below).toHaveLength(1);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('cancelling a saved visit asks the database, then leaves Trips without it', async ({ page }) => {
    let rows = [row(NEXT, daysFromNow(6))];
    await signedIn(page, rows);
    await page.route('**/rest/v1/rpc/my_trips*', (route) => route.fulfill(json(rows)));
    const cancelled: unknown[] = [];
    await page.route('**/rest/v1/rpc/cancel_trip*', (route) => {
      cancelled.push(route.request().postDataJSON());
      rows = [];
      return route.fulfill(json({ id: NEXT, status: 'cancelled' }));
    });
    await page.route('**/rest/v1/rpc/service_detail*', (route) =>
      route.fulfill(
        json([
          {
            id: PLACE, name: 'Riverside Job Center', lookup_name: 'RIVERSIDE JOB CENTER', category: 'workforce', subcategory: null,
            address: '1234 Market St', phone: null, place_id: null, lat: 39.95, lon: -75.16, description_plain: 'Jobs.',
            website: null, audience: null, hours: null,
          },
        ]),
      ),
    );

    await page.goto(`/place/?id=${PLACE}&from=trips&trip=${NEXT}`);
    await settled(page);
    await page.getByRole('button', { name: 'Cancel this visit' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Yes, cancel it' }).click();

    await expect(page).toHaveURL(/\/trips\/$/);
    expect(cancelled).toEqual([{ p_id: NEXT }]);
    await settled(page);
    await expect(page.getByRole('link', { name: /Riverside Job Center/ })).toHaveCount(0);
  });
});
