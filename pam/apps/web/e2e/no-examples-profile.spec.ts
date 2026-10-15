import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * A real account sees only its real things (Will, 11 October, a launch rule; D-518). On Profile, Points and Connections
 * that was the example member's Scholar badge and the example cast of two connections, shown to everybody. Now an
 * ordinary account has none, and a list that empties says so in a line. The gate is `lib/examples.ts` (D-511); this
 * spec holds Profile, Points and Connections to it: examples stay for a demo (an `is_demo` account, or a tab that asked
 * with `pam.examples`) and not for a super admin's preview. Supabase is stubbed at the network.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
// The Scholar tile in the badge grid: its name and, under it, earned, locked or soon.
const scholarTile = (page: Page) => page.getByText('Scholar', { exact: true }).last().locator('xpath=..');
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedIn(page: Page, profile: Record<string, unknown> = {}) {
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
  await page.route('**/rest/v1/rpc/member_points*', (route) => route.fulfill(json(400)));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
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
        ...profile,
      }),
    ),
  );
}

test.describe('a real account has no examples', () => {
  test('Points: no badge is earned, and the hero says nothing about earned ones', async ({ page }) => {
    await signedIn(page);
    await page.goto('/points/');
    await settled(page);
    await expect(page.getByText('You are here')).toBeVisible();
    // The ladder's own levels are real (400 points has earned two); the example Scholar is not.
    await expect(scholarTile(page)).not.toContainText('Earned');
    await expect(page.getByText(/Newest badge/)).toHaveCount(0);
  });

  test('Profile: the Connections count is 0, not the example cast', async ({ page }) => {
    await signedIn(page);
    await page.goto('/profile/');
    await settled(page);
    // The stat is its number and its word, one block: "0" over "Connections".
    await expect(page.getByText('0Connections', { exact: true })).toBeVisible();
    await expect(page.getByText('3Connections', { exact: true })).toHaveCount(0);
  });

  test('Connections: a short empty state, and nobody from the example cast', async ({ page }) => {
    await signedIn(page);
    await page.goto('/connections/');
    await settled(page);
    await expect(page.getByText('No connections yet')).toBeVisible();
    await expect(page.getByText(/When a case manager or a program takes you on/)).toBeVisible();
    await expect(page.getByText('Teresa')).toHaveCount(0);
    await expect(page.getByText('Sandra')).toHaveCount(0);
  });

  test('the empty Connections screen has no WCAG A/AA violations', async ({ page }) => {
    await signedIn(page);
    await page.goto('/connections/');
    await settled(page);
    await expect(page.getByText('No connections yet')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

test.describe('examples stay where they are asked for', () => {
  test('a demo (a tab that asked for examples) still sees the example badge and cast', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('pam.examples', '1'));
    await signedIn(page);
    await page.goto('/points/');
    await settled(page);
    await expect(scholarTile(page)).toContainText('Earned');
    await expect(page.getByText(/Newest badge/)).toBeVisible();

    await page.goto('/connections/');
    await settled(page);
    await expect(page.getByText('Teresa').first()).toBeVisible();
  });
});
