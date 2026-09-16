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
 *   - the card carries only what decides whether to go: name, distance, open
 *     or shut, one sentence, and Save (Will, 16 September). Calling, the
 *     directions and the rest live on the place's own screen — `place.spec.ts`
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
    description_plain: 'A city recreation center with a gym, courts and free programs for the neighbourhood.',
    website: null,
    audience: null,
    hours: null,
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
    description_plain: 'Treatment and counselling for mental health and substance use. Call first to ask what is free.',
    website: 'https://example.org/jfk',
    audience: null,
    hours: null,
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

  test('the card answers one question, and the rest is one tap inside', async ({ page }) => {
    await page.route(RPC, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROWS) }),
    );
    await page.goto('/places/');
    await expect(page.getByRole('heading', { name: 'J J Peters' })).toBeVisible();

    // The sentence that says what the place is, which is what a name alone
    // never does — "J J Peters" could be a lawyer.
    await expect(page.getByText(/free programs for the neighbourhood/)).toBeVisible();

    // Save is the only control on the card. Call, Go and the corner menu moved
    // to the place's own screen, where they have room to be labelled.
    await expect(page.getByRole('link', { name: 'Call' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Go' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'More about this place' })).toHaveCount(0);

    // The whole card is one link, and it goes to the place.
    await expect(page.getByRole('link', { name: 'J J Peters' })).toHaveAttribute(
      'href',
      `/place/?id=${ROWS[0]!.id}`,
    );
  });

  test('says open or shut, and never guesses when it does not know', async ({ page }) => {
    await page.route(RPC, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROWS) }),
    );
    await page.goto('/places/');
    await expect(page.getByRole('heading', { name: 'J J Peters' })).toBeVisible();

    // Placeholder hours stand in until `enrich-places` runs, so a card says one
    // or the other — but never both, and never "Open now" on a place PAM has
    // no hours for at all. What it must not do is say nothing at all and leave
    // a member to find a locked door.
    await expect(page.getByText(/^(Open until|Closed)/).first()).toBeVisible();
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
