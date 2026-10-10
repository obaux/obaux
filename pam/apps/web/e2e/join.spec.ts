import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LANGUAGE_TAGS, SUPPORTED_LOCALES } from '@pam/config';
import en from '@pam/config/locales/en.json';
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
 *  - a city Pam does not serve gets an offer, not an error, and the text
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
 * A verified phone with no Pam record: the person step 2 exists for.
 *
 * `cityServed` false makes `start_membership` answer the way Postgres does for
 * a city Pam is not in — P0002, which is what the screen branches on.
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
  // The city is a list of the served ones (D-369). A city Pam is not in can
  // only be typed when that list could not be fetched — the box comes back —
  // so a test of that path has the first ask fail and the later one (the
  // waiting screen's "Right now Pam is in …") answer.
  let citiesAsked = 0;
  await page.route(CITIES, (route) =>
    route.fulfill(json(options.cityServed === false && citiesAsked++ === 0 ? [] : [{ city: 'Philadelphia' }])),
  );
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
        body: JSON.stringify({ code: 'P0002', message: 'Pam is not in that city yet' }),
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
  // A list of the served cities (D-369), or the box when there is no list.
  const list = page.getByRole('combobox', { name: 'City you live in' });
  if (await list.count()) await expect(list).toContainText(city);
  else await page.getByLabel('City you live in').fill(city);
}

