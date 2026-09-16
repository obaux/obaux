import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * One place, on its own screen.
 *
 * The card in the list answers "is this worth my time" (see `places.spec.ts`).
 * This screen answers what follows — how do I get there, what do I ask, when
 * is it open — and it is where the three shrinking buttons and the corner menu
 * went (Will, 16 September).
 *
 * `service_detail` is stubbed with the shape the real RPC returns after 0051,
 * coordinates and all. What is tested is the screen's contract with it:
 *
 *   - the name is a heading once, not twice (the page title carries it)
 *   - getting there is the one primary action (§2.5), and routes to the point
 *     rather than the address when PAM has one (D-045)
 *   - sample hours say out loud that they are samples
 *   - a place PAM cannot find is a sentence and a way out, never a blank (§0)
 */

const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const DETAIL = '**/rest/v1/rpc/service_detail*';

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

const PLACE = {
  id: 'svc-1',
  name: 'Kirkbride Center',
  lookup_name: 'KIRKBRIDE CENTER',
  category: 'family_services',
  subcategory: null,
  address: '111 N 49th St, Philadelphia, PA 19139',
  phone: '+12155550100',
  place_id: null,
  lat: 39.9612,
  lon: -75.2172,
  description_plain:
    'Treatment and counselling for mental health and substance use. County funded, so it is free or low cost for most people.',
  website: 'https://example.org/kirkbride',
  audience: null,
  hours: null,
};

async function signedIn(page: import('@playwright/test').Page) {
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
      json({
        id: ME,
        role: 'member',
        first_name: 'Marcus',
        region_id: null,
        regions: null,
        access_status: 'active',
        onboarded_at: '2026-09-14T00:00:00Z',
      }),
    ),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
}

test.describe("a place's own screen", () => {
  test('says what it is, once, and offers the way there as the one big button', async ({ page }) => {
    await signedIn(page);
    await page.route(DETAIL, (route) => route.fulfill(json([PLACE])));
    await page.goto(`/place/?id=${PLACE.id}`);

    // The title carries the name. A second heading saying the same thing is a
    // second thing a screen reader reads out.
    await expect(page.getByRole('heading', { name: 'Kirkbride Center', level: 1 })).toHaveCount(1);
    await expect(page.getByText(/free or low cost for most people/)).toBeVisible();

    await expect(page.getByRole('link', { name: 'How to get there' })).toHaveAttribute(
      'href',
      /destination=39\.9612%2C-75\.2172/,
    );
    await expect(page.getByRole('link', { name: 'How to get there' })).toHaveAttribute(
      'href',
      /travelmode=walking/,
    );
  });

  test('routes to the address only when there is no point to route to', async ({ page }) => {
    // The city feeds keep geometry current and let address text rot, so the
    // point wins whenever PAM has one. This is the row that has none.
    await signedIn(page);
    await page.route(DETAIL, (route) =>
      route.fulfill(json([{ ...PLACE, lat: null, lon: null }])),
    );
    await page.goto(`/place/?id=${PLACE.id}`);

    await expect(page.getByRole('link', { name: 'How to get there' })).toHaveAttribute(
      'href',
      /destination=111%20N%2049th%20St/,
    );
  });

  test('the quieter actions are labelled rows, not icons behind a menu', async ({ page }) => {
    await signedIn(page);
    await page.route(DETAIL, (route) => route.fulfill(json([PLACE])));
    await page.goto(`/place/?id=${PLACE.id}`);

    await expect(page.getByRole('link', { name: 'Call this place' })).toHaveAttribute(
      'href',
      'tel:+12155550100',
    );
    await expect(page.getByRole('link', { name: 'Check hours on Google' })).toHaveAttribute(
      'href',
      /google\.com\/maps\/search/,
    );
    await expect(page.getByRole('link', { name: 'Their website' })).toHaveAttribute(
      'href',
      'https://example.org/kirkbride',
    );
    await expect(page.getByRole('button', { name: 'Save this place' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Something is wrong here' })).toBeVisible();
  });

  test('says out loud that the hours are samples', async ({ page }) => {
    // A demo that looks exactly like the real thing is how a partner ends up
    // reading their own opening times off a screen that made them up. Until
    // `enrich-places` runs, the screen admits it.
    await signedIn(page);
    await page.route(DETAIL, (route) => route.fulfill(json([PLACE])));
    await page.goto(`/place/?id=${PLACE.id}`);

    await expect(page.getByRole('heading', { name: 'Opening hours' })).toBeVisible();
    await expect(page.getByText(/sample hours while PAM checks the real ones/)).toBeVisible();
  });

  test('marks a place a member cannot walk into, above everything else', async ({ page }) => {
    // An adult who reads the phone number, works out the bus and then finds a
    // centre for 10 to 17 year olds has been failed by the screen, not by the
    // centre.
    await signedIn(page);
    await page.route(DETAIL, (route) => route.fulfill(json([{ ...PLACE, audience: 'youth' }])));
    await page.goto(`/place/?id=${PLACE.id}`);

    await expect(page.getByText('Ages 10 to 17')).toBeVisible();
  });

  test('a place PAM cannot find is a sentence and a way out, not a blank', async ({ page }) => {
    await signedIn(page);
    await page.route(DETAIL, (route) => route.fulfill(json([])));
    await page.goto('/place/?id=nope');

    await expect(page.getByRole('heading', { name: 'We could not find that place' })).toBeVisible();
    // §0: never dead-end. The list, and the number to call, both on the screen.
    // "Not on PAM right now" is an empty state rather than an alarm — nothing
    // went wrong, the place is simply not there — so the number is a link on
    // the card, not inside a banner.
    await expect(page.getByRole('link', { name: 'Places' }).first()).toBeVisible();
    await expect(page.locator('a[href^="tel:+"]').first()).toBeVisible();
  });

  test('arriving with no id at all lands in the same place', async ({ page }) => {
    await signedIn(page);
    await page.goto('/place/');

    await expect(page.getByRole('heading', { name: 'We could not find that place' })).toBeVisible();
  });

  test('has no WCAG A/AA violations', async ({ page }) => {
    await signedIn(page);
    await page.route(DETAIL, (route) => route.fulfill(json([PLACE])));
    await page.goto(`/place/?id=${PLACE.id}`);
    await expect(page.getByRole('heading', { name: 'Kirkbride Center' })).toBeVisible();

    await settled(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    if (results.violations.length > 0) {
      console.error(results.violations.map((v) => `${v.id}: ${v.help}`).join('\n'));
    }
    expect(results.violations).toEqual([]);
  });
});
