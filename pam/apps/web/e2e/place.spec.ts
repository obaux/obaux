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
 *     rather than the address when Pam has one (D-045)
 *   - sample hours say out loud that they are samples
 *   - a place Pam cannot find is a sentence and a way out, never a blank (§0)
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
  test('says what it is, once; booking a visit is the one big button, the way there a circle', async ({ page }) => {
    await signedIn(page);
    await page.route(DETAIL, (route) => route.fulfill(json([PLACE])));
    await page.goto(`/place/?id=${PLACE.id}`);

    // The title carries the name. A second heading saying the same thing is a
    // second thing a screen reader reads out.
    await expect(page.getByRole('heading', { name: 'Kirkbride Center', level: 1 })).toHaveCount(1);
    await expect(page.getByText(/free or low cost for most people/)).toBeVisible();

    // D-235, D-247: a member's one primary action is Plan a trip, straight into
    // the New trip steps with this place chosen; Get directions is the first row (D-291).
    await expect(page.getByRole('link', { name: 'Plan a trip' })).toHaveAttribute(
      'href',
      new RegExp(`/trips/new/\\?place=${PLACE.id}`),
    );
    await expect(page.getByRole('link', { name: /^Get directions/ })).toHaveAttribute(
      'href',
      /destination=39\.9612%2C-75\.2172/,
    );
    // D-294: no travel mode — Maps chooses, not Pam.
    await expect(page.getByRole('link', { name: /^Get directions/ })).not.toHaveAttribute(
      'href',
      /travelmode/,
    );
  });

  test('routes to the address only when there is no point to route to', async ({ page }) => {
    // The city feeds keep geometry current and let address text rot, so the
    // point wins whenever Pam has one. This is the row that has none.
    await signedIn(page);
    await page.route(DETAIL, (route) =>
      route.fulfill(json([{ ...PLACE, lat: null, lon: null }])),
    );
    await page.goto(`/place/?id=${PLACE.id}`);

    await expect(page.getByRole('link', { name: /^Get directions/ })).toHaveAttribute(
      'href',
      /destination=111%20N%2049th%20St/,
    );
  });

  test('directions open on the place itself when Pam has its Google ID', async ({ page }) => {
    // D-291: the place ID rides along, so Maps opens on the place, not a pin.
    await signedIn(page);
    await page.route(DETAIL, (route) => route.fulfill(json([{ ...PLACE, place_id: 'ChIJexample123' }])));
    await page.goto(`/place/?id=${PLACE.id}`);

    const directions = page.getByRole('link', { name: /^Get directions/ });
    await expect(directions).toHaveAttribute('href', /destination_place_id=ChIJexample123/);
    await expect(directions).toHaveAttribute('target', '_blank');
    // Directions, then message, then call, then the website. Bring a friend
    // is not here: it waits for the booked screen (D-333).
    const rows = page.getByRole('list', { name: 'Ways to reach this place' }).getByRole('link');
    await expect(rows.nth(0)).toHaveAccessibleName(/^Get directions/);
    await expect(rows.nth(1)).toHaveAccessibleName(/^Send a message/);
    await expect(page.getByText('Bring a friend')).toHaveCount(0);
  });

  test('the actions are rows, directions first, and the rest is in the bar', async ({ page }) => {
    // D-291: Get directions, Send a message, Call and Website under the name,
    // as rows with a line each (they were labelled circles, D-224); the hours a row too, the week in a drawer (D-309);
    // Save and the ⋯ menu (Flag something, Share, Message) in the bar.
    await signedIn(page);
    await page.route(DETAIL, (route) => route.fulfill(json([PLACE])));
    await page.goto(`/place/?id=${PLACE.id}`);

    await expect(page.getByRole('link', { name: /^Call/ })).toHaveAttribute('href', 'tel:+12155550100');
    await expect(page.getByRole('link', { name: /^Website/ })).toHaveAttribute(
      'href',
      'https://example.org/kirkbride',
    );
    // D-235, D-291: Get directions comes first, and routes there.
    await expect(page.getByRole('link', { name: /^Get directions/ })).toHaveAttribute(
      'href',
      /google\.com\/maps\/dir/,
    );
    // D-309: the hours are a row too, today's on it; the week and Check
    // hours on Google open in a drawer.
    await page.getByRole('button', { name: /^Hours: / }).click();
    await expect(page.getByRole('link', { name: 'Check hours on Google' })).toHaveAttribute(
      'href',
      /google\.com\/maps\/search/,
    );
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Save this place' })).toBeVisible();
    await page.getByRole('button', { name: 'More options' }).click();
    await expect(page.getByRole('menuitem', { name: 'Flag something' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Share this place' })).toBeVisible();
  });

  test('says out loud that the hours are samples', async ({ page }) => {
    // A demo that looks exactly like the real thing is how a partner ends up
    // reading their own opening times off a screen that made them up. Until
    // `enrich-places` runs, the screen admits it.
    await signedIn(page);
    await page.route(DETAIL, (route) => route.fulfill(json([PLACE])));
    await page.goto(`/place/?id=${PLACE.id}`);

    // In the week drawer (D-309), with today marked.
    await page.getByRole('button', { name: /^Hours: / }).click();
    await expect(page.getByRole('heading', { name: 'Opening hours' })).toBeVisible();
    await expect(page.getByText('Today', { exact: true })).toBeVisible();
    await expect(page.getByText(/sample hours while Pam checks the real ones/)).toBeVisible();
  });

  test('the week drawer opens with nothing chosen, and the bar\'s ⋯ is outlined and lifted (D-411)', async ({ page }) => {
    await signedIn(page);
    await page.route(DETAIL, (route) => route.fulfill(json([PLACE])));
    await page.goto(`/place/?id=${PLACE.id}`);

    // ⋯ reads as a button on a plain page: a grey outline you can see, and a shadow.
    const more = page.getByRole('button', { name: 'More' });
    const look = await more.evaluate((el) => {
      const s = getComputedStyle(el);
      return { border: s.borderTopWidth, colour: s.borderTopColor, shadow: s.boxShadow };
    });
    expect(look.border).toBe('1px');
    expect(look.colour).not.toMatch(/rgba\(0, 0, 0, 0\.0\d+\)/);
    expect(look.shadow).not.toBe('none');

    await page.getByRole('button', { name: /^Hours: / }).click();
    await expect(page.getByRole('heading', { name: 'Opening hours' })).toBeVisible();
    // Focus is in the drawer, on its content — not on Close or any button.
    const focused = await page.evaluate(() => {
      const a = document.activeElement!;
      return { tag: a.tagName, inDialog: a.closest('dialog') !== null, isControl: a.matches('button, a, input, [role=button]') };
    });
    expect(focused.inDialog).toBe(true);
    expect(focused.isControl).toBe(false);
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

  test('a place Pam cannot find is a sentence and a way out, not a blank', async ({ page }) => {
    await signedIn(page);
    await page.route(DETAIL, (route) => route.fulfill(json([])));
    await page.goto('/place/?id=nope');

    await expect(page.getByRole('heading', { name: 'We could not find that place' })).toBeVisible();
    // §0: never dead-end. The list, and the number to call, both on the screen.
    // "Not on Pam right now" is an empty state rather than an alarm — nothing
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
    // "Plan a trip" rides the bottom edge while the page scrolls under it
    // (D-326); on a short phone the last row is half under it until you
    // scroll, which axe reads as an obscured target. Read the page at its
    // end, where everything is in the open and the footer is just the end.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
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
