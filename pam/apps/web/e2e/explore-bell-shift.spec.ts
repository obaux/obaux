import { test, expect, type Page } from '@playwright/test';
import { launcherOf } from './searchBar';

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
  // A member's Explore has its search field under the title (inline, D-573); it is what must not move when the bell arrives.
  const search = launcherOf(page);
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

// A member's Explore draws the bell only while something is unread (Will, 18 October). A phone that has
// never had a bell holds no room for one, so the answer arriving moves the launcher's width once and
// never its place down the page; and it writes the note, so the next visit holds the room.
test('a first bell: the launcher keeps its place down the page, and the phone makes its note', async ({ page }) => {
  await member(page, true);
  const search = await open(page);
  const bell = page.getByRole('link', { name: /^Notifications/ });
  const before = await search.boundingBox();
  await expect(bell).toBeVisible({ timeout: 8000 });
  const after = await search.boundingBox();
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('link', { name: /^Notifications/ })).toHaveCount(1);
  expect(await page.evaluate((k) => window.localStorage.getItem(k), NOTE)).toBe('1');
});

test('nothing new: no bell, and the note is cleared so no room is held next time', async ({ page }) => {
  await member(page, false);
  await page.addInitScript((k: string) => window.localStorage.setItem(k, '1'), NOTE);
  const search = await open(page);
  // The room is held until the answer comes, then given back to the search bar.
  const held = await search.boundingBox();
  await expect.poll(async () => (await search.boundingBox())!.width, { timeout: 8000 }).toBeGreaterThan(held!.width);
  await expect(page.getByRole('link', { name: /^Notifications/ })).toHaveCount(0);
  expect(await page.evaluate((k) => window.localStorage.getItem(k), NOTE)).toBeNull();
});

