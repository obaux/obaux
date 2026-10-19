import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * Text alerts, one switch per kind (D-256, D-478). Each switch is its own yes,
 * kept on the account; turning one on records the yes to texts, and turning the
 * last one off withdraws it for a program or case manager. A member's yes also
 * covers their reminders, so an alert going off never withdraws it. Supabase is
 * stubbed at the network, as in messages.spec.ts.
 */
const USER = '**/auth/v1/user*';
const PROFILES = '**/rest/v1/profiles*';
const POINTS = '**/rest/v1/rpc/member_points*';
const CONTROLS = '**/rest/v1/access_controls*';
const NOTIFICATIONS = '**/rest/v1/notifications*';
const SETTINGS = '**/rest/v1/app_settings*';
const PREFS = '**/rest/v1/notification_preferences*';
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';

const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedInAs(page: import('@playwright/test').Page, role: 'provider' | 'admin' | 'member', prefs: Record<string, unknown> | null, textsLive = 'on') {
  await page.route(SETTINGS, (route) => route.fulfill(json({ value: textsLive })));
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
  }, ME);
  await page.route(NOTIFICATIONS, (route) => route.fulfill(json([])));
  await page.route(CONTROLS, (route) => route.fulfill(json([])));
  await page.route(USER, (route) => route.fulfill(json({ id: ME, phone: '12155550191' })));
  await page.route(POINTS, (route) => route.fulfill(json(250)));
  await page.route(PROFILES, (route) =>
    route.fulfill(
      json({ id: ME, role, first_name: 'Will', access_status: 'active', region_id: '0195b1c0-0000-4000-8000-000000000001', regions: { name: 'Philadelphia' } }),
    ),
  );
  const writes: Record<string, unknown>[] = [];
  let current: Record<string, unknown> | null = prefs;
  await page.route(PREFS, async (route) => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill(json(current));
    const body = JSON.parse(request.postData() ?? '{}');
    writes.push(body);
    // What was written is what the next read says, as the database would.
    current = { sms_stopped_at: null, alert_message: false, alert_booked: false, alert_changed: false, alert_trip: false, ...(current ?? {}), ...body };
    return route.fulfill({ status: 201, body: '' });
  });
  return writes;
}


/**
 * The banner a failure raises (D-618; Will, 19 October: "use the other alert banner style … let users know how to resolve it … contact pam
 * as a last resort (but don't explicitly state that)"). Driven from Text alerts, the one screen on the hook: its switch fails and the
 * banner at the bottom says what to do. The words are one line until Sage's per-kind words land; the actions are what is tested.
 */
const CLOSED = 'A saved place closes or moves';
const ON = { sms_enabled: true, sms_stopped_at: null, alert_message: false, alert_booked: false, alert_changed: false, alert_trip: false };
const LINE = "Something's wrong on our side";

async function failing(page: import('@playwright/test').Page, status: number, body = '{}') {
  await signedInAs(page, 'member', ON, 'on');
  let writes = 0;
  let failWrites = true;
  await page.route(PREFS, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(json(ON));
    writes += 1;
    return failWrites ? route.fulfill({ status, contentType: 'application/json', body }) : route.fulfill({ status: 201, body: '' });
  });
  await page.goto('/alerts/');
  await settled(page);
  return { writes: () => writes, heal: () => (failWrites = false) };
}

