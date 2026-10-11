import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * Choosing where the list is measured from.
 *
 * The RPCs are stubbed, as everywhere else — this container cannot reach
 * Supabase. What a member types goes to Pam's `search_areas` and nowhere else:
 * the browser no longer asks the City of Philadelphia's API about a street
 * address (D-536), and a test below watches for any call to it.
 */

const AREAS = '**/rest/v1/rpc/search_areas*';
const PLACES = '**/rest/v1/rpc/services_near*';

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
    // find the pencil to discover that this is theirs to set.
    await page.getByRole('button', { name: 'Near City Hall' }).click();
    await expect(page.getByRole('textbox', { name: 'ZIP code' })).toBeVisible();
    // The search finds ZIP codes and neighborhoods, so the picker says what to type.
    await expect(page.getByText('Like 19107, or Fishtown.')).toBeVisible();
  });

  test('the pencil beside it does the same thing, and says so', async ({ page }) => {
    // It is a picture with no word next to it, so its accessible name has to
    // carry the whole meaning — "Change the area", not "Edit".
    await stub(page);
    await page.goto('/places/');

    await page.getByRole('button', { name: 'Change the area' }).click();
    await expect(page.getByRole('textbox', { name: 'ZIP code' })).toBeVisible();
  });

  test('lives in the header, so the list starts at the top of the page', async ({ page }) => {
    await stub(page);
    await page.goto('/places/');

    const inHeader = await page
      .getByRole('button', { name: 'Near City Hall' })
      .evaluate((el) => Boolean(el.closest('header')));
    expect(inHeader, 'the area control is not in the header').toBe(true);
  });

  test('offers somewhere to start before anything is typed', async ({ page }) => {
    await stub(page);
    await page.goto('/places/');
    await page.getByRole('button', { name: 'Change the area' }).click();

    // No typing yet, and there are already options. Somebody who does not know
    // what to enter is not left staring at an empty box.
    await expect(page.getByRole('button', { name: /^19104/ })).toBeVisible();
  });

  test('remembers the choice on this device', async ({ page }) => {
    await stub(page);
    await page.goto('/places/');
    await page.getByRole('button', { name: 'Change the area' }).click();
    // A row picks; Done keeps it (D-275).
    await page.getByRole('button', { name: /^19122/ }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    await expect(page.getByRole('button', { name: 'Near 19122' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'Near 19122' })).toBeVisible();
  });

  test('typing a street address asks only Pam: nothing goes to the City of Philadelphia (D-536)', async ({ page }) => {
    await stub(page);
    const outside: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (/carto\.com/.test(url)) outside.push(url);
    });
    const asked: unknown[] = [];
    await page.route(AREAS, (route) => {
      asked.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ZIPS) });
    });
    await page.goto('/places/');
    await page.getByRole('button', { name: 'Change the area' }).click();
    await page.getByRole('textbox', { name: 'ZIP code' }).fill('1234 Market');

    // The ZIP list answers, from Pam's own search, and the typed text went to it as a POST body.
    await expect(page.getByRole('button', { name: /^19104/ })).toBeVisible();
    await expect.poll(() => asked.some((body) => (body as { p_query?: string }).p_query === '1234 Market')).toBe(true);
    expect(outside).toEqual([]);
  });

  test('closing without Done leaves the area as it was (D-275)', async ({ page }) => {
    await stub(page);
    await page.goto('/places/');
    await page.getByRole('button', { name: 'Change the area' }).click();
    await page.getByRole('button', { name: /^19122/ }).click();
    await page.keyboard.press('Escape');

    await expect(page.getByRole('button', { name: 'Near City Hall' })).toBeVisible();
  });

  test('has no WCAG A/AA violations while open', async ({ page }) => {
    await stub(page);
    await page.goto('/places/');
    await page.getByRole('button', { name: 'Change the area' }).click();
    await expect(page.getByRole('button', { name: /^19104/ })).toBeVisible();

    await settled(page);

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