test.describe('signing up', () => {
  test('says how many steps there are, and where somebody is', async ({ page }) => {
    // Somebody deciding whether they have time for this needs a number.
    await newcomer(page);
    await page.goto('/join/');

    // D-359: the count rides in the button — Sign in did the phone, so About
    // you is step 1 of a member's 3. Still no bar.
    await expect(page.getByText('1 of 3', { exact: true })).toBeVisible();
    await expect(page.getByRole('progressbar')).toHaveCount(0);
  });

  for (const locale of ['en', 'ar'] as const) {
    test(`${locale}: the language chips lead with their English tag, in the page's direction, and read as the name alone (D-451, D-455)`, async ({ page }) => {
      // Will, 10 October 2026: the tag says which language a chip is before the chip says it in itself.
      // Always English; hidden from a screen reader; first at the start of the chip, so on an English page
      // the Arabic chip reads "AR  العربية" and on an Arabic page the English chip "EN  English".
      await page.addInitScript((code) => localStorage.setItem('pam.locale', code), locale);
      await newcomer(page);
      await page.goto('/join/');
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      const group = page.getByRole('group').filter({ has: page.locator('[aria-pressed]') }).last();
      await expect(group).toBeVisible();
      // Positions are read below: wait for the page a member reads, with its fonts, not the load (`settled.ts`).
      await settled(page);
      for (const code of SUPPORTED_LOCALES) {
        const name = en[`language.${code}` as keyof typeof en] as string;
        const chip = group.getByRole('button', { name, exact: true });
        await expect(chip, `${code} chip`).toHaveCount(1);
        const tag = chip.locator('[aria-hidden="true"]', { hasText: LANGUAGE_TAGS[code] });
        await expect(tag).toHaveText(LANGUAGE_TAGS[code]);
        // The name is spoken in its own voice (`lang` on the chip) and is drawn in its own direction (on the words),
        // while the chip itself is not turned round.
        await expect(chip).toHaveAttribute('lang', code);
        await expect(chip).not.toHaveAttribute('dir');
        const words = chip.locator(`span[lang="${code}"]`);
        await expect(words).toHaveText(name);
        await expect(words).toHaveAttribute('dir', code === 'ar' ? 'rtl' : 'ltr');
        const tagBox = (await tag.boundingBox())!;
        const wordsBox = (await words.boundingBox())!;
        if (locale === 'ar') expect(tagBox.x, `${code}: tag on the right of the name`).toBeGreaterThan(wordsBox.x);
        else expect(tagBox.x, `${code}: tag on the left of the name`).toBeLessThan(wordsBox.x);
      }
    });
  }

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
    await expect(page.getByText('What you say or send to someone else')).toBeVisible();
    // D-394, D-399: photos and documents are named, not left to "message" meaning all.
    await expect(page.getByText('A message, photo or document only if someone says it is not safe')).toBeVisible();
    // D-199: the one activity fact a program is allowed is stated here, not
    // left to be inferred from a lit ring on somebody else's screen.
    await expect(
      page.getByText('When you save a new place — not which one. A program you joined sees this too.'),
    ).toBeVisible();

    expect(calls.start, 'start_membership was not called').toHaveLength(1);
    const sent = Object.keys(calls.start[0]!).join(' ');
    expect(sent, 'the sign-up request carries a role').not.toContain('role');

    await page.getByRole('button', { name: 'I understand' }).click();
    await expect(page.getByRole('heading', { name: 'Text messages' })).toBeVisible();
    await expect(page.getByText('3 of 3', { exact: true })).toBeVisible();

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

  test('without a link, nobody can say they are staff (D-369)', async ({ page }) => {
    // A program or a case manager joins by the link they are sent; the form
    // has no question a member could answer as staff by mistake.
    const calls = await newcomer(page);
    await page.goto('/join/');
    await fillDetails(page);
    await expect(page.getByRole('radio')).toHaveCount(0);
    await expect(page.getByText('Parole Officer or Case Manager')).toHaveCount(0);
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'What others can see' })).toBeVisible();
    expect(calls.staff, 'a staff claim was sent').toHaveLength(0);
    expect(calls.start, 'start_membership was not called').toHaveLength(1);
  });

  test('invited by a link, nothing is asked that the link already said (D-254)', async ({ page }) => {
    // Sign in kept the code and who it is for; joining picks them up.
    await page.addInitScript(() => {
      window.sessionStorage.setItem('pam.invite', JSON.stringify({ code: 'PAM7Q4KX', role: 'admin' }));
    });
    await newcomer(page);
    await page.goto('/join/');

    await expect(page.getByText('You were invited as:')).toBeVisible();
    await expect(page.getByText('Case manager', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Code from the person who invited you')).toHaveCount(0);
    await expect(page.getByRole('radio', { name: 'Parole Officer or Case Manager' })).toHaveCount(0);
  });

  test('a city Pam does not serve is an offer, not an error', async ({ page }) => {
    const calls = await newcomer(page, { cityServed: false });
    await page.goto('/join/');
    await fillDetails(page, 'Scranton');
    await page.getByRole('button', { name: 'Next' }).click();

    // The second ask has answered once "Right now Pam is in …" is there; only
    // then is it safe to say the city is still the one that was typed. Looking at
    // the city first passed by catching the screen before the answer came back —
    // when the answer replaced Scranton with Philadelphia (found 9 October 2026,
    // a test that failed on a slow machine and passed on a fast one).
    await expect(page.getByText('Right now Pam is in Philadelphia.')).toBeVisible();
    await expect(page.getByText('Pam is not in Scranton yet.')).toBeVisible();

    // Unticked, and it stays unticked unless somebody ticks it (A2P 30925).
    const optIn = page.getByRole('checkbox', { name: /Text me when Pam opens/ });
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

    await page.getByRole('checkbox', { name: /Text me when Pam opens/ }).check();
    await page.getByRole('button', { name: 'Save my city' }).click();

    await expect.poll(() => calls.waiting.length).toBe(1);
    expect(calls.waiting[0]!['p_wants_updates']).toBe(true);
    await expect(page.getByText(/We saved your city and that you want to hear when Pam opens there/)).toBeVisible();
  });

  test('a name is asked for before anything is sent', async ({ page }) => {
    const calls = await newcomer(page);
    await page.goto('/join/');
    // The city is pre-set from the served list (D-369); only the name is empty.
    await expect(page.getByRole('combobox', { name: 'City you live in' })).toContainText('Philadelphia');
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText(/We need your first name/)).toBeVisible();
    expect(calls.start, 'an empty name reached the database').toHaveLength(0);
  });

  test('a signed-out visitor is sent to Sign in for the phone, with the consent sentence', async ({ page }) => {
    // The phone and the code are Sign in's (D-359), with the sentence saying
    // Pam will text a code — the STOP/rates language is on /reminders/ (D-139).
    await page.route(USER, (route) => route.fulfill({ status: 401, body: '{}' }));
    await page.goto('/join/?code=PAM7Q4KX');

    await expect(page).toHaveURL(/\/signin\/\?code=PAM7Q4KX/);
    await expect(page.getByLabel('Your phone number')).toBeVisible();
    await expect(page.getByText(/Pam texts you a code to sign in/)).toBeVisible();
  });

  test('has no WCAG A/AA violations', async ({ page }) => {
    await newcomer(page);
    await page.goto('/join/');
    await expect(page.getByLabel('First name')).toBeVisible();

    // Next is pinned to the foot (D-359), so on a 320px screen the form
    // scrolls under it. At the end of the page nothing is beneath it — the
    // page leaves room for the footer — which is where a person presses it.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
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
