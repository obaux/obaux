import { expect, test, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * Saving a place says "Saved" by the button (Will, 11 October: "when I save a place it should show a tooltip saying
 * saved"). It appears when a tap saves, stays about two seconds and goes; taking the place off says nothing. It is also
 * said to a screen reader through a polite live region, and the only movement is a fade (none with reduce-motion).
 * Supabase is stubbed at the network.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

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
  description_plain: 'Free classes and a computer room. Walk in and ask at the desk.',
  website: null,
  audience: null,
  hours: null,
};

async function signedIn(page: Page) {
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
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({ id: ME, role: 'member', first_name: 'Marcus', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' }),
    ),
  );
  await page.route('**/rest/v1/rpc/services_near*', (route) => route.fulfill(json([PLACE])));
  await page.route('**/rest/v1/rpc/service_detail*', (route) => route.fulfill(json([PLACE])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/saved_places*', (route) => route.fulfill(json([])));
}

const tip = (page: Page) => page.locator('[data-confirm-tip]');
const announced = (page: Page) => page.getByRole('status').filter({ hasText: 'Saved' });

test.describe('the Saved tooltip', () => {
  test('on a place card: appears when saved, is announced, and is gone after about two seconds', async ({ page }) => {
    await signedIn(page);
    await page.goto('/');
    await settled(page);
    await expect(tip(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(tip(page)).toBeVisible();
    await expect(tip(page)).toHaveText('Saved');
    await expect(announced(page)).toHaveCount(1);
    // It is drawn, not read twice: the bubble is hidden from assistive technology.
    await expect(tip(page)).toHaveAttribute('aria-hidden', 'true');
    // And it never stands in the way of a tap.
    await expect(tip(page)).toHaveCSS('pointer-events', 'none');

    await expect(tip(page)).toHaveCount(0, { timeout: 4000 });
    await expect(announced(page)).toHaveCount(0);
  });

  test('taking it off says nothing', async ({ page }) => {
    await signedIn(page);
    await page.goto('/');
    await settled(page);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(tip(page)).toBeVisible();
    await expect(tip(page)).toHaveCount(0, { timeout: 4000 });

    await page.getByRole('button', { name: 'Saved' }).click();
    await page.waitForTimeout(400);
    await expect(tip(page)).toHaveCount(0);
  });

  test('in the place bar too', async ({ page }) => {
    await signedIn(page);
    await page.goto(`/place/?id=${PLACE.id}`);
    await settled(page);

    await page.getByRole('button', { name: 'Save this place' }).click();
    await expect(tip(page)).toBeVisible();
    await expect(tip(page)).toHaveText('Saved');
    await expect(tip(page)).toHaveCount(0, { timeout: 4000 });
  });

  test("a save that did not go through says no \"Saved\": only the alert, and the bookmark stays as it was (Iris L4)", async ({ page }) => {
    await signedIn(page);
    await page.route('**/rest/v1/saved_places*', (route) =>
      route.request().method() === 'GET' ? route.fulfill(json([])) : route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    );
    await page.goto(`/place/?id=${PLACE.id}`);
    await settled(page);
    await page.getByRole('button', { name: 'Save this place' }).click();
    await expect(page.getByRole('alert').filter({ hasText: /Something's wrong on our side|That took too long|Still not working/ })).toBeVisible();
    // At the moment the alert is up, not later: the old tip rose at the tap and was gone by the time anyone looked again.
    expect(await tip(page).count()).toBe(0);
    await page.waitForTimeout(500);
    await expect(tip(page)).toHaveCount(0);
    await expect(announced(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Save this place' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('a save the database says is already there is no alert, and the saved list is read again (D-618 done)', async ({ page }) => {
    await signedIn(page);
    let reads = 0;
    await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => {
      reads += 1;
      return route.fulfill(json([]));
    });
    await page.route('**/rest/v1/saved_places*', (route) =>
      route.request().method() === 'GET' ? route.fulfill(json([])) : route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ code: '23505', message: 'duplicate' }) }),
    );
    await page.goto(`/place/?id=${PLACE.id}`);
    await settled(page);
    const before = reads;
    await page.getByRole('button', { name: 'Save this place' }).click();
    await expect.poll(() => reads).toBeGreaterThan(before);
    await expect(page.locator('[data-pam-malfunction]')).toHaveCount(0);
  });

  test('with reduce-motion there is no fade at all', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await signedIn(page);
    await page.goto('/');
    await settled(page);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(tip(page)).toBeVisible();
    // None (the app's reduce-motion rule makes any transition effectively instant).
    const seconds = await tip(page).evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));
    expect(seconds).toBeLessThanOrEqual(0.001);
  });

  test('without reduce-motion the only movement is the opacity fade', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await signedIn(page);
    await page.goto('/');
    await settled(page);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(tip(page)).toHaveCSS('transition-property', 'opacity');
  });
});
