import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * The case manager's screen.
 *
 * Supabase is unreachable from this environment, so the session and the queries
 * are stubbed at the network. What is being tested is the screen's behaviour
 * around those answers — above all, that it degrades into an explanation rather
 * than a blank page for every way a person can arrive here wrongly.
 */

const USER = '**/auth/v1/user*';
const PROFILES = '**/rest/v1/profiles*';
const POINTS = '**/rest/v1/rpc/member_points*';
const INVITE = '**/rest/v1/rpc/create_invite*';
const CONTROLS = '**/rest/v1/access_controls*';
const NOTIFICATIONS = '**/rest/v1/notifications*';

const ADMIN_ID = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

/**
 * Puts a session where the Supabase client looks for one.
 *
 * Without this the client never asks the network at all — it finds no stored
 * session and answers "signed out" locally — so stubbing the auth endpoint
 * alone tests nothing. The storage key carries the project reference, and CI
 * builds against a deliberately fake project (D-048), so both keys are seeded.
 */
async function seedSession(page: import('@playwright/test').Page) {
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
  }, ADMIN_ID);
}

async function signedInAs(
  page: import('@playwright/test').Page,
  role: 'admin' | 'member',
  members: unknown[] = [],
  controls: unknown[] = [],
  notifications: unknown[] = [],
) {
  await seedSession(page);
  await page.route(NOTIFICATIONS, (route) => route.fulfill(json(notifications)));
  await page.route(CONTROLS, (route) => route.fulfill(json(controls)));
  await page.route(USER, (route) => route.fulfill(json({ id: ADMIN_ID, phone: '12673095265' })));
  await page.route(POINTS, (route) => route.fulfill(json(250)));
  await page.route(PROFILES, (route) => {
    const url = route.request().url();
    // The profile lookup filters on id; the caseload filters on role.
    if (url.includes('role=eq.member')) return route.fulfill(json(members));
    return route.fulfill(
      json({
        id: ADMIN_ID,
        role,
        first_name: 'Will',
        region_id: '0195b1c0-0000-4000-8000-000000000001',
        regions: { name: 'Philadelphia' },
      }),
    );
  });
}