test.describe('The failure banner (D-618)', () => {
  test('a failed switch raises the banner at the bottom with "Try again", fitting a 320x568 screen, and the tap works the switch again', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    const server = await failing(page, 500);
    const toggle = page.getByRole('switch', { name: CLOSED });
    await toggle.click();
    const banner = page.getByRole('alert').filter({ hasText: LINE });
    await expect(banner).toBeVisible();
    const box = (await banner.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    expect(box.y + box.height).toBeLessThanOrEqual(568);
    const row = (await toggle.boundingBox())!;
    expect(box.y >= row.y + row.height || box.y + box.height <= row.y).toBe(true);
    // Try again is a button in the banner: it is a tap, and the next-tap rule does not take the banner away before it works.
    expect(server.writes()).toBe(1);
    server.heal();
    await banner.getByRole('button', { name: 'Try again' }).click();
    await expect.poll(() => server.writes()).toBe(2);
    await expect(toggle).not.toBeChecked();
    await expect(banner).toHaveCount(0);
  });

  test('while the banner is up the page scrolls its last control clear of it (320x568)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await failing(page, 500);
    await page.getByRole('switch', { name: CLOSED }).click();
    const banner = page.getByRole('alert').filter({ hasText: LINE });
    await expect(banner).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const switches = page.getByRole('switch');
    const last = (await switches.last().boundingBox())!;
    const top = (await banner.boundingBox())!.y;
    expect(last.y + last.height).toBeLessThanOrEqual(top);
  });

  test('the same switch failing twice in a row adds "Get help" (no "contact Pam" words), which opens Help', async ({ page }) => {
    await failing(page, 500);
    await page.getByRole('switch', { name: CLOSED }).click();
    const banner = page.getByRole('alert').filter({ hasText: LINE });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('button', { name: 'Get help' })).toHaveCount(0);
    await banner.getByRole('button', { name: 'Try again' }).click();
    // Failed again: the second failure says so, and Help has more.
    const second = page.getByRole('alert').filter({ hasText: 'Still not working' });
    await expect(second.getByRole('button', { name: 'Get help' })).toBeVisible();
    await expect(second).toContainText('Help has more ways to sort this out.');
    await expect(second).not.toContainText(/contact pam/i);
    // The help desk's page for this (a page on the website, so the app has left): not Help in the app, and not "contact Pam".
    const [navigation] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('/support/something-didnt-go-through/')),
      second.getByRole('button', { name: 'Get help' }).click(),
    ]).catch(() => [null]);
    expect(navigation).not.toBeNull();
  });

  test('a signed-out failure offers Sign in', async ({ page }) => {
    await failing(page, 401, '{"code":"PGRST301","message":"JWT expired"}');
    await page.getByRole('switch', { name: CLOSED }).click();
    const banner = page.getByRole('alert').filter({ hasText: "You're signed out" });
    await expect(banner).toContainText('Sign in to keep going.');
    await expect(banner.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await banner.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/signin\/\?next=\/alerts\/?$/);
  });

  test('a refused failure (not allowed) has no Try again and no Sign in: the way out is Get help on the second', async ({ page }) => {
    await failing(page, 403, '{"code":"42501","message":"permission denied"}');
    await page.getByRole('switch', { name: CLOSED }).click();
    const banner = page.getByRole('alert').filter({ hasText: "This account can't do that" });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('button', { name: /try again|sign in/i })).toHaveCount(0);
    await expect(banner.getByRole('button', { name: 'Dismiss' })).toBeVisible();
  });

  test('offline (the phone has no network) offers Try again', async ({ page, context }) => {
    const server = await failing(page, 500);
    await context.setOffline(true);
    await page.getByRole('switch', { name: CLOSED }).click();
    const banner = page.getByRole('alert').filter({ hasText: "You're offline" });
    await expect(banner).toContainText('Check your Wi-Fi or mobile data');
    await expect(banner.getByRole('button', { name: 'Try again' })).toBeVisible();
    await context.setOffline(false);
    server.heal();
    await banner.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('switch', { name: CLOSED })).not.toBeChecked();
  });

  test('offline, a second failure keeps the offline words and Try again, with no Get help (the help desk is on the website)', async ({ page, context }) => {
    await failing(page, 500);
    await context.setOffline(true);
    await page.getByRole('switch', { name: CLOSED }).click();
    const banner = page.getByRole('alert').filter({ hasText: "You're offline" });
    await expect(banner.getByRole('button', { name: 'Try again' })).toBeVisible();
    // Still offline: the same action fails again.
    await banner.getByRole('button', { name: 'Try again' }).click();
    await expect(banner.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(banner).toContainText('Check your Wi-Fi or mobile data');
    await expect(page.getByRole('alert').filter({ hasText: 'Still not working' })).toHaveCount(0);
    await expect(banner.getByRole('button', { name: 'Get help' })).toHaveCount(0);
  });

  test('the close button takes it away, and it is never a timer', async ({ page }) => {
    await failing(page, 500);
    await page.getByRole('switch', { name: CLOSED }).click();
    const banner = page.getByRole('alert').filter({ hasText: LINE });
    await expect(banner).toBeVisible();
    await page.waitForTimeout(2_500);
    await expect(banner).toBeVisible();
    await banner.getByRole('button', { name: 'Dismiss' }).click();
    await expect(banner).toHaveCount(0);
  });

  test('"Show the latest" is the way out when someone changed it first', async ({ page }) => {
    await failing(page, 409, '{"code":"23505","message":"duplicate"}');
    await page.getByRole('switch', { name: CLOSED }).click();
    const banner = page.getByRole('alert').filter({ hasText: 'This was already changed' });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('button', { name: /try again|sign in/i })).toHaveCount(0);
    const reload = page.waitForEvent('load');
    await banner.getByRole('button', { name: 'Show the latest' }).click();
    await reload;
    await expect(page.getByRole('switch', { name: CLOSED })).toBeVisible();
  });

  test('it has no WCAG A/AA violations, with the solid error ground', async ({ page }) => {
    await failing(page, 500);
    await page.getByRole('switch', { name: CLOSED }).click();
    await expect(page.getByRole('alert').filter({ hasText: LINE })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});
