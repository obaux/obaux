import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * The places screen, which is the first one backed by real data.
 *
 * The catalogue lives in Supabase and this environment cannot reach it — nor
 * should CI depend on a live database to know whether a list renders. So the
 * RPC response is stubbed with the exact payload `services_near` returned as the
 * `anon` role against the real project, field names and all. What is being
 * tested is the screen's contract with that payload:
 *
 *   - a distance from metres never reaches the page as a raw float (D-043)
 *   - nothing claims a place is open, because PAM has no hours (D-044)
 *   - a failed query is a message and a phone number, never a blank list (§0)
 */

const ROWS = [
  {
    id: 'a20e803f-1ab9-4cd7-a152-a3cb99a85af3',
    name: 'J J Peters',
    lookup_name: 'J J PETERS',
    category: 'family_services',
    subcategory: null,
    address: '100 S Broad St Philadelphia, PA 19110',
    phone: null,
    place_id: null,
    lat: 39.94738,
    lon: -75.175,
    meters: 222.56625541,
    has_hours: false,
  },
  {
    id: 'e9aea5a0-896b-4c73-8dc9-a7ae1ff02ed5',
    name: 'John F. Kennedy Behavioral Health Center',
    lookup_name: 'JOHN F. KENNEDY BEHAVIORAL HEALTH CENTER',
    category: 'family_services',
    subcategory: null,
    address: '112 N Broad St Philadelphia, PA 19102',
    phone: '+12155550142',
    place_id: null,
    lat: null,
    lon: null,
    meters: 2896.5,
    has_hours: false,
  },
];

const RPC = '**/rest/v1/rpc/services_near*';

test.describe('the places screen', () => {
  test('renders the catalogue, with distances a person would say', async ({ page }) => {
    await page.route(RPC, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROWS) }),
    );
    await page.goto('/places/');

    await expect(page.getByRole('heading', { name: 'J J Peters' })).toBeVisible();

    // 222.57 m is 0.1383… miles, and 2896.5 m is 1.7999… — the exact shape of
    // the float that reached a card before there was a formatter.
    await expect(page.getByText('0.1 miles')).toBeVisible();
    await expect(page.getByText('1.8 miles')).toBeVisible();
    await expect(page.getByText(/\d\.\d{3,}/)).toHaveCount(0);
  });

  test('never says a place is open, because PAM does not know', async ({ page }) => {
    await page.route(RPC, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROWS) }),
    );
    await page.goto('/places/');
    await expect(page.getByRole('heading', { name: 'J J Peters' })).toBeVisible();

    await expect(page.getByText(/open now/i)).toHaveCount(0);
    // No phone means the first action sends the member to the Google listing
    // for hours; a phone means it dials.
    await expect(page.getByRole('link', { name: 'Hours' }).first()).toHaveAttribute(
      'href',
      /google\.com\/maps\/search/,
    );
    await expect(page.getByRole('link', { name: 'Call' }).first()).toHaveAttribute(
      'href',
      'tel:+12155550142',
    );
  });

  test('a failed query is explained, not left blank', async ({ page }) => {
    await page.route(RPC, (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto('/places/');

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    // §0: never dead-end. Whatever the message says, there is a way out of it.
    await expect(alert.getByRole('link')).toHaveAttribute('href', /^tel:\+/);
  });

  test('an empty area says so instead of showing nothing', async ({ page }) => {
    await page.route(RPC, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.goto('/places/');

    await expect(page.getByRole('heading', { name: 'Places' })).toBeVisible();
    await expect(page.locator('.astryx-empty-state')).toBeVisible();
  });

  test('filters by category, and an empty category says so', async ({ page }) => {
    // The three categories are fixed, so all three are always offered. Workforce
    // has no places imported yet; a member who taps it must be told that, not
    // shown a blank screen (§0).
    await page.route(RPC, (route) => {
      const body = route.request().postData() ?? '';
      const empty = body.includes('workforce');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: empty ? '[]' : JSON.stringify(ROWS),
      });
    });
    await page.goto('/places/');
    await expect(page.getByRole('heading', { name: 'J J Peters' })).toBeVisible();

    await page.getByRole('button', { name: 'Work and money' }).click();
    await expect(page.locator('.astryx-empty-state')).toBeVisible();

    await page.getByRole('button', { name: 'All', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'J J Peters' })).toBeVisible();
  });

  test('walking directions go to the point, not the address', async ({ page }) => {
    await page.route(RPC, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROWS) }),
    );
    await page.goto('/places/');

    // First row carries coordinates; second has none and falls back.
    const links = page.getByRole('link', { name: 'Go' });
    await expect(links.first()).toHaveAttribute('href', /destination=39\.94738%2C-75\.175/);
    await expect(links.nth(1)).toHaveAttribute('href', /destination=112%20N%20Broad/);
  });

  test('has no WCAG A/AA violations with real rows on it', async ({ page }) => {
    await page.route(RPC, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROWS) }),
    );
    await page.goto('/places/');
    await expect(page.getByRole('heading', { name: 'J J Peters' })).toBeVisible();

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
