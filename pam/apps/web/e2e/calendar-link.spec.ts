import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * A member's calendar link (D-538, D-604, a98 plan C): nothing linked asks "Which calendar do you use?"; picking one makes the link; linked
 * says which calendar and since when, always has the link's buttons (the link is worked out again for the member, never kept), and
 * Manage: a new link or disconnect, each asking first. Every event names the place and address, so there is no switch for that. Supabase is stubbed.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const TOKEN = 'A'.repeat(22) + 'b'.repeat(43); // 65 characters, as the database makes one
const TOKEN2 = 'A'.repeat(22) + 'c'.repeat(43);
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

interface World {
  /** What the database says about the member's link, and what it says next after a new one. */
  state: { is_on: boolean; is_legacy: boolean; calendar: string | null; linked_on: string | null; token: string | null };
  issued: { p_calendar: string | null; p_timezone: string }[];
  off: number;
}

async function signedIn(page: Page, state: World['state']): Promise<World> {
  const world: World = { state, issued: [], off: 0 };
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, ME);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: ME, role: 'member', first_name: 'Marcus', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/calendar_link_state*', (route) => route.fulfill(json([world.state])));
  await page.route('**/rest/v1/rpc/calendar_link_issue*', (route) => {
    const body = route.request().postDataJSON() as { p_calendar: string | null; p_timezone: string };
    world.issued.push(body);
    // A first link names its calendar; a new one keeps it. Either way the member now has a versioned link, with a new address.
    world.state = {
      is_on: true,
      is_legacy: false,
      calendar: body.p_calendar ?? world.state.calendar ?? 'other',
      linked_on: '2026-10-18',
      token: world.state.token === TOKEN ? TOKEN2 : TOKEN,
    };
    return route.fulfill(json(world.state.token));
  });
  await page.route('**/rest/v1/rpc/calendar_link_off*', (route) => {
    world.off += 1;
    world.state = { is_on: false, is_legacy: false, calendar: null, linked_on: null, token: null };
    return route.fulfill(json(null));
  });
  return world;
}

const NONE = { is_on: false, is_legacy: false, calendar: null, linked_on: null, token: null };
const GOOGLE = { is_on: true, is_legacy: false, calendar: 'google', linked_on: '2026-10-12', token: TOKEN };
const APPLE = { is_on: true, is_legacy: false, calendar: 'apple', linked_on: '2026-10-12', token: TOKEN };
const LEGACY = { is_on: true, is_legacy: true, calendar: null, linked_on: '2026-10-11', token: null };

test('nothing linked: the privacy line, and four calendars to pick from; picking Google makes the link', async ({ page }) => {
  const world = await signedIn(page, NONE);
  await page.goto('/calendar/');
  await settled(page);
  await expect(page.getByText('Each visit shows the place’s name and address and its time. Anyone who can see your calendar can see where you are going and when.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Which calendar do you use?' }).or(page.getByText('Which calendar do you use?'))).toBeVisible();
  for (const name of ['Apple Calendar', 'Google Calendar', 'Outlook', 'Another calendar']) await expect(page.getByRole('button', { name }).or(page.getByRole('link', { name })).first()).toBeVisible();
  // No question about what is in the event: it is the place's name and address, always.
  await expect(page.getByRole('switch')).toHaveCount(0);
  await page.getByRole('button', { name: 'Google Calendar' }).or(page.getByText('Google Calendar', { exact: true })).first().click();
  await expect.poll(() => world.issued.length).toBe(1);
  expect(world.issued[0]).toMatchObject({ p_calendar: 'google' });
  expect(world.issued[0]!.p_timezone).toBeTruthy();
  await expect(page.getByText(/^Set up on /)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Add to Google Calendar' })).toHaveAttribute('href', 'https://calendar.google.com/calendar/r/settings/addbyurl');
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('linked: which calendar and since when, the buttons are always there, and the link is shown again on a return', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await signedIn(page, APPLE);
  await page.goto('/calendar/');
  await settled(page);
  await expect(page.getByText('Apple Calendar', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Set up on October 12')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();
  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(new RegExp(`/functions/v1/calendar-feed/${TOKEN}\\.ics$`));
  // Back again later: the same screen, the same buttons (the address is worked out, not remembered).
  await page.reload();
  await settled(page);
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();
  // The address itself is not drawn on the page.
  await expect(page.getByText(new RegExp(TOKEN))).toHaveCount(0);
});

test('Manage: Get a new link asks first and keeps the calendar; Disconnect asks first, then the choice is back', async ({ page }) => {
  const world = await signedIn(page, GOOGLE);
  await page.goto('/calendar/');
  await settled(page);
  await expect(page.getByText('Manage', { exact: true })).toBeVisible();
  await expect(page.getByText('Get a new link', { exact: true })).toBeVisible();
  await expect(page.getByText('Disconnect Google Calendar', { exact: true })).toBeVisible();
  // A new link.
  await page.getByText('Get a new link', { exact: true }).click();
  expect(world.issued).toHaveLength(0);
  await page.getByRole('dialog').getByRole('button', { name: 'Get a new link' }).click();
  await expect.poll(() => world.issued.length).toBe(1);
  expect(world.issued[0]).toMatchObject({ p_calendar: null });
  await expect(page.getByText('Google Calendar', { exact: true }).first()).toBeVisible();
  // Disconnect.
  await page.getByText('Disconnect Google Calendar', { exact: true }).click();
  expect(world.off).toBe(0);
  await expect(page.getByRole('dialog')).toContainText('Disconnect Google Calendar?');
  await page.getByRole('dialog').getByRole('button', { name: 'Disconnect' }).click();
  await expect.poll(() => world.off).toBe(1);
  await expect(page.getByText('Which calendar do you use?')).toBeVisible();
});

test('an older (hash-only) link says so, has no address to show, and picking a calendar replaces it', async ({ page }) => {
  const world = await signedIn(page, LEGACY);
  await page.goto('/calendar/');
  await settled(page);
  await expect(page.getByText('Your older link')).toBeVisible();
  await expect(page.getByText(/Each visit says only “Pam visit” and its time/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy link' })).toHaveCount(0);
  await expect(page.getByText('Which calendar do you use?')).toBeVisible();
  await page.getByText('Outlook', { exact: true }).click();
  await expect.poll(() => world.issued.length).toBe(1);
  expect(world.issued[0]).toMatchObject({ p_calendar: 'outlook' });
  await expect(page.getByText('Your older link')).toHaveCount(0);
});

test('Profile has a Calendar row for a member', async ({ page }) => {
  await signedIn(page, NONE);
  await page.goto('/profile/');
  await settled(page);
  await expect(page.getByRole('link', { name: /Calendar/ })).toBeVisible();
});

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';

test.describe('Add to Apple Calendar', () => {
  test.describe('on an iPhone', () => {
    test.use({ userAgent: IPHONE });
    test('is there, and opens the webcal address', async ({ page }) => {
      await signedIn(page, APPLE);
      await page.goto('/calendar/');
      await settled(page);
      await expect(page.getByRole('link', { name: 'Add to Apple Calendar' })).toHaveAttribute('href', new RegExp(`^webcal://.*/calendar-feed/${TOKEN}\\.ics$`));
    });
  });
  test.describe('on an Android phone', () => {
    test.use({ userAgent: ANDROID });
    test('is not there, because a webcal address opens nothing; the link can still be copied', async ({ page }) => {
      await signedIn(page, APPLE);
      await page.goto('/calendar/');
      await settled(page);
      await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Add to Apple Calendar' })).toHaveCount(0);
    });
  });
});
