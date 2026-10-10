import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * Inviting somebody and deciding who may be staff, on pages of their own
 * (D-444): a list of kinds → one page per kind; a list of requests → one page
 * per request, with the decision pinned to the foot.
 *
 * Supabase is unreachable here, so the session and the queries are stubbed at
 * the network (see admin.spec.ts for why the session is seeded).
 */

const USER = '**/auth/v1/user*';
const PROFILES = '**/rest/v1/profiles*';
const REGIONS = '**/rest/v1/regions*';
const INVITE = '**/rest/v1/rpc/create_invite*';
const STAFF_INVITE = '**/rest/v1/rpc/create_staff_invite*';
const REVIEW = '**/rest/v1/rpc/review_staff_request*';
const STAFF_REQUESTS = '**/rest/v1/staff_requests*';
const CONTROLS = '**/rest/v1/access_controls*';
const NOTIFICATIONS = '**/rest/v1/notifications*';
const ENROLLMENTS = '**/rest/v1/enrollments*';
const POINTS = '**/rest/v1/rpc/member_points*';

const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const PHILLY = '0195b1c0-0000-4000-8000-000000000001';
const PITTSBURGH = '0195b1c0-0000-4000-8000-000000000002';

const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedInAs(page: Page, role: 'admin' | 'provider' | 'super_admin', regions: unknown[] = []) {
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
  await page.route(ENROLLMENTS, (route) => route.fulfill(json([])));
  await page.route(USER, (route) => route.fulfill(json({ id: ME, phone: '12673095265' })));
  await page.route(POINTS, (route) => route.fulfill(json(250)));
  await page.route(REGIONS, (route) => route.fulfill(json(regions)));
  await page.route(PROFILES, (route) =>
    route.fulfill(
      json({
        id: ME,
        role,
        first_name: 'Will',
        // A super admin has no city of their own (0077).
        region_id: role === 'super_admin' ? null : PHILLY,
        regions: role === 'super_admin' ? null : { name: 'Philadelphia' },
      }),
    ),
  );
}

const CITIES = [
  { id: PHILLY, name: 'Philadelphia' },
  { id: PITTSBURGH, name: 'Pittsburgh' },
];

