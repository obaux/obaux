import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * A case manager's and a program lead's Home is the redesigned one (D-486, Will,
 * 10 October: "rebuild into the new home for staff"), with the row of people
 * rings, and — for an account with nobody yet — an empty row: faint circles and
 * a (+) first that starts an invite. The rings' own rule is `people-strip.spec`.
 * Supabase is stubbed at the network.
 */

const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedInAs(page: Page, role: 'admin' | 'provider', options: { fresh?: boolean } = {}) {
  await page.addInitScript(
    ([userId, fresh]: [string, boolean]) => {
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
      // An account that has just signed up has no example data (D-361).
      if (fresh) window.sessionStorage.setItem('pam.setup.fresh', '1');
    },
    [ME, options.fresh ?? false] as [string, boolean],
  );
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME, phone: '12673095265' })));
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/access_controls*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/member_points*', (route) => route.fulfill(json(250)));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/messageable_people*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/people_activity*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/conversation_members*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/conversation_partners*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.request().url().includes('role=eq.member')
      ? route.fulfill(json([]))
      : route.fulfill(
          json({
            id: ME,
            role,
            first_name: 'Dana',
            region_id: '0195b1c0-0000-4000-8000-000000000001',
            regions: { name: 'Philadelphia' },
          }),
        ),
  );
}

const row = (page: Page, name: string) => page.getByRole('region', { name });

test.describe('the staff Home', () => {
  test('a case manager lands on the redesigned Home, with the tab bar', async ({ page }) => {
    await signedInAs(page, 'admin');
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Your members', level: 1 })).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Main' });
    for (const tab of ['Home', 'Saved', 'Messages']) await expect(nav.getByRole('link', { name: new RegExp(tab) })).toBeVisible();
    // The old Home's tiles are gone: the list is the screen.
    await expect(page.getByRole('link', { name: /Your people/ })).toHaveCount(0);
  });

  test('a program lead lands on the redesigned Home, with the tab bar', async ({ page }) => {
    await signedInAs(page, 'provider');
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: /Program/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Home/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /People interested in your program/ })).toHaveCount(0);
  });

  test('nobody on the list: faint circles, and a (+) that starts a member invite', async ({ page }) => {
    await signedInAs(page, 'admin', { fresh: true });
    await page.goto('/');

    const members = row(page, 'Members');
    await expect(members).toBeVisible();
    // One link, the (+): the empty circles are decoration and announce nothing.
    const links = members.getByRole('link');
    await expect(links).toHaveCount(1);
    await expect(links.first()).toHaveAccessibleName('Invite someone');
    await expect(links.first()).toHaveAttribute('href', '/invite/new/?role=member');
    const box = await links.first().boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(await members.locator('[aria-hidden="true"]').count()).toBeGreaterThanOrEqual(4);

    await settled(page);
    await links.first().click();
    await expect(page).toHaveURL(/\/invite\/new\/\?role=member/);
    await expect(page.getByRole('heading', { name: 'A link for a member', level: 1 })).toBeVisible();
  });

  test('nobody on a program lead\'s list: the (+) opens their invite choice', async ({ page }) => {
    await signedInAs(page, 'provider', { fresh: true });
    await page.goto('/');

    const link = row(page, 'People interested in your program').getByRole('link', { name: 'Invite someone' });
    await expect(link).toHaveAttribute('href', '/invite/');
    await settled(page);
    await link.click();
    await expect(page).toHaveURL(/\/invite\/$/);
    await expect(page.getByRole('heading', { name: 'Invite someone', level: 1 })).toBeVisible();
  });

  test('the empty Home has no WCAG A/AA violations', async ({ page }) => {
    await signedInAs(page, 'admin', { fresh: true });
    await page.goto('/');
    await expect(row(page, 'Members')).toBeVisible();
    await settled(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
