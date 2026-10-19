import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * Problems (D-616; Will, 18 October: "if something breaks, please create an error log so the team can be notified and fix the
 * issue"): the super admin's list of what broke, from `app_errors_grouped`, newest first, with how often and when it first and last
 * happened. The log keeps no person and no free text, so neither does the screen. Supabase is stubbed.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const ROWS = [
  // Out of order on purpose: the screen puts the newest first.
  { area: '/reminders/', action: 'reminders.agree', code: 'offline', n: 1, first_seen: ago(5 * 24 * 60), last_seen: ago(5 * 24 * 60) },
  { area: '/alerts/', action: 'alerts.switch.closed', code: '500', n: 4, first_seen: ago(2 * 24 * 60), last_seen: ago(30) },
  { area: '/messages/thread/', action: 'messages.photo', code: 'timeout', n: 2, first_seen: ago(26 * 60), last_seen: ago(25 * 60) },
];

async function signedIn(page: Page, { role = 'super_admin', rows = ROWS, failFirst = false }: { role?: string; rows?: unknown[]; failFirst?: boolean } = {}) {
  const asked: unknown[] = [];
  await page.addInitScript((userId: string) => {
    const session = { access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: userId, aud: 'authenticated', role: 'authenticated' } };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, ME);
  await page.route('**/rest/v1/**', (route) => route.fulfill(json([])));
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: ME, role, first_name: 'Will', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
  );
  await page.route('**/rest/v1/rpc/app_errors_grouped*', (route) => {
    asked.push(route.request().postDataJSON());
    if (failFirst && asked.length === 1) return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    return route.fulfill(json(rows));
  });
  return asked;
}

test.describe('Problems (D-616)', () => {
  test('what broke this week, newest first, with how often and when, as the log keeps it', async ({ page }) => {
    const asked = await signedIn(page);
    await page.goto('/problems/');
    await settled(page);
    await expect(page.getByRole('heading', { name: 'Problems', level: 1 })).toBeVisible();
    await expect(page.getByText('Last 7 days')).toBeVisible();
    const items = page.getByRole('list', { name: 'Problems' }).getByRole('listitem');
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText('alerts.switch.closed');
    await expect(items.nth(1)).toContainText('messages.photo');
    await expect(items.nth(2)).toContainText('reminders.agree');
    await expect(items.nth(0)).toContainText('/alerts/ · 500');
    await expect(items.nth(0)).toContainText('4');
    await expect(items.nth(0).getByLabel('4 times')).toHaveCount(1);
    await expect(items.nth(2).getByLabel('1 time')).toHaveCount(1);
    await expect(items.nth(0)).toContainText(/Last: /);
    await expect(items.nth(0)).toContainText(/First: /);
    expect(asked[0]).toEqual({ p_days: 7 });
  });

  test('nothing broke says so in one line', async ({ page }) => {
    await signedIn(page, { rows: [] });
    await page.goto('/problems/');
    await expect(page.getByText('Nothing has gone wrong in the last 7 days.')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Problems' })).toHaveCount(0);
  });

  test('when the list cannot be read, Try again reads it again', async ({ page }) => {
    const asked = await signedIn(page, { failFirst: true });
    await page.goto('/problems/');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('list', { name: 'Problems' }).getByRole('listitem')).toHaveCount(3);
    expect(asked).toHaveLength(2);
  });

  test('the bell opens it, and Back goes back to the bell', async ({ page }) => {
    await signedIn(page);
    await page.goto('/problems/?from=notifications');
    await expect(page.getByRole('link', { name: 'Back to Notifications' })).toHaveAttribute('href', '/notifications/');
  });

  test("the bell's row says what broke by its name, not its key, and opens the list", async ({ page }) => {
    await signedIn(page);
    const row = (id: string, action: string, count: number) => ({
      id, kind: 'app_error', subject_type: null, subject_id: null, body_key: 'notify.app_error',
      body_vars: { action, count }, created_at: new Date().toISOString(), read_at: null,
    });
    // As the database writes it: the count is a number (report_app_error), so one failure reads in the singular.
    await page.route('**/rest/v1/notifications*', (route) =>
      route.fulfill(json([row('n1', 'messages.send', 3), row('n2', 'messages.photo', 1), row('n3', 'not.a.real.key', 2)])),
    );
    await page.goto('/notifications/');
    await settled(page);
    await expect(page.getByText("Sending a message didn't go through 3 times in the last hour.")).toBeVisible();
    await expect(page.getByText("Sending a photo didn't go through in the last hour.")).toBeVisible();
    await expect(page.getByText('messages.send')).toHaveCount(0);
    // A key with no name yet still says something true.
    await expect(page.getByText("not.a.real.key didn't go through 2 times in the last hour.")).toBeVisible();
    await page.getByRole('link', { name: /Sending a message/ }).click();
    await expect(page).toHaveURL(/\/problems\/\?from=notifications/);
  });

  test("a row beside the team's other tools opens it", async ({ page }) => {
    await signedIn(page);
    await page.goto('/requests/');
    await settled(page);
    await expect(page.getByRole('link', { name: /^Problems/ })).toHaveAttribute('href', '/problems/');
  });

  for (const role of ['member', 'admin', 'provider']) {
    test(`a ${role} is refused, and the log is never asked`, async ({ page }) => {
      const asked = await signedIn(page, { role });
      await page.goto('/problems/');
      await expect(page.getByText('alerts.switch.closed')).toHaveCount(0);
      expect(asked).toHaveLength(0);
    });
  }

  test('has no WCAG A/AA violations', async ({ page }) => {
    await signedIn(page);
    await page.goto('/problems/');
    await expect(page.getByRole('list', { name: 'Problems' })).toBeVisible();
    await settled(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
