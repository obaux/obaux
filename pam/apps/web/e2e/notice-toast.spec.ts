import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * The way out, and the doors that used to lead back in.
 *
 * The audit of the way in (14 September) found four things a real person hit
 * on the first night the app was used on two phones:
 *
 *  - no sign-out anywhere a member could reach;
 *  - the sign-in screen asking a signed-in person for their phone again;
 *  - a verified phone with no account being offered "Sign in" by every screen;
 *  - a paused account meeting a wall of "something went wrong".
 *
 * Each has a test here, against a stubbed sign-in system.
 */

const USER = '**/auth/v1/user*';
const LOGOUT = '**/auth/v1/logout*';
const PROFILES = '**/rest/v1/profiles*';
const NOTIFICATIONS = '**/rest/v1/notifications*';

const WILL = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

type Profile = {
  role: 'member' | 'admin' | 'super_admin' | 'provider';
  profile_roles?: { role: string }[];
  access_status?: 'active' | 'suspended';
  onboarded_at?: string | null;
} | null;

async function signedIn(page: import('@playwright/test').Page, profile: Profile) {
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) {
      window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
    }
  }, WILL);

  await page.route(USER, (route) => route.fulfill(json({ id: WILL })));
  await page.route(NOTIFICATIONS, (route) => route.fulfill(json([])));
  await page.route(LOGOUT, (route) => route.fulfill({ status: 204, body: '' }));
  await page.route('**/rest/v1/rpc/member_points*', (route) => route.fulfill(json(25)));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route(PROFILES, (route) =>
    route.fulfill(
      json(
        profile
          ? {
              id: WILL,
              first_name: 'Will',
              region_id: null,
              regions: null,
              access_status: 'active',
              onboarded_at: '2026-09-12T00:00:00Z',
              ...profile,
            }
          : null,
      ),
    ),
  );
}


/**
 * A status Notice is a toast (D-619; Will, 19 October: "I want to stop using this style. Please use the toast banner instead."). Driven
 * from a paused account, the plainest lasting state: the card that used to sit in the page is Astryx's toast at the bottom of the screen,
 * with no close and no swipe, and the page behind it is not blank.
 */
test.describe('A status notice is a toast (D-619)', () => {
  test('a paused account: a toast fixed at the bottom with Contact Pam, no close, not part of the page', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await signedIn(page, { role: 'member', access_status: 'suspended' });
    await page.goto('/');
    const toast = page.getByRole('alert').filter({ has: page.getByRole('heading', { name: 'Your account is paused' }) });
    await expect(toast).toBeVisible();
    // Fixed over the page, at the bottom, inside the screen: not a card among the page's own content.
    const fixed = await toast.evaluate((el) => {
      for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
        if (getComputedStyle(node).position === 'fixed') return true;
      }
      return false;
    });
    expect(fixed).toBe(true);
    const box = (await toast.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(568);
    expect(box.y).toBeGreaterThan(568 / 4);
    // The way out is a 48px link, and a state that lasts has no close.
    const contact = toast.getByRole('link', { name: /Contact Pam/ });
    await expect(contact).toBeVisible();
    expect(((await contact.boundingBox())!).height).toBeGreaterThanOrEqual(47);
    await expect(toast.getByRole('button', { name: 'Dismiss' })).toHaveCount(0);
    // Nothing the person can do takes it away: a tap elsewhere, a key, a swipe on it.
    await page.mouse.click(10, 10);
    await page.keyboard.press('Escape');
    await toast.dispatchEvent('touchstart', { touches: [{ identifier: 1, clientX: 100, clientY: box.y + 20 }] }).catch(() => undefined);
    await expect(toast).toBeVisible();
    // The page behind it is not blank: it still has its header.
    await expect(page.getByRole('link', { name: 'Sign out' })).toBeVisible();
  });

  test('it is announced once, as an alert', async ({ page }) => {
    await signedIn(page, { role: 'member', access_status: 'suspended' });
    await page.goto('/');
    await expect(page.getByRole('alert').filter({ hasText: 'Your account is paused' })).toHaveCount(1);
  });

  test('it passes axe', async ({ page }) => {
    await signedIn(page, { role: 'member', access_status: 'suspended' });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Your account is paused' })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});
