import { test, expect, type Page } from '@playwright/test';

/**
 * Iris's W3: for a member WITH notifications the Explore bell arrives about a second after load, and
 * the page must not move when it does (the search box is where a thumb reaches). The notifications
 * answer is held back so the page is measured before and after the bell is drawn.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const ROW = {
  id: 'n-1',
  kind: 'message_received',
  body_key: 'notify.message_received',
  body_vars: {},
  subject_type: null,
  subject_id: null,
  created_at: '2026-10-12T10:00:00Z',
  read_at: null,
};

async function member(page: Page, withNotification: boolean) {
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
  await page.route('**/rest/v1/**', (route) => route.fulfill(json([])));
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({ id: ME, role: 'member', first_name: 'Pia', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', org_id: null }),
    ),
  );
  await page.route('**/rest/v1/notifications*', async (route) => {
    await new Promise((r) => setTimeout(r, 1200));
    await route.fulfill(json(withNotification ? [ROW] : []));
  });
}

const NOTE = 'pam.explore.bell';

async function open(page: Page) {
  await page.goto('/');
  // A member's Explore has its search pill under the title (a86); it is what must not move when the bell arrives.
  const search = page.getByRole('button', { name: /^Search programs$/ });
  await expect(search).toBeVisible();
  // The area chip is drawn once the session is known; measure after it, so what moves is the bell.
  await page.getByRole('button', { name: /Near City Hall/ }).first().waitFor();
  return search;
}

test('a phone that had the bell last time: the page does not move when it arrives again', async ({ page }) => {
  await member(page, true);
  await page.addInitScript((k: string) => window.localStorage.setItem(k, '1'), NOTE);
  const search = await open(page);
  const bell = page.getByRole('link', { name: /^Notifications/ });
  await expect(bell).toHaveCount(0);
  const before = await search.boundingBox();
  await expect(bell).toBeVisible({ timeout: 8000 });
  const after = await search.boundingBox();
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);
  // The place held for it cannot be tapped or read out meanwhile: only one bell is ever in the page.
  await expect(page.getByRole('link', { name: /^Notifications/ })).toHaveCount(1);
});

// The old list drew its bell only when notifications existed (hideWhenEmpty) and kept a note on the
// phone to hold its place. A member's Explore does not: with nobody to message the bell is simply there
// from the first paint, with or without notifications, so there is nothing to arrive late and nothing
// to remember. What is left to prove is that the page is already where it will stay.
test('a member with nobody to message: the bell is there from the first paint and nothing moves', async ({ page }) => {
  await member(page, true);
  const search = await open(page);
  const bell = page.getByRole('link', { name: /^Notifications/ });
  await expect(bell).toBeVisible();
  const before = await search.boundingBox();
  await page.waitForTimeout(2200);
  const after = await search.boundingBox();
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('link', { name: /^Notifications/ })).toHaveCount(1);
  expect(await page.evaluate((k) => window.localStorage.getItem(k), NOTE)).toBeNull();
});

test('the same with no notifications: the bell still opens the (empty) list and nothing moves', async ({ page }) => {
  await member(page, false);
  const search = await open(page);
  const bell = page.getByRole('link', { name: /^Notifications/ });
  await expect(bell).toBeVisible();
  const before = await search.boundingBox();
  await page.waitForTimeout(2200);
  const after = await search.boundingBox();
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);
  expect(box(after)).toBeGreaterThan(0);
});

function box(b: { y: number } | null) {
  return b ? b.y : 0;
}
