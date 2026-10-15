import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * A member's calendar link (D-538): said first that anyone who can see their calendar will see their
 * visits; made on a tap and shown once; discreet unless the switch is on; a new link and turning it
 * off each ask first.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const TOKEN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedIn(page: Page, status: { is_on: boolean; show_details: boolean }) {
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
  await page.route('**/rest/v1/rpc/calendar_link_status*', (route) => route.fulfill(json([{ ...status, made_at: status.is_on ? '2026-10-11T12:00:00Z' : null }])));
}

test('the warning comes before the button, and making a link shows it once with copy and Apple', async ({ page }) => {
  await signedIn(page, { is_on: false, show_details: false });
  await page.route('**/rest/v1/rpc/calendar_link_make*', (route) => route.fulfill(json(TOKEN)));
  await page.goto('/calendar/');
  await settled(page);
  const warning = page.getByText('Anyone who can see your calendar will see these visits.');
  const make = page.getByRole('button', { name: 'Make my calendar link' });
  await expect(warning).toBeVisible();
  await expect(make).toBeVisible();
  // The warning is above the button.
  const w = (await warning.boundingBox())!;
  const m = (await make.boundingBox())!;
  expect(w.y).toBeLessThan(m.y);
  await make.click();
  await expect(page.getByText(new RegExp(`/functions/v1/calendar-feed/${TOKEN}\\.ics`))).toBeVisible();
  await expect(page.getByText('Pam shows this link only once. Copy it now. You can make a new one later.')).toBeVisible();
  await expect(page.getByText(/Keep this link to yourself\. Anyone who has it can see your visits/)).toBeVisible();
  // Google's phone app cannot add a calendar from a link: the page says so and opens Google Calendar on the web.
  await expect(page.getByText(/Google Calendar app can’t add a calendar from a link/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Google Calendar on the web' })).toHaveAttribute('href', 'https://calendar.google.com/calendar/r/settings/addbyurl');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('it is discreet unless the switch is turned on, and the switch needs no new link', async ({ page }) => {
  await signedIn(page, { is_on: true, show_details: false });
  const asked: unknown[] = [];
  await page.route('**/rest/v1/rpc/calendar_link_set_details*', (route) => {
    asked.push(route.request().postDataJSON());
    return route.fulfill(json(true));
  });
  let made = 0;
  await page.route('**/rest/v1/rpc/calendar_link_make*', (route) => {
    made += 1;
    return route.fulfill(json(TOKEN));
  });
  await page.goto('/calendar/');
  await settled(page);
  // A link made on another visit cannot be shown again.
  await expect(page.getByText('Pam can’t show your link again. Make a new link if you need it.')).toBeVisible();
  const details = page.getByRole('switch', { name: 'Show the place’s name and address in my calendar' });
  await expect(details).not.toBeChecked();
  await details.click();
  await expect.poll(() => asked.length).toBe(1);
  expect(asked[0]).toEqual({ p_show: true });
  expect(made).toBe(0);
});

test('a new link asks first, then makes one; turning it off asks first, then the button to make one is back', async ({ page }) => {
  await signedIn(page, { is_on: true, show_details: true });
  let made = 0;
  await page.route('**/rest/v1/rpc/calendar_link_make*', (route) => {
    made += 1;
    return route.fulfill(json(TOKEN));
  });
  let off = 0;
  await page.route('**/rest/v1/rpc/calendar_link_off*', (route) => {
    off += 1;
    return route.fulfill(json(null));
  });
  await page.goto('/calendar/');
  await settled(page);
  await page.getByRole('button', { name: 'Make a new link' }).click();
  expect(made).toBe(0);
  await page.getByRole('dialog').getByRole('button', { name: 'Make a new link' }).click();
  await expect.poll(() => made).toBe(1);
  await expect(page.getByText(new RegExp(TOKEN))).toBeVisible();

  await page.getByRole('button', { name: 'Turn it off' }).click();
  expect(off).toBe(0);
  await page.getByRole('dialog').getByRole('button', { name: 'Turn it off' }).click();
  await expect.poll(() => off).toBe(1);
  await expect(page.getByRole('button', { name: 'Make my calendar link' })).toBeVisible();
});

test('Profile has a Calendar row for a member', async ({ page }) => {
  await signedIn(page, { is_on: false, show_details: false });
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
      await signedIn(page, { is_on: false, show_details: false });
      await page.route('**/rest/v1/rpc/calendar_link_make*', (route) => route.fulfill(json(TOKEN)));
      await page.goto('/calendar/');
      await settled(page);
      await page.getByRole('button', { name: 'Make my calendar link' }).click();
      await expect(page.getByRole('link', { name: 'Add to Apple Calendar' })).toHaveAttribute('href', new RegExp(`^webcal://.*/calendar-feed/${TOKEN}\\.ics$`));
    });
  });
  test.describe('on an Android phone', () => {
    test.use({ userAgent: ANDROID });
    test('is not there, because a webcal address opens nothing', async ({ page }) => {
      await signedIn(page, { is_on: false, show_details: false });
      await page.route('**/rest/v1/rpc/calendar_link_make*', (route) => route.fulfill(json(TOKEN)));
      await page.goto('/calendar/');
      await settled(page);
      await page.getByRole('button', { name: 'Make my calendar link' }).click();
      await expect(page.getByText(new RegExp(TOKEN))).toBeVisible();
      await expect(page.getByRole('link', { name: 'Add to Apple Calendar' })).toHaveCount(0);
      // The way for Google's phone app is the web page, and the page says so.
      await expect(page.getByRole('link', { name: 'Open Google Calendar on the web' })).toBeVisible();
    });
  });
});
