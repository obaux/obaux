import { expect, test, type Page } from '@playwright/test';
import { settled } from './settled';
import { asMember } from './asMember';

/**
 * Iris's second Member flow pass (15 October 2026): W4 (Help on New trip's first step), P3 (a long place name
 * wraps on Trips, never cut), P7 (Copy address and "View all places to visit" are 48px). Supabase is stubbed.
 */
const PLACE = '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11';
const TRIP = '7a1f0f3c-2b11-4c0f-8b64-000000000002';
const LONG = 'Example Trade Skills Workforce Training and Placement Program for Returning Citizens';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function withTrip(page: Page, language: 'en' | 'ar') {
  await asMember(page, 'member', language === 'en' ? null : language);
  await page.route('**/rest/v1/rpc/my_trip_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trips*', (route) =>
    route.fulfill(
      json([
        {
          id: TRIP, service_id: PLACE, place_name: LONG, category: 'workforce', address: '1234 Market St', lat: 39.95, lon: -75.16,
          starts_at: new Date(Date.now() + 6 * 86_400_000).toISOString(), note: null, status: 'scheduled',
        },
      ]),
    ),
  );
}

for (const language of ['en', 'ar'] as const) {
  test(`a long place name wraps on Trips and is not cut off, ${language}`, async ({ page }) => {
    await withTrip(page, language);
    await page.goto('/trips/');
    await settled(page);
    const name = page.getByRole('heading', { name: LONG });
    await expect(name).toBeVisible();
    const box = await name.boundingBox();
    expect(box!.height, 'more than one line').toBeGreaterThan(30);
    const cut = await name.evaluate((el) => el.scrollWidth > el.clientWidth || getComputedStyle(el).textOverflow === 'ellipsis');
    expect(cut, 'the name is cut').toBe(false);
  });
}

test('New trip has Help on its first step, When, as on Check (W4)', async ({ page }) => {
  await asMember(page);
  await page.goto('/trips/new/?place=dummy-place-learning&name=Example%20Learning%20Center&category=education');
  await settled(page);
  await expect(page.getByRole('heading', { name: 'When?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Help' }).or(page.getByRole('button', { name: 'Help' }))).toBeVisible();
});

test('"View all places to visit" on New trip is 48px or more (P7)', async ({ page }) => {
  await asMember(page);
  await page.goto('/trips/new/');
  await settled(page);
  const all = page.getByRole('button', { name: 'View all places to visit' });
  await expect(all).toBeVisible();
  const box = await all.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(48);
  expect(box!.width).toBeGreaterThanOrEqual(48);
  await all.click();
  await expect(page).toHaveURL(/\/(\?|$)/);
});

test('Copy address is 48px by 48px on a place (P7)', async ({ page }) => {
  await asMember(page);
  await page.route('**/rest/v1/rpc/service_detail*', (route) =>
    route.fulfill(json([{ id: PLACE, name: 'Riverside Job Center', lookup_name: 'RIVERSIDE JOB CENTER', category: 'workforce', subcategory: null, address: '1234 Market St', phone: null, place_id: null, lat: 39.95, lon: -75.16, description_plain: 'Jobs.', website: null, audience: null, hours: null }])),
  );
  await page.goto(`/place/?id=${PLACE}`);
  await settled(page);
  const copy = page.getByRole('button', { name: 'Copy address' });
  await expect(copy).toBeVisible();
  const box = await copy.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(48);
  expect(box!.height).toBeGreaterThanOrEqual(48);
});
