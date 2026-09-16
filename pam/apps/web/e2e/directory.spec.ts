import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * The super admin's screen, and the filter in its header.
 *
 * The role existed in the database for weeks with nowhere to go: opening the
 * case manager screen said "this screen is for case managers", which was true
 * and useless. This is the screen that answers it, and the thing worth testing
 * is not that a list renders — it is that the filter actually asks the database
 * a different question, and that everybody else still meets a closed door.
 *
 * Supabase is unreachable from this environment, so the session and the query
 * are stubbed at the network. The real refusal is enforced in the database and
 * proved there (`packages/db` — a member and a case manager both read zero rows
 * from `directory_people`); what a browser can prove is the screen around it.
 */

const USER = '**/auth/v1/user*';
const PROFILES = '**/rest/v1/profiles*';
const NOTIFICATIONS = '**/rest/v1/notifications*';
const DIRECTORY = '**/rest/v1/rpc/directory_people*';

const WILL = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

const PEOPLE = [
  {
    id: 'p1',
    first_name: 'Marcus',
    role: 'member',
    region_name: 'Philadelphia',
    access_status: 'active',
    last_active_at: '2026-09-12T10:00:00Z',
  },
  {
    id: 'p2',
    first_name: 'Alice',
    role: 'provider',
    region_name: 'Philadelphia',
    access_status: 'active',
    last_active_at: null,
  },
  {
    id: 'p3',
    first_name: 'Dana',
    role: 'admin',
    region_name: 'Philadelphia',
    access_status: 'limited',
    last_active_at: '2026-09-11T10:00:00Z',
  },
];

/** Records what the screen actually asked the database for. */
async function signedInAs(
  page: import('@playwright/test').Page,
  role: 'super_admin' | 'admin',
): Promise<string[]> {
  const asked: string[] = [];

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
  await page.route(PROFILES, (route) =>
    route.fulfill(
      json({
        id: WILL,
        role,
        first_name: 'Will',
        region_id: null,
        regions: null,
      }),
    ),
  );
  await page.route(DIRECTORY, async (route) => {
    const body = route.request().postDataJSON() as { p_role: string | null };
    asked.push(body?.p_role ?? 'all');
    const rows = body?.p_role ? PEOPLE.filter((p) => p.role === body.p_role) : PEOPLE;
    await route.fulfill(json(rows));
  });

  return asked;
}

