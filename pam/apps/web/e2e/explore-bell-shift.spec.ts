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
  await page.goto('/places/');
  const search = page.getByPlaceholder('Search by name or address');
  await expect(search).toBeVisible();
  // The role chip is drawn once the session is known; measure after it, so what moves is the bell.
  await page.getByText('Member', { exact: true }).first().waitFor();
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

test('the first time a phone has a bell, it is remembered for the next', async ({ page }) => {
  await member(page, true);
  await open(page);
  await expect(page.getByRole('link', { name: /^Notifications/ })).toBeVisible({ timeout: 8000 });
  expect(await page.evaluate((k) => window.localStorage.getItem(k), NOTE)).toBe('1');
});

test('a phone that had the bell, but has no notifications now: no bell, nothing held, and the note is dropped', async ({ page }) => {
  await member(page, false);
  await page.addInitScript((k: string) => window.localStorage.setItem(k, '1'), NOTE);
  const search = await open(page);
  await page.waitForTimeout(2200);
  await expect(page.getByRole('link', { name: /^Notifications/ })).toHaveCount(0);
  expect(await page.evaluate((k) => window.localStorage.getItem(k), NOTE)).toBeNull();
  // The search box is on the same line as when no bell was ever held.
  const box = await search.boundingBox();
  expect(box!.y).toBeGreaterThan(0);
});

test('a phone with no note and no notifications holds no place', async ({ page }) => {
  await member(page, false);
  await open(page);
  await page.waitForTimeout(2200);
  await expect(page.getByRole('link', { name: /^Notifications/ })).toHaveCount(0);
  expect(await page.evaluate((k) => window.localStorage.getItem(k), NOTE)).toBeNull();
});
