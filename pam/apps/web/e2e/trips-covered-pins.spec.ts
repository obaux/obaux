import { test, expect } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';

/**
 * Trips (Iris's interaction run-through, P3): with the sheet up, the map's pins it covers are still in the page, so a screen reader
 * reaches them (and Tab) while a finger on that spot lands on the sheet's card. A pin the sheet covers whole is out of reach of all
 * three; with the sheet half open, where the pins show above it, they are reachable.
 */
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

test.beforeEach(async ({ page }) => {
  await asMember(page, 'member');
  await page.route('**/rest/v1/rpc/my_trip_services*', (r) => r.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trip_booked_by*', (r) => r.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trips*', (r) =>
    r.fulfill(
      json([
        { id: 'v1', service_id: '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11', place_name: 'Riverside Job Center', category: 'workforce', address: '1 Main St', lat: 39.95, lon: -75.16, starts_at: inDays(3), note: null, status: 'scheduled' },
        { id: 'v2', service_id: '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b12', place_name: 'Northside Learning', category: 'education', address: '2 Main St', lat: 39.99, lon: -75.12, starts_at: inDays(4), note: null, status: 'scheduled' },
      ]),
    ),
  );
  await page.route('**/rest/v1/program_policies*', (r) => r.fulfill(json([])));
});

test('half open, the pins show above the sheet and are reachable; fully up, the ones it covers are out of reach', async ({ page }) => {
  await page.goto('/trips/');
  await settled(page);
  // By attribute, not by role: fully up the whole map is hidden from the accessibility tree, and these checks are about its pins.
  const pins = page.locator('[aria-label="Map of your trips"] a[href]');
  // Half open: the pins sit above the sheet, so a person can find and tap them. (On the narrowest phones two near pins are drawn as one,
  // "2 trips", so how many there are depends on the screen: at least one.)
  await expect(pins.first()).toBeVisible();
  const shownAtHalf = await pins.count();
  expect(shownAtHalf).toBeGreaterThanOrEqual(1);
  expect(await pins.evaluateAll((els) => els.filter((el) => el.getAttribute('aria-hidden') === 'true').length)).toBe(0);
  // The sheet all the way up covers them.
  await page.getByRole('button', { name: 'Show more of your trips' }).click();
  await page.getByRole('button', { name: 'Show the map' }).waitFor();
  await page.waitForTimeout(400);
  const covered = await pins.evaluateAll((els) => els.map((el) => ({ hidden: el.getAttribute('aria-hidden'), tab: el.getAttribute('tabindex') })));
  expect(covered).toHaveLength(shownAtHalf);
  expect(covered.every((pin) => pin.hidden === 'true' && pin.tab === '-1')).toBe(true);
  // A screen reader's list of links no longer has them.
  await expect(page.getByRole('region', { name: 'Map of your trips' }).getByRole('link')).toHaveCount(0);
  // And back to half: they are reachable again.
  await page.getByRole('button', { name: 'Show the map' }).click();
  await page.waitForTimeout(400);
  await expect(page.getByRole('region', { name: 'Map of your trips' }).getByRole('link')).toHaveCount(shownAtHalf);
});

test('fully up, Tab never lands in the map the sheet covers, and the map is hidden from a screen reader (Iris, P3 polish)', async ({ page }) => {
  await page.goto('/trips/');
  await settled(page);
  await page.getByRole('button', { name: 'Show more of your trips' }).click();
  await page.getByRole('button', { name: 'Show the map' }).waitFor();
  await page.waitForTimeout(400);
  const landed: string[] = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    landed.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        const inMap = Boolean(el?.closest('[aria-label="Map of your trips"]'));
        return `${inMap ? 'MAP ' : ''}${el?.tagName ?? ''} ${(el?.getAttribute('aria-label') ?? el?.textContent ?? '').slice(0, 30)}`;
      }),
    );
  }
  expect(landed.filter((where) => where.startsWith('MAP'))).toEqual([]);
  // Nothing in it is read either: the map as a whole is hidden while the sheet covers it.
  await expect(page.getByRole('region', { name: 'Map of your trips' })).toHaveCount(0);
  // Back to half: it is there again.
  await page.getByRole('button', { name: 'Show the map' }).click();
  await page.waitForTimeout(400);
  await expect(page.getByRole('region', { name: 'Map of your trips' })).toHaveCount(1);
});