test.describe('the case manager screen', () => {
  test('a signed-out visitor is told what this is, and how to get in', async ({ page }) => {
    await page.route(USER, (route) => route.fulfill({ status: 401, body: '{}' }));
    await page.goto('/admin/');

    await expect(page.getByRole('heading', { name: 'Sign in to see your people' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('a member who lands here is not scolded', async ({ page }) => {
    await signedInAs(page, 'member');
    await page.goto('/admin/');

    // Plain statement of what the screen is, plus a way to fix it if wrong —
    // never "permission denied", which tells somebody they did something wrong.
    await expect(page.getByRole('heading', { name: 'This screen is for case managers' })).toBeVisible();
    await expect(page.getByText(/does not open this/)).toBeVisible();
    await expect(page.getByRole('link', { name: /Call PAM/ })).toBeVisible();
  });

  test('an admin sees their caseload', async ({ page }) => {
    await signedInAs(
      page,
      'admin',
      [
        { id: 'm1', first_name: 'Marcus', access_status: 'active', last_active_at: '2026-09-10T14:00:00Z' },
        { id: 'm2', first_name: 'Tanya', access_status: 'limited', last_active_at: null },
      ],
      [{ subject_id: 'm2', feature: 'chat' }],
    );
    await page.goto('/admin/');

    await expect(page.getByRole('heading', { name: 'Marcus' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tanya' })).toBeVisible();
    await expect(page.getByText('Has not opened PAM yet')).toBeVisible();

    // An avatar per person, so the caseload reads as people rather than rows.
    // No photo is fetched: a member's picture is not on the §4.1 list, so the
    // initial stands in — PAM's own rendering of a name the admin already has.
    await expect(page.getByRole('img', { name: 'Marcus' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Tanya' })).toBeVisible();
  });

  test('an empty caseload explains itself', async ({ page }) => {
    await signedInAs(page, 'admin', []);
    await page.goto('/admin/');
    await expect(page.getByRole('heading', { name: 'Nobody on your list yet' })).toBeVisible();
  });

  test('the invite code is the biggest thing on the screen once it exists', async ({ page }) => {
    await signedInAs(page, 'admin', []);
    await page.route(INVITE, (route) =>
      route.fulfill(
        json({ code: '9T3YTVMT', expires_at: '2026-10-12T21:09:28Z', role: 'member' }),
      ),
    );
    await page.goto('/admin/');
    await page.getByRole('button', { name: 'Someone coming home' }).click();

    const code = page.getByText('9T3YTVMT');
    await expect(code).toBeVisible();
    // It gets read down a phone line, so it has to be legible across a room.
    const size = await code.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(32);
    await expect(page.getByText(/Works until/)).toBeVisible();
  });

  test('a failed invite is explained, not swallowed', async ({ page }) => {
    await signedInAs(page, 'admin', []);
    await page.route(INVITE, (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto('/admin/');
    await page.getByRole('button', { name: 'Someone coming home' }).click();

    await expect(page.getByRole('heading', { name: 'We could not make a code' })).toBeVisible();
  });

  test('the status chip says what is actually switched off', async ({ page }) => {
    // "Some things turned off" is the member's wording and answers nothing on a
    // caseload: off how, and which? The case manager's next move is to explain
    // it or undo it, and both need the specifics.
    await signedInAs(
      page,
      'admin',
      [
        { id: 'm1', first_name: 'Marcus', access_status: 'limited', last_active_at: null },
        { id: 'm2', first_name: 'Tanya', access_status: 'limited', last_active_at: null },
        { id: 'm3', first_name: 'Dee', access_status: 'suspended', last_active_at: null },
      ],
      [
        { subject_id: 'm1', feature: 'chat' },
        { subject_id: 'm2', feature: 'chat' },
        { subject_id: 'm2', feature: 'map' },
        { subject_id: 'm2', feature: 'points' },
      ],
    );
    await page.goto('/admin/');
    await expect(page.getByRole('heading', { name: 'Marcus' })).toBeVisible();

    await expect(page.getByText('Messages off')).toBeVisible();
    // Past two, the names stop fitting a chip and the detail belongs on the
    // member's own screen.
    await expect(page.getByText('3 things off')).toBeVisible();
    await expect(page.getByText('Paused')).toBeVisible();
    await expect(page.getByText('Some things turned off')).toHaveCount(0);
  });

  test('the transparency promise is shown to the admin, not only to members', async ({ page }) => {
    await signedInAs(page, 'admin', []);
    await page.goto('/admin/');

    // §4.1: members agree to this list at onboarding. An admin should be looking
    // at the same words, so the promise is visible from both sides.
    await expect(page.getByRole('heading', { name: 'What you can see' })).toBeVisible();
    await expect(page.getByText(/Not their messages/)).toBeVisible();
  });

  test('nothing outside the caseload contract is on the page', async ({ page }) => {
    await signedInAs(page, 'admin', [
      { id: 'm1', first_name: 'Marcus', access_status: 'active', last_active_at: '2026-09-10T14:00:00Z' },
    ]);
    await page.goto('/admin/');
    await expect(page.getByRole('heading', { name: 'Marcus' })).toBeVisible();

    // Scoped to the member's own card, because the page also carries the
    // promise *not* to show these things, which says the words out loud.
    const card = page.locator('.astryx-card').filter({ hasText: 'Marcus' });
    const text = (await card.innerText()).toLowerCase();

    // §4.1 forbids these outright. A careless `select('*')` is what this catches.
    expect(text).not.toContain('message');
    expect(text).not.toContain('buddy');
    // A phone number is not on the §4.1 list either.
    expect(text).not.toMatch(/\+?1?\d{10}/);
  });

  test('has no WCAG A/AA violations', async ({ page }) => {
    await signedInAs(
      page,
      'admin',
      [{ id: 'm1', first_name: 'Marcus', access_status: 'limited', last_active_at: null }],
      [{ subject_id: 'm1', feature: 'chat' }],
    );
    await page.goto('/admin/');
    await expect(page.getByRole('heading', { name: 'Marcus' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.error(
        results.violations
          .map((v) => `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.html).join('\n  ')}`)
          .join('\n\n'),
      );
    }
    expect(results.violations).toEqual([]);
  });
});


/**
 * The notification bar (A7 / D-080).
 *
 * A case manager is told when a place one of their people saved is flagged, and
 * when a message in their caseload is reported. What is tested here is not that
 * a list renders — it is that the list says enough to act on and never more
 * than §4.1 allows.
 */
test.describe('what has happened that a case manager has to act on', () => {
  const notifications = [
    {
      id: 'n1',
      kind: 'service_flagged',
      body_key: 'notify.service_flagged',
      body_vars: { reason: 'closed' },
      subject_type: 'service',
      subject_id: 's1',
      created_at: new Date().toISOString(),
      read_at: null,
    },
    {
      id: 'n2',
      kind: 'message_reported',
      body_key: 'notify.message_reported',
      body_vars: {},
      subject_type: 'report',
      subject_id: 'r1',
      created_at: new Date(Date.now() - 86_400_000).toISOString(),
      read_at: '2026-09-13T00:00:00Z',
    },
  ];

  test('the bell says how many are new, and leads to the list', async ({ page }) => {
    await signedInAs(page, 'admin', [], [], notifications);
    await page.goto('/admin/');

    // The count is a dot beside the bell rather than a "1 new" chip (Will, 13
    // September), so the number lives in the link's accessible name — where a
    // screen reader still hears it and this test can still check it.
    await expect(page.getByRole('link', { name: 'Notifications, 1 new' })).toHaveAttribute(
      'href',
      '/notifications/',
    );
  });

  test('the list is its own screen, with a way back', async ({ page }) => {
    await signedInAs(page, 'admin', [], [], notifications);
    await page.goto('/notifications/');

    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
    await expect(page.getByText('Someone reported a place: closed')).toBeVisible();
    await expect(page.getByText('Someone said a message is not safe')).toBeVisible();
    // §0: never dead-end.
    await expect(page.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/admin/');
    await expect(page.getByRole('link', { name: 'Get help' })).toBeVisible();
  });

  test('dates the new one as today rather than making somebody do arithmetic', async ({ page }) => {
    await signedInAs(page, 'admin', [], [], notifications);
    await page.goto('/notifications/');

    await expect(page.getByText('Today')).toBeVisible();
    await expect(page.getByText('Yesterday')).toBeVisible();
  });

  test('carries no words anybody wrote', async ({ page }) => {
    // §4.1: a notification is a nudge to look, never a copy of the thing. The
    // message body lives behind the review screen and its warning, and must not
    // leak into this list.
    await signedInAs(page, 'admin', [], [], notifications);
    await page.goto('/notifications/');

    const body = await page.locator('main').innerText();
    expect(body).not.toMatch(/"|“|”/);
  });

  test('says plainly when there is nothing', async ({ page }) => {
    await signedInAs(page, 'admin', [], [], []);
    await page.goto('/notifications/');

    await expect(page.getByText('Nothing needs you right now.')).toBeVisible();
  });

  test('has no WCAG A/AA violations', async ({ page }) => {
    await signedInAs(page, 'admin', [], [], notifications);
    await page.goto('/notifications/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