test.describe('everyone, for the person running PAM', () => {
  test('lists the accounts, with what each person is', async ({ page }) => {
    await signedInAs(page, 'super_admin');
    await page.goto('/directory/');

    await expect(page.getByRole('heading', { name: 'Everyone', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Marcus' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alice' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dana' })).toBeVisible();
  });

  test('the filter is in the header, and asks the database a new question', async ({ page }) => {
    // The filter changing the list locally would be a lie the first time the
    // list is longer than one page. It has to reach the query.
    const asked = await signedInAs(page, 'super_admin');
    await page.goto('/directory/');
    await expect(page.getByRole('heading', { name: 'Marcus' })).toBeVisible();

    const filter = page.getByRole('combobox', { name: 'Show' });
    const inHeader = await filter.evaluate((el) => Boolean(el.closest('header')));
    expect(inHeader, 'the filter is not in the header').toBe(true);

    await filter.click();
    await page.getByRole('option', { name: 'Programs' }).click();

    await expect(page.getByRole('heading', { name: 'Alice' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Marcus' })).toHaveCount(0);
    expect(asked, 'the filter never reached the query').toContain('provider');
  });

  test('says how many, so a filter that finds nothing is obviously that', async ({ page }) => {
    await signedInAs(page, 'super_admin');
    await page.goto('/directory/');

    await expect(page.getByText('3 people')).toBeVisible();
  });

  test('a case manager meets a plain statement, not a permission error', async ({ page }) => {
    await signedInAs(page, 'admin');
    await page.goto('/directory/');

    await expect(
      page.getByRole('heading', { name: 'This screen is for the PAM team' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Call PAM/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back' })).toBeVisible();
  });

  test('a super admin previewing "Program" meets the same closed door a program would', async ({ page }) => {
    // The preview a super admin sets on Home is written to sessionStorage
    // (D-108) and every screen now reads it, not just Home's tiles (Will, 16
    // September). This is the screen that used to disagree with the header:
    // the badge said "Viewing as Program" and the list underneath it kept
    // showing every account anyway.
    await page.addInitScript(() => sessionStorage.setItem('pam.view-as', 'provider'));
    await signedInAs(page, 'super_admin');
    await page.goto('/directory/');

    await expect(
      page.getByRole('heading', { name: 'This screen is for the PAM team' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Everyone', exact: true })).toHaveCount(0);
  });

  test('a signed-out visitor is told what this is, and how to get in', async ({ page }) => {
    await page.route(USER, (route) => route.fulfill({ status: 401, body: '{}' }));
    await page.goto('/directory/');

    await expect(page.getByRole('heading', { name: 'Sign in to see this' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('carries no contact details, ever', async ({ page }) => {
    // The database function returns five columns and no phone (0043). This is
    // the other half of that promise: nothing on the screen prints one.
    await signedInAs(page, 'super_admin');
    await page.goto('/directory/');
    await expect(page.getByRole('heading', { name: 'Marcus' })).toBeVisible();

    const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    expect(text, 'a phone number reached the directory').not.toMatch(/\+?\d[\d ()-]{8,}/);
  });

  test('a super admin can look at the screen each role gets', async ({ page }) => {
    // One codebase, four very different screens. A case manager reporting that
    // "the tile is missing" is describing a screen the person running PAM has
    // never had (Will, 14 September).
    await signedInAs(page, 'super_admin');
    await page.route('**/rest/v1/rpc/member_points*', (route) => route.fulfill(json(400)));
    await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
    await page.goto('/');

    // Their own screen first: the directory tile, no caseload tile.
    await expect(page.getByRole('link', { name: /Everyone/ })).toBeVisible();

    await page.getByRole('button', { name: 'Super admin' }).click();
    await page
      .getByRole('menuitem', { name: 'Case manager' })
      .or(page.getByRole('button', { name: 'Case manager' }))
      .first()
      .click();

    // Now the case manager's arrangement. The switcher's own chip is the
    // telling — "Viewing as Case manager" — rather than a second, separate
    // sentence repeating it underneath (Will, 16 September: "no need to show
    // text saying which user, since the top bar does the communicating").
    await expect(page.getByRole('link', { name: /Your people/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Viewing as Case manager/ })).toBeVisible();
  });

  test('switching the view never changes whose data is asked for', async ({ page }) => {
    // The switch is a rendering choice. If it ever started changing the query,
    // it would be impersonation, which is a different product decision and one
    // that would have to be argued in front of the people it is about.
    const asked: string[] = [];
    await signedInAs(page, 'super_admin');
    await page.route('**/rest/v1/rpc/member_points*', (route) => {
      asked.push(String((route.request().postDataJSON() as { p_member_id: string }).p_member_id));
      return route.fulfill(json(400));
    });
    await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));

    await page.goto('/');
    await page.getByRole('button', { name: 'Super admin' }).click();
    await page
      .getByRole('menuitem', { name: 'Member' })
      .or(page.getByRole('button', { name: 'Member' }))
      .first()
      .click();
    await expect(page.getByRole('button', { name: /Viewing as Member/ })).toBeVisible();

    // Every id asked for is the signed-in person's own.
    expect(new Set(asked)).toEqual(new Set([WILL]));
  });

  test('has no WCAG A/AA violations', async ({ page }) => {
    await signedInAs(page, 'super_admin');
    await page.goto('/directory/');
    await expect(page.getByRole('heading', { name: 'Marcus' })).toBeVisible();

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
