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

test.describe('the way out', () => {
  test('every tab screen has the same way to your profile', async ({ page }) => {
    await signedIn(page, { role: 'member' });
    // The account button in the old header is the bar's Profile tab now (D-217, D-456): the same link,
    // in the same place, under every tab screen. Points left this list at D-217: it is a nested screen,
    // reached from Profile, with no bar.
    for (const path of ['/', '/saved/', '/messages/', '/places/']) {
      await page.goto(path);
      const tab = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /Profile/ });
      await expect(tab, `${path} has no Profile tab`).toBeVisible();
      await expect(tab).toHaveAttribute('href', '/profile/');
    }
  });

  test('a member can sign out, and is told they did', async ({ page }) => {
    await signedIn(page, { role: 'member' });
    // /account/ opens Profile for somebody signed in (D-217); /profile/ is the same screen.
    await page.goto('/account/');

    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Will' })).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).or(page.getByRole('link', { name: 'Sign out' })).first().click();

    await expect(page).toHaveURL(/\/signin\/\?out=1/);
    await expect(page.getByText(/You are signed out/)).toBeVisible();
    // Scoped to the textbox role: the banner's own dismiss button carries an
    // accessible name built from the banner's text ("Dismiss You are signed
    // out... with your phone number..."), which also matches a plain
    // `getByLabel('Your phone number')` by substring.
    await expect(page.getByRole('textbox', { name: 'Your phone number' })).toBeVisible();
  });

  test('the sign-in screen sends a signed-in person home, not back to the phone field', async ({
    page,
  }) => {
    await signedIn(page, { role: 'member' });
    await page.goto('/signin/');
    await expect(page).toHaveURL(/\/$/);
    // The front door is Explore under the bar now, not the old "Hi, Will" Home (D-212, D-456).
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /Explore/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Hi, Will/ })).toHaveCount(0);
  });

  test('a verified phone with no account is sent to finish signing up', async ({ page }) => {
    // Six screens used to offer this person "Sign in" — the door they had
    // just walked through.
    await signedIn(page, null);
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Finish setting up' })).toHaveAttribute(
      'href',
      '/join/',
    );

    await page.goto('/points/');
    await expect(page.getByRole('link', { name: 'Finish setting up' })).toBeVisible();

    await page.goto('/signin/');
    await expect(page).toHaveURL(/\/join\//);
  });

  test('a paused account is told so once, plainly, with the way out', async ({ page }) => {
    await signedIn(page, { role: 'member', access_status: 'suspended' });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Your account is paused' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Call Pam/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign out' })).toHaveAttribute('href', '/account/');
    // And not the generic failure, which would be a lie about what happened.
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
  });

  test('a super admin can make a link for a case manager, in a named city', async ({ page }) => {
    const asked: Record<string, unknown>[] = [];
    await signedIn(page, { role: 'super_admin' });
    await page.route('**/rest/v1/rpc/directory_people*', (route) => route.fulfill(json([])));
    await page.route('**/rest/v1/regions*', (route) =>
      route.fulfill(
        json([
          { id: 'r-phl', name: 'Philadelphia' },
          { id: 'r-pit', name: 'Pittsburgh' },
        ]),
      ),
    );
    // A case manager is staff: invited with an email, through its own door (0086).
    await page.route('**/rest/v1/rpc/create_staff_invite*', async (route) => {
      asked.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill(
        json({ code: 'P3TWVWTW', expires_at: '2026-10-14T00:00:00Z', role: 'admin' }),
      );
    });

    // From Everyone, two rows lead on (D-444): Invite someone, then the kind.
    await page.goto('/directory/');
    await page.getByRole('link', { name: 'Invite someone' }).click();
    await page.getByRole('link', { name: /^Invite a case manager/ }).click();
    await expect(page.getByRole('heading', { name: 'A link for a case manager', level: 1 })).toBeVisible();

    // No city picked: nothing is sent, and the page says why.
    await page.getByLabel('Their first name').fill('Kim');
    await page.getByLabel('Their mobile number').fill('412 555 0199');
    await page.getByLabel('Their email').fill('kim@example.org');
    await page.getByRole('button', { name: 'Create link' }).click();
    await expect(page.getByText('Pick a city first.')).toBeVisible();
    expect(asked).toHaveLength(0);

    await page.getByRole('radio', { name: 'Pittsburgh' }).click();
    await page.getByRole('button', { name: 'Create link' }).click();

    // A link to the invite Sign in, for a case manager (D-254).
    await expect(page.getByText(/\/signin\/\?invite=P3TWVWTW&as=case-manager/)).toBeVisible();
    expect(asked[0]).toMatchObject({
      p_role: 'admin',
      p_region_id: 'r-pit',
      p_first_name: 'Kim',
      p_phone: '412 555 0199',
      p_email: 'kim@example.org',
    });
  });

  test('a member who also works at a program picks a side on Profile (D-374)', async ({ page }) => {
    const switched: Record<string, unknown>[] = [];
    await signedIn(page, { role: 'member', profile_roles: [{ role: 'member' }, { role: 'provider' }] });
    await page.route('**/rest/v1/rpc/switch_role*', async (route) => {
      switched.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill(json({ id: WILL, role: 'provider' }));
    });
    await page.goto('/profile/');
    await page.getByRole('link', { name: /Use Pam as/ }).click();
    await expect(page.getByRole('heading', { name: 'Use Pam as', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: /My program/ }).click();
    await expect.poll(() => switched.length).toBe(1);
    expect(switched[0]).toMatchObject({ p_role: 'provider' });
  });

  test('a one-role account has no "Use Pam as"', async ({ page }) => {
    await signedIn(page, { role: 'member' });
    await page.goto('/profile/');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Use Pam as/ })).toHaveCount(0);
  });

  test('the profile screen has no WCAG A/AA violations', async ({ page }) => {
    await signedIn(page, { role: 'member' });
    await page.goto('/account/');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
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

test.describe('a code from the person who invited you', () => {
  test('redeems the invite instead of self-serving, and the invite decides the role', async ({
    page,
  }) => {
    const calls: { redeem: Record<string, unknown>[]; start: number } = { redeem: [], start: 0 };
    await signedIn(page, null);
    await page.route('**/rest/v1/rpc/served_cities*', (route) =>
      route.fulfill(json([{ city: 'Philadelphia' }])),
    );
    await page.route('**/rest/v1/rpc/start_membership*', async (route) => {
      calls.start += 1;
      await route.fulfill(json({}));
    });
    await page.route('**/rest/v1/rpc/redeem_invite*', async (route) => {
      calls.redeem.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill(json({ id: WILL, role: 'admin' }));
    });

    // The code came as a link, so it is already filled in and the three
    // sentences are not asked — the person who made the code answered them.
    await page.goto('/join/?code=p3twvwtw');
    await expect(page.getByLabel('Code from the person who invited you')).toHaveValue('P3TWVWTW');
    await expect(page.getByRole('radio', { name: 'Someone in need of support' })).toHaveCount(0);

    await page.getByLabel('First name').fill('Kim');
    await page.getByLabel('Last name').fill('Adeyemi');
    // The served cities are a list, pre-set to the one there is (D-369).
    await expect(page.getByRole('combobox', { name: 'City you live in' })).toContainText('Philadelphia');
    await page.getByRole('button', { name: 'Next' }).click();

    // A case manager's privacy screen, the last of their two steps (D-359).
    await expect(page.getByRole('heading', { name: 'What you will see' })).toBeVisible();
    await expect(page.getByText('2 of 2', { exact: true })).toBeVisible();
    expect(calls.start, 'self-serve sign-up ran alongside the code').toBe(0);
    expect(calls.redeem[0]).toMatchObject({
      p_code: 'P3TWVWTW',
      p_first_name: 'Kim',
      p_last_name: 'Adeyemi',
      p_home_city: 'Philadelphia',
    });
  });

  test('a wrong code is one plain sentence, not a form that silently fails', async ({ page }) => {
    await signedIn(page, null);
    await page.route('**/rest/v1/rpc/served_cities*', (route) => route.fulfill(json([])));
    await page.route('**/rest/v1/rpc/redeem_invite*', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'P0001', message: 'INVITE_NOT_FOUND' }),
      }),
    );

    await page.goto('/join/');
    await page.getByLabel('First name').fill('Kim');
    await page.getByLabel('City you live in').fill('Philadelphia');
    await page.getByLabel('Code from the person who invited you').fill('QQQQQQQQ');
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'That code did not work' })).toBeVisible();
    // Still on step 2, with everything they typed still there.
    await expect(page.getByLabel('First name')).toHaveValue('Kim');
  });
});