test.describe('inviting somebody, on a page of its own (D-444)', () => {
  test('the list of kinds leads to one page per kind, and the city is the super admin\'s to pick', async ({ page }) => {
    await signedInAs(page, 'super_admin', CITIES);
    const asked: Record<string, unknown>[] = [];
    // A program is staff: invited with an email, through its own door (0086, D-441).
    await page.route(STAFF_INVITE, async (route) => {
      asked.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill(json({ code: '9T3YTVMT', expires_at: '2026-10-12T21:09:28Z', role: 'provider' }));
    });

    await page.goto('/invite/');
    // A list of rows that are links — no form here, nothing swapped in place.
    await page.getByRole('link', { name: /^Invite a program/ }).click();
    await expect(page).toHaveURL(/\/invite\/new\/\?role=provider/);
    await expect(page.getByRole('heading', { name: 'A link for a program', level: 1 })).toBeVisible();

    // Two cities and none of the super admin's own: Pam asks, and asks before sending.
    await expect(page.getByRole('radio', { name: 'Pittsburgh' })).toBeVisible();
    await page.getByLabel('Their first name').fill('Dana');
    await page.getByLabel('Their mobile number').fill('215 555 0111');
    await page.getByLabel('Their email').fill('dana@example.org');
    await page.getByRole('button', { name: 'Create link' }).click();
    await expect(page.getByText('Pick a city first.')).toBeVisible();
    expect(asked).toHaveLength(0);

    await page.getByRole('radio', { name: 'Pittsburgh' }).check();
    await page.getByRole('button', { name: 'Create link' }).click();
    await expect.poll(() => asked.length).toBe(1);
    expect(asked[0]).toMatchObject({ p_role: 'provider', p_first_name: 'Dana', p_email: 'dana@example.org', p_region_id: PITTSBURGH });
    await expect(page.getByText(/\/signin\/\?invite=9T3YTVMT&as=program/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send the link' })).toBeVisible();
  });

  test('with one city there is nothing to pick, and it is sent', async ({ page }) => {
    await signedInAs(page, 'super_admin', [CITIES[0]]);
    const asked: Record<string, unknown>[] = [];
    await page.route(INVITE, async (route) => {
      asked.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill(json({ code: '9T3YTVMT', expires_at: '2026-10-12T21:09:28Z', role: 'member' }));
    });
    await page.goto('/invite/new/?role=member');
    await expect(page.getByRole('radio')).toHaveCount(0);
    await page.getByLabel('Their first name').fill('Rosa');
    await page.getByLabel('Their mobile number').fill('215 555 0111');
    await page.getByRole('button', { name: 'Create link' }).click();
    await expect.poll(() => asked.length).toBe(1);
    expect(asked[0]).toMatchObject({ p_role: 'member', p_region_id: PHILLY });
  });

  test('a case manager is never asked for a city, and a program may not invite a case manager', async ({ page }) => {
    await signedInAs(page, 'admin');
    const asked: Record<string, unknown>[] = [];
    await page.route(INVITE, async (route) => {
      asked.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill(json({ code: '9T3YTVMT', expires_at: '2026-10-12T21:09:28Z', role: 'member' }));
    });
    await page.goto('/invite/new/?role=member');
    await expect(page.getByRole('radio')).toHaveCount(0);
    await page.getByLabel('Their first name').fill('Rosa');
    await page.getByLabel('Their mobile number').fill('215 555 0111');
    await page.getByRole('button', { name: 'Create link' }).click();
    await expect.poll(() => asked.length).toBe(1);
    expect(asked[0]).not.toHaveProperty('p_region_id');

    const lead = await page.context().newPage();
    await signedInAs(lead, 'provider');
    await lead.goto('/invite/new/?role=admin');
    await expect(lead).toHaveURL(/\/invite\/$/);
  });

  test('Everyone has no card of invite buttons: two rows lead to the pages that do it', async ({ page }) => {
    await signedInAs(page, 'super_admin', CITIES);
    await page.route('**/rest/v1/rpc/directory_people*', (route) => route.fulfill(json([])));
    await page.goto('/directory/');
    await expect(page.getByRole('link', { name: 'Invite someone' })).toHaveAttribute('href', /\/invite\/$/);
    await expect(page.getByRole('link', { name: 'Requests' })).toHaveAttribute('href', /\/requests\/$/);
    await expect(page.getByRole('button', { name: 'A case manager' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Someone who runs a program' })).toHaveCount(0);
  });

  test('the invite pages have no WCAG A/AA violations', async ({ page }) => {
    await signedInAs(page, 'super_admin', CITIES);
    await page.goto('/invite/new/?role=member');
    await expect(page.getByRole('heading', { name: 'A link for a member', level: 1 })).toBeVisible();
    await settled(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});

const REQUEST = {
  user_id: '11111111-1111-4111-8111-111111111111',
  wants_role: 'provider',
  first_name: 'Andre',
  last_name: 'Wells',
  city: 'Philadelphia',
  created_at: '2026-10-08T15:00:00Z',
  program_name: 'Example Reentry Kitchen',
  program_category: 'family_services',
  program_subcategory: null,
  program_description: 'A kitchen.',
  program_address: '123 Main St',
  program_phone: null,
  program_website: null,
};

test.describe('who may be staff, one request to a page (D-444)', () => {
  test('a row opens the request; the decision is pinned to the foot and carries the city', async ({ page }) => {
    await signedInAs(page, 'super_admin', CITIES);
    await page.route(STAFF_REQUESTS, (route) => route.fulfill(json([REQUEST])));
    const decided: Record<string, unknown>[] = [];
    await page.route(REVIEW, async (route) => {
      decided.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill(json(null));
    });

    await page.goto('/requests/');
    // A row, not a card of buttons: nothing can be decided from the list.
    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
    await page.getByRole('link', { name: /Andre Wells/ }).click();
    await expect(page).toHaveURL(/\/requests\/review\/\?id=11111111/);
    await expect(page.getByRole('heading', { name: 'Andre Wells', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Example Reentry Kitchen/ })).toHaveAttribute('href', /\/requests\/program\//);

    // Two cities: approving asks which, and says so before anything is sent.
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText('Pick a city first.')).toBeVisible();
    expect(decided).toHaveLength(0);
    await page.getByRole('radio', { name: 'Philadelphia' }).check();
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect.poll(() => decided.length).toBe(1);
    expect(decided[0]).toMatchObject({ p_user_id: REQUEST.user_id, p_decision: 'approved', p_region_id: PHILLY });
    await expect(page).toHaveURL(/\/requests\/$/);
  });

  test('Deny needs no city', async ({ page }) => {
    await signedInAs(page, 'super_admin', CITIES);
    await page.route(STAFF_REQUESTS, (route) => route.fulfill(json([REQUEST])));
    const decided: Record<string, unknown>[] = [];
    await page.route(REVIEW, async (route) => {
      decided.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill(json(null));
    });
    await page.goto(`/requests/review/?id=${REQUEST.user_id}`);
    await page.getByRole('button', { name: 'Deny' }).click();
    await expect.poll(() => decided.length).toBe(1);
    expect(decided[0]).toMatchObject({ p_user_id: REQUEST.user_id, p_decision: 'denied' });
    expect(decided[0]).not.toHaveProperty('p_region_id');
  });

  test('a request already decided says so, and the review page has no WCAG A/AA violations', async ({ page }) => {
    await signedInAs(page, 'super_admin', CITIES);
    await page.route(STAFF_REQUESTS, (route) => route.fulfill(json([REQUEST])));
    await page.goto('/requests/review/?id=00000000-0000-4000-8000-000000000000');
    await expect(page.getByText('This request has already been decided')).toBeVisible();

    await page.goto(`/requests/review/?id=${REQUEST.user_id}`);
    await expect(page.getByRole('heading', { name: 'Andre Wells', level: 1 })).toBeVisible();
    await settled(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
