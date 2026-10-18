import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';
import { launcherOf, openSearch } from './searchBar';

/**
 * A member's Explore shows the Notifications bell only while something is unread
 * (Will, 12 October 2026: "Only show Notifications bell for members Explore page, when notifications
 * exist, if no notification, please hide it"; 18 October: "I still see the notification bell even though
 * there are no active notifications ... hidden so the search for programs bar takes up full width unless
 * there's a notification"). A list of only read ones counts as none: Profile and Messages keep the bell,
 * so read notifications stay one tap away. Other screens and other roles keep the bell as it was.
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

async function signedIn(page: Page, role: 'member' | 'admin', notifications: unknown[], hasPeople = false) {
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
      json({ id: ME, role, first_name: 'Pia', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', org_id: null }),
    ),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json(notifications)));
  // Somebody to message means the Messages tab, and a member's Explore then carries no bell; nobody means the bell moves up here.
  await page.route('**/rest/v1/rpc/messageable_people*', (route) => route.fulfill(json(hasPeople ? [{ id: 'p-1' }] : [])));
}

const bell = (page: Page) => page.getByRole('link', { name: /^Notifications/ });

test.describe("a member's Explore and the bell", () => {
  test('with the Messages tab: no bell, and no room held for one: the search launcher stays centred', async ({ page }) => {
    await signedIn(page, 'member', [], true);
    await page.goto('/');
    await settled(page);
    const field = launcherOf(page);
    await expect(field).toBeVisible();
    await expect(bell(page)).toHaveCount(0);
    // The search field takes the whole line, so room held for a bell would show as a narrower field.
    const box = await field.boundingBox();
    const vw = page.viewportSize()!.width;
    expect(Math.abs(box!.x - 16)).toBeLessThan(3);
    expect(Math.abs(box!.width - (vw - 32))).toBeLessThan(3);
  });

  test('nobody to message, no notifications: no bell, and the search launcher spans the row', async ({ page }) => {
    await signedIn(page, 'member', []);
    await page.goto('/');
    await settled(page);
    const launcher = page.getByRole('button', { name: 'Search programs' });
    await expect(launcher).toBeVisible();
    await expect(bell(page)).toHaveCount(0);
    const box = await launcher.boundingBox();
    const vw = page.viewportSize()!.width;
    // The page's own side margins and nothing held back for a bell: the launcher fills the row.
    expect(box!.width).toBeGreaterThan(vw - 2 * 24 - 2);
    expect(Math.abs(box!.x + box!.width / 2 - vw / 2)).toBeLessThan(2);
  });

  test('nobody to message, only read notifications: no bell', async ({ page }) => {
    await signedIn(page, 'member', [{ ...ROW, read_at: '2026-10-12T11:00:00Z' }]);
    await page.goto('/');
    await settled(page);
    await expect(page.getByRole('button', { name: 'Search programs' })).toBeVisible();
    await expect(bell(page)).toHaveCount(0);
    const box = await page.getByRole('button', { name: 'Search programs' }).boundingBox();
    expect(box!.width).toBeGreaterThan(page.viewportSize()!.width - 2 * 24 - 2);
  });

  test('nobody to message, one unread: the bell moves up to Explore, with its link', async ({ page }) => {
    await signedIn(page, 'member', [ROW]);
    await page.goto('/');
    await settled(page);
    await expect(bell(page)).toBeVisible();
    await expect(bell(page)).toHaveAttribute('href', '/notifications/');
  });

  test('a case manager keeps the bell on Explore even with nothing in the list', async ({ page }) => {
    await signedIn(page, 'admin', []);
    await page.goto('/');
    await settled(page);
    await expect(bell(page)).toBeVisible();
  });
});

test.describe('while the search bar is open the bell gives it the room (Will, 17 October, a86)', () => {
  test('open: no bell, not in the tree, and the bar is wider; Cancel: the bell is back with its dot', async ({ page }) => {
    await signedIn(page, 'member', [ROW]);
    await page.goto('/');
    await settled(page);
    await expect(bell(page)).toBeVisible();
    await expect(bell(page)).toHaveAccessibleName(/1 new/);
    const rest = await launcherOf(page).boundingBox();

    await openSearch(page);
    // Not drawn and not in the accessibility tree (not just invisible).
    await expect(bell(page)).toHaveCount(0);
    await expect(page.locator('a[href="/notifications/"]')).toHaveCount(0);
    const field = await page.locator('.astryx-input-group[data-size="lg"]').first().boundingBox();
    expect(field!.width).toBeGreaterThan(rest!.width - 60);

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(bell(page)).toBeVisible();
    await expect(bell(page)).toHaveAccessibleName(/1 new/);
    // The launcher is back where it was: the header did not shift.
    const back = await launcherOf(page).boundingBox();
    expect(Math.abs(back!.x - rest!.x)).toBeLessThan(2);
    expect(Math.abs(back!.width - rest!.width)).toBeLessThan(2);
    await expect(launcherOf(page)).toBeFocused();
  });

  test('Escape brings the bell back too', async ({ page }) => {
    await signedIn(page, 'member', [ROW]);
    await page.goto('/');
    await settled(page);
    const box = await openSearch(page);
    await expect(bell(page)).toHaveCount(0);
    await box.press('Escape');
    await expect(bell(page)).toBeVisible();
  });
});
