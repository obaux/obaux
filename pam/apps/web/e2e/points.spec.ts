import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * The points screen, and what the badges are for.
 *
 * The names are the product decision here — Returned, Rooted, Elder, Sankofa —
 * so the tests are about the things that would quietly undo them: a ladder that
 * does not say where the member is standing, a badge nobody can earn appearing
 * as if they could, and the one rule §8 states outright: no comparison to
 * another member, anywhere.
 */

const USER = '**/auth/v1/user*';
const PROFILES = '**/rest/v1/profiles*';
const POINTS = '**/rest/v1/rpc/member_points*';
const NOTIFICATIONS = '**/rest/v1/notifications*';

const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function signedIn(page: import('@playwright/test').Page, points: number) {
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
  await page.route(POINTS, (route) => route.fulfill(json(points)));
  await page.route(PROFILES, (route) =>
    route.fulfill(json({ id: ME, role: 'member', first_name: 'Marcus', region_id: null, regions: null })),
  );
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
}

test.describe('points and badges', () => {
  test('the points chip on home opens this screen, not the saved list', async ({ page }) => {
    await signedIn(page, 400);
    await page.goto('/');

    await page.getByRole('link', { name: '400 points' }).click();
    await expect(page).toHaveURL(/\/points\//);
  });

  test('shows the ladder, and where the member is standing on it', async ({ page }) => {
    await signedIn(page, 400);
    await page.goto('/points/');

    // 400 points is past Rooted (250) and short of Builder (750).
    await expect(page.getByText('Rooted')).toBeVisible();
    await expect(page.getByText('You are here')).toBeVisible();
    // Twice on the screen: once in the subtitle, once on the rung it belongs
    // to. Both are the same fact, so the first is enough to prove it is there.
    await expect(page.getByText('350 more to go').first()).toBeVisible();
  });

  test('a badge nobody can earn yet says so rather than hiding', async ({ page }) => {
    // Elder and Chief need a buddy system PAM does not have. Hiding them would
    // mean they appear from nowhere the day it ships.
    await signedIn(page, 400);
    await page.goto('/points/');

    await expect(page.getByText('Elder')).toBeVisible();
    await expect(page.getByText('Coming later').first()).toBeVisible();
  });

  test('carries the names for all three groups', async ({ page }) => {
    await signedIn(page, 400);
    await page.goto('/points/');

    for (const name of ['Returned', 'Griot', 'Cornerstone', 'Steward', 'Sankofa', 'Kinkeeper']) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
  });

  test('compares the member to nobody (§8)', async ({ page }) => {
    // No rank, no position, no other member's name or number. The rule is in
    // the config as LEADERBOARDS_ENABLED = false; this is the screen honouring it.
    await signedIn(page, 400);
    await page.goto('/points/');

    const text = (await page.locator('main').innerText()).toLowerCase();
    for (const word of ['rank', 'leaderboard', 'top 10', 'of 10', 'place ', 'compared']) {
      expect(text, `the points screen says "${word}"`).not.toContain(word);
    }
  });

  test('has no WCAG A/AA violations', async ({ page }) => {
    await signedIn(page, 400);
    await page.goto('/points/');
    await expect(page.getByText('Rooted')).toBeVisible();

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
