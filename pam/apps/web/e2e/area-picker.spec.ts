import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Choosing where the list is measured from.
 *
 * The RPCs are stubbed, as everywhere else — this container cannot reach
 * Supabase — but the city address lookup is stubbed too, and deliberately: it
 * proves the enhancement is optional. A member whose network cannot reach
 * Philadelphia's API still gets the ZIP list.
 */

const AREAS = '**/rest/v1/rpc/search_areas*';
const PLACES = '**/rest/v1/rpc/services_near*';
const CARTO = 'https://phl.carto.com/**';

const ZIPS = [
  { id: 'a1', kind: 'zip', label: '19104', lat: 39.963788, lon: -75.202914 },
  { id: 'a2', kind: 'zip', label: '19122', lat: 39.977653, lon: -75.143016 },
  { id: 'a3', kind: 'landmark', label: 'City Hall', lat: 39.9526, lon: -75.1652 },
];

const PLACE = {
  id: 'p1',
  name: 'Santore Library',
  lookup_name: 'Santore Library',
  category: 'education',
  subcategory: null,
  address: '932 S 7th St, Philadelphia, PA',
  phone: null,
  place_id: null,
  lat: 39.9371,
  lon: -75.15526,
  meters: 1919.3,
  has_hours: false,
};

async function stub(page: import('@playwright/test').Page) {
  await page.route(AREAS, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ZIPS) }),
  );
  await page.route(PLACES, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([PLACE]) }),
  );
}

test.describe('choosing an area', () => {
  test('the area is a control, not a label', async ({ page }) => {
    await stub(page);
    await page.goto('/places/');

    // Tapping the area itself opens the picker: a member should not have to
    // read the word "Change" to discover that this is theirs to set.
    await page.getByRole('button', { name: /Showing places near City Hall/ }).click();
    await expect(page.getByRole('textbox', { name: 'Where are you staying now?' })).toBeVisible();
  });

  test('offers somewhere to start before anything is typed', async ({ page }) => {
    await stub(page);
    await page.goto('/places/');
    await page.getByRole('button', { name: 'Change' }).click();

    // No typing yet, and there are already options. Somebody who does not know
    // what to enter is not left staring at an empty box.
    await expect(page.getByRole('option', { name: '19104' })).toBeVisible();
  });

  test('remembers the choice on this device', async ({ page }) => {
    await stub(page);
    await page.goto('/places/');
    await page.getByRole('button', { name: 'Change' }).click();
    await page.getByRole('option', { name: '19122' }).click();

    await expect(page.getByRole('button', { name: /Showing places near 19122/ })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: /Showing places near 19122/ })).toBeVisible();
  });

  test('a street address still resolves when the city API answers', async ({ page }) => {
    await stub(page);
    await page.route(CARTO, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rows: [
            { location: '1231-39 N BROAD ST', zip_code: '19122', lat: 39.9729, lon: -75.1586 },
          ],
        }),
      }),
    );
    await page.goto('/places/');
    await page.getByRole('button', { name: 'Change' }).click();
    await page.getByRole('textbox', { name: 'Where are you staying now?' }).fill('1231 N Broad');

    await expect(page.getByRole('option', { name: /1231-39 N Broad St, 19122/ })).toBeVisible();
  });

  test('the ZIP list still answers when the city API does not', async ({ page }) => {
    await stub(page);
    await page.route(CARTO, (route) => route.abort());
    await page.goto('/places/');
    await page.getByRole('button', { name: 'Change' }).click();
    await page.getByRole('textbox', { name: 'Where are you staying now?' }).fill('1231 N Broad');

    // The address lookup failed and the screen says nothing about it, because
    // there is nothing a member can do with that. The ZIPs are still there.
    await expect(page.getByRole('option', { name: '19104' })).toBeVisible();
  });

  test('has no WCAG A/AA violations while open', async ({ page }) => {
    await stub(page);
    await page.goto('/places/');
    await page.getByRole('button', { name: 'Change' }).click();
    await expect(page.getByRole('option', { name: '19104' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.error(
        results.violations
          .map((v) => `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.html).join('\n  ')}`)
          .join('\n\n'),
      );
    }
    expect(results.violations).toEqual([]);
  });
});
