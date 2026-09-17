import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * Signing up.
 *
 * What is worth testing here is not that a form renders. It is the three
 * promises the screen makes:
 *
 *  - the request it sends never names a role, so nobody types their way into
 *    seeing other people's information (0046);
 *  - the two staff answers create no account at all;
 *  - a city PAM does not serve gets an offer, not an error, and the text
 *    opt-in on that screen is never pre-ticked.
 *
 * Supabase is unreachable from here, so auth and every RPC are stubbed at the
 * network and the calls are recorded. The refusals themselves are enforced in
 * the database and proved there (`packages/db` — a member cannot write their
 * own role, and `start_membership` has no role argument to pass).
 */

const USER = '**/auth/v1/user*';
const PROFILES = '**/rest/v1/profiles*';
const NOTIFICATIONS = '**/rest/v1/notifications*';
const START = '**/rest/v1/rpc/start_membership*';
const STAFF = '**/rest/v1/rpc/request_staff_access*';
const WAITING = '**/rest/v1/rpc/join_waiting_city*';
const CITIES = '**/rest/v1/rpc/served_cities*';
const POINTS = '**/rest/v1/rpc/member_points*';
const PREFS = '**/rest/v1/notification_preferences*';

const NEWCOMER = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

interface Calls {
  start: Record<string, unknown>[];
  staff: Record<string, unknown>[];
  waiting: Record<string, unknown>[];
  profileWrites: Record<string, unknown>[];
}

/**
 * A verified phone with no PAM record: the person step 2 exists for.
 *
 * `cityServed` false makes `start_membership` answer the way Postgres does for
 * a city PAM is not in — P0002, which is what the screen branches on.
 */
async function newcomer(
  page: import('@playwright/test').Page,
  options: { cityServed?: boolean } = {},
): Promise<Calls> {
  const calls: Calls = { start: [], staff: [], waiting: [], profileWrites: [] };

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
  }, NEWCOMER);

  await page.route(USER, (route) => route.fulfill(json({ id: NEWCOMER })));
  await page.route(NOTIFICATIONS, (route) => route.fulfill(json([])));
  await page.route(CITIES, (route) => route.fulfill(json([{ city: 'Philadelphia' }])));
  await page.route(POINTS, (route) => route.fulfill(json(25)));
  await page.route(PREFS, (route) => route.fulfill(json([])));

  // No profile yet — a select answers null, and an update is recorded.
  await page.route(PROFILES, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill(json(null));
      return;
    }
    calls.profileWrites.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill(json([]));
  });

  await page.route(START, async (route) => {
    calls.start.push(route.request().postDataJSON() as Record<string, unknown>);
    if (options.cityServed === false) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'P0002', message: 'PAM is not in that city yet' }),
      });
      return;
    }
    await route.fulfill(json({ id: NEWCOMER, role: 'member' }));
  });

  await page.route(STAFF, async (route) => {
    calls.staff.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill(json(null));
  });

  await page.route(WAITING, async (route) => {
    calls.waiting.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill(json(null));
  });

  return calls;
}

/** Fills the three fields step 2 asks for. */
async function fillDetails(page: import('@playwright/test').Page, city = 'Philadelphia') {
  await page.getByLabel('First name').fill('Marcus');
  await page.getByLabel('Last name').fill('Reeves');
  await page.getByLabel('City you live in').fill(city);
}

