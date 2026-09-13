import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * Keeping a place, and letting one go.
 *
 * Save used to be a button that changed its own label and forgot by the next
 * screen — the kind of thing that is fine in a demo and a betrayal in the
 * product, because the member who taps it is standing somewhere trying to
 * remember an address. These tests are about the memory: that it reaches the
 * database, that it survives a reload, and that removing one takes it out of
 * both places it appears.
 *
 * Supabase is stubbed at the network. The refusals — one member cannot read
 * another's saved list — are proved in `packages/db`, where they are enforced.
 */

const USER = '**/auth/v1/user*';
const PROFILES = '**/rest/v1/profiles*';
const NOTIFICATIONS = '**/rest/v1/notifications*';
const SAVED = '**/rest/v1/rpc/saved_places_mine*';
const SAVED_ROWS = '**/rest/v1/saved_places*';
const NEAR = '**/rest/v1/rpc/services_near*';

const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

const PLACE = {
  id: 'svc-1',
  name: 'Example Learning Center',
  lookup_name: 'Example Learning Center',
  category: 'education',
  subcategory: null,
  address: '123 Main St',
  phone: '+12155550100',
  place_id: null,
  lat: 39.95,
  lon: -75.16,
  meters: 900,
  has_hours: false,
};

async function signedIn(page: import('@playwright/test').Page, saved: unknown[]) {
  const writes: { method: string; url: string }[] = [];

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

  await page.route(USER, (route) => route.fulfill(json({ id: ME })));
  await page.route(NOTIFICATIONS, (route) => route.fulfill(json([])));
  await page.route(PROFILES, (route) =>
    route.fulfill(json({ id: ME, role: 'member', first_name: 'Marcus', region_id: null, regions: null })),
  );
  await page.route(NEAR, (route) => route.fulfill(json([PLACE])));
  await page.route(SAVED, (route) => route.fulfill(json(saved)));
  await page.route(SAVED_ROWS, (route) => {
    writes.push({ method: route.request().method(), url: route.request().url() });
    return route.fulfill(json([]));
  });

  return writes;
}

test.describe('keeping a place', () => {
  test('saving writes it down, and the card says so without saying it', async ({ page }) => {
    const writes = await signedIn(page, []);
    await page.goto('/places/');

    const save = page.getByRole('button', { name: 'Save' });
    await expect(save).toBeVisible();
    await save.click();

    // The word goes, the mark stays: an icon-only control whose accessible name
    // is still "Saved", and aria-pressed saying which way it is (Will, 13 Sept).
    const saved = page.getByRole('button', { name: 'Saved' });
    await expect(saved).toBeVisible();
    await expect(saved).toHaveAttribute('aria-pressed', 'true');
    await expect(saved).not.toContainText('Saved');

    await expect
      .poll(() => writes.some((w) => w.method === 'POST'), {
        message: 'the save never reached the database',
      })
      .toBe(true);
  });

  test('the home screen shows what was kept, and the full list is one tap away', async ({ page }) => {
    await signedIn(page, [PLACE]);
    await page.goto('/');

    const strip = page.getByRole('region', { name: 'Places you saved' });
    await expect(strip).toBeVisible();
    await expect(strip.getByText('Example Learning Center')).toBeVisible();
    await expect(page.getByRole('link', { name: 'See all' })).toHaveAttribute('href', '/saved/');
  });

  test('the bookmark takes it out, and says whose place it is taking out', async ({ page }) => {
    const writes = await signedIn(page, [PLACE]);
    await page.goto('/');

    // Named per card, because "Remove" three times in a row tells a screen
    // reader user nothing about which one they are on.
    const remove = page.getByRole('button', {
      name: 'Remove Example Learning Center from your saved places',
    });
    await expect(remove).toBeVisible();
    await remove.click();

    await expect(page.getByRole('region', { name: 'Places you saved' })).toHaveCount(0);
    // Polled, not read once: the list updates before the network does — on
    // purpose, so a tap on a bad connection is acknowledged immediately — so
    // the write lands a moment after the square has gone.
    await expect
      .poll(() => writes.some((w) => w.method === 'DELETE'), {
        message: 'the removal never reached the database',
      })
      .toBe(true);
  });

  test('the full list is the same card as the search, not a lesser one', async ({ page }) => {
    await signedIn(page, [PLACE]);
    await page.goto('/saved/');

    // §5.1: the same three actions, in the same order, wherever a place appears.
    await expect(page.getByRole('link', { name: 'Call' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();
  });

  test('an empty list teaches the button rather than apologising', async ({ page }) => {
    await signedIn(page, []);
    await page.goto('/saved/');

    await expect(page.getByRole('heading', { name: 'Nothing saved yet' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Places' })).toBeVisible();
  });

  test('has no WCAG A/AA violations', async ({ page }) => {
    await signedIn(page, [PLACE]);
    await page.goto('/saved/');
    await expect(page.getByRole('heading', { name: 'Example Learning Center' })).toBeVisible();

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
