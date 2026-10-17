import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';
import { launcherOf } from './searchBar';

/**
 * A member's Explore shows the Notifications bell only once there is something in the list it opens
 * (Will, 12 October 2026: "Only show Notifications bell for members Explore page, when notifications
 * exist, if no notification, please hide it"). Other screens and other roles keep the bell as it was.
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

  test('nobody to message: the bell moves up to Explore, with its link', async ({ page }) => {
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