test.describe('signing up', () => {
  test('says how many steps there are, and where somebody is', async ({ page }) => {
    // Somebody deciding whether they have time for this needs a number.
    await newcomer(page);
    await page.goto('/join/');

    await expect(page.getByText('Step 2 of 5').first()).toBeVisible();
    const bar = page.getByRole('progressbar');
    await expect(bar).toHaveAttribute('aria-valuenow', '2');
    await expect(bar).toHaveAttribute('aria-valuemax', '5');
  });

  test('never says "role" to the person filling it in', async ({ page }) => {
    // Role is a word this system uses about people, not one people use about
    // themselves (Will, 14 September).
    await newcomer(page);
    await page.goto('/join/');
    await expect(page.getByLabel('First name')).toBeVisible();

    // Word boundaries, not a substring: "Parole Officer" is one of the three
    // sentences, and it is not the jargon this is looking for.
    const text = (await page.locator('main').innerText()).toLowerCase();
    expect(text, 'the word "role" reached the sign-up form').not.toMatch(/\brole\b/);
  });

  test('a member reaches the end, and the request never names a role', async ({ page }) => {
    const calls = await newcomer(page);
    await page.goto('/join/');
    await fillDetails(page);
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: what is visible, and what is not.
    await expect(page.getByRole('heading', { name: 'What others can see' })).toBeVisible();
    await expect(page.getByText('What you write in your chats')).toBeVisible();

    expect(calls.start, 'start_membership was not called').toHaveLength(1);
    const sent = Object.keys(calls.start[0]!).join(' ');
    expect(sent, 'the sign-up request carries a role').not.toContain('role');

    await page.getByRole('button', { name: 'I understand' }).click();
    await expect(page.getByRole('heading', { name: 'Text messages' })).toBeVisible();
    await expect(page.getByText('Step 4 of 5').first()).toBeVisible();

    await page.getByRole('button', { name: 'Yes, text me reminders' }).click();

    // Step 5: the first points, and the badge that comes with them.
    await expect(page.getByRole('heading', { name: 'You are in' })).toBeVisible();
    await expect(page.getByText('Returned')).toBeVisible();
    // The count-up is aria-hidden and the real value is announced beside it,
    // so the screen reader hears the number once.
    await expect(page.getByText('25 Your points')).toBeAttached();

    // Finishing setup is what earns them, so it has to have been written.
    await expect
      .poll(() => calls.profileWrites.some((w) => 'onboarded_at' in w))
      .toBe(true);
  });

  test('a case manager is a claim, not an account', async ({ page }) => {
    // These roles read other people's information. A form is not a credential.
    const calls = await newcomer(page);
    await page.goto('/join/');
    await fillDetails(page);
    await page.getByRole('radio', { name: 'Parole Officer or Case Manager' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'Someone will call you' })).toBeVisible();
    expect(calls.staff, 'the claim was not recorded').toHaveLength(1);
    expect(calls.staff[0]!['p_wants_role']).toBe('admin');
    expect(calls.start, 'a staff answer created a profile').toHaveLength(0);

    // Four steps, not five: there is no account to attach text consent to.
    await expect(page.getByText('Step 3 of 4').first()).toBeVisible();
  });

  test('a city PAM does not serve is an offer, not an error', async ({ page }) => {
    const calls = await newcomer(page, { cityServed: false });
    await page.goto('/join/');
    await fillDetails(page, 'Scranton');
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('PAM is not in Scranton yet.')).toBeVisible();
    await expect(page.getByText('Right now PAM is in Philadelphia.')).toBeVisible();

    // Unticked, and it stays unticked unless somebody ticks it (A2P 30925).
    const optIn = page.getByRole('checkbox', { name: /Text me when PAM opens/ });
    await expect(optIn).not.toBeChecked();

    await page.getByRole('button', { name: 'Save my city' }).click();
    await expect.poll(() => calls.waiting.length).toBe(1);
    expect(calls.waiting[0]!['p_wants_updates'], 'an untouched box sent a yes').toBe(false);

    await expect(page.getByRole('heading', { name: 'We have your city' })).toBeVisible();
    await expect(page.getByText(/Your city is on our list/)).toBeVisible();
  });

  test('ticking the box is what sends the yes', async ({ page }) => {
    const calls = await newcomer(page, { cityServed: false });
    await page.goto('/join/');
    await fillDetails(page, 'Scranton');
    await page.getByRole('button', { name: 'Next' }).click();

    await page.getByRole('checkbox', { name: /Text me when PAM opens/ }).check();
    await page.getByRole('button', { name: 'Save my city' }).click();

    await expect.poll(() => calls.waiting.length).toBe(1);
    expect(calls.waiting[0]!['p_wants_updates']).toBe(true);
    await expect(page.getByText(/We will text you when PAM opens/)).toBeVisible();
  });

  test('a name is asked for before anything is sent', async ({ page }) => {
    const calls = await newcomer(page);
    await page.goto('/join/');
    await page.getByLabel('City you live in').fill('Philadelphia');
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText(/We need your first name/)).toBeVisible();
    expect(calls.start, 'an empty name reached the database').toHaveLength(0);
  });

  test('a signed-out visitor starts at the phone, with the consent sentence', async ({ page }) => {
    // Step 1 is the same card as /signin/, including the sentence saying PAM
    // will text a code — the STOP/rates language moved to /reminders/ (D-139).
    await page.route(USER, (route) => route.fulfill({ status: 401, body: '{}' }));
    await page.goto('/join/');

    await expect(page.getByText('Step 1 of 5').first()).toBeVisible();
    await expect(page.getByLabel('Your phone number')).toBeVisible();
    await expect(page.getByText(/PAM texts you a code to sign in/)).toBeVisible();
  });

  test('has no WCAG A/AA violations', async ({ page }) => {
    await newcomer(page);
    await page.goto('/join/');
    await expect(page.getByLabel('First name')).toBeVisible();

    await settled(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.error(results.violations.map((v) => `${v.id}: ${v.help}`).join('\n'));
    }
    expect(results.violations).toEqual([]);
  });
});
