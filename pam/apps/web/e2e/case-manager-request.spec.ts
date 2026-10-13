import { expect, test, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * A case manager asks to use Pam from the website (D-568). Supabase is stubbed at the network.
 *
 * The rules this holds to:
 *   - The page asks for the phone and the code before anything else.
 *   - A sign-in with no profile is asked for name, city, where they work and a work email, and asking
 *     makes no profile (no member setup is started).
 *   - A sign-in whose case manager request is waiting or refused is sent to it from Join, never into
 *     setting up a member's account; a refused one can ask again with what it sent before.
 *   - Somebody with an account is told to contact Pam instead.
 *   - The super admin sees where they work and the work email on the request.
 */
const ASKER = 'c0000000-0000-4000-8000-000000000568';
const ME = 'c1000000-0000-4000-8000-000000000568';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedInAs(page: Page, userId: string, profile: Record<string, unknown> | null, request: Record<string, unknown> | null) {
  await page.addInitScript((id) => {
    const session = {
      access_token: 't',
      refresh_token: 'r',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, userId);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: userId })));
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/access_controls*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/enrollments*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/staff_requests*', (route) => route.fulfill(json(request ? [request] : [])));
  await page.route('**/rest/v1/rpc/served_cities*', (route) => route.fulfill(json([{ city: 'Philadelphia' }])));
  await page.route('**/rest/v1/rpc/pending_invite_for_me*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json(profile ? { id: userId, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', region_id: null, regions: null, ...profile } : null)),
  );
}

const waiting = { wants_role: 'admin', decision: null, first_name: 'Priya', last_name: 'Nair', city: 'Philadelphia', organization: 'Northside Reentry Center' };

test('signed out: the page says what it is and asks for the phone first', async ({ page }) => {
  await page.goto('/join/case-manager/');
  await expect(page.getByRole('heading', { name: 'Join as a case manager', level: 1 })).toBeVisible();
  await expect(page.getByText(/Ask to use Pam with the people you work with/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start with your phone number', level: 2 })).toBeVisible();
  await expect(page.getByLabel('Your phone number')).toBeVisible();
  await expect(page.getByLabel('Where you work')).toHaveCount(0);
});

test('a sign-in with no account asks once, and no member setup starts', async ({ page }) => {
  await signedInAs(page, ASKER, null, null);
  const sent: Record<string, unknown>[] = [];
  let memberWrites = 0;
  await page.route('**/rest/v1/rpc/start_membership*', (route) => {
    memberWrites += 1;
    return route.fulfill(json({}));
  });
  await page.route('**/rest/v1/rpc/request_case_manager_access*', (route) => {
    sent.push(route.request().postDataJSON() as Record<string, unknown>);
    return route.fulfill(json('received'));
  });
  await page.goto('/join/case-manager/');
  await expect(page.getByRole('heading', { name: 'About you', level: 1 })).toBeVisible();
  await page.getByLabel('First name').fill('Priya');
  await page.getByLabel('Last name').fill('Nair');
  await page.getByLabel('Where you work').fill('Northside Reentry Center');
  await page.getByLabel('Your work email').fill('priya at work');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'That does not look like an email address.' })).toBeVisible();
  expect(sent).toHaveLength(0);

  await page.getByLabel('Your work email').fill('priya.nair@example.org');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('heading', { name: 'We got your request', level: 1 })).toBeVisible();
  await expect(page.getByText(/checks every request by hand/)).toBeVisible();
  await expect(page.getByText(/We will text you/)).toHaveCount(0);
  expect(sent[0]).toMatchObject({
    p_first_name: 'Priya',
    p_last_name: 'Nair',
    p_city: 'Philadelphia',
    p_organization: 'Northside Reentry Center',
    p_work_email: 'priya.nair@example.org',
    p_language: 'en',
  });
  expect(memberWrites).toBe(0);
});

test('a sign-in whose request waits goes to it from Sign in and from Join, not to setting up a member', async ({ page }) => {
  await signedInAs(page, ASKER, null, waiting);
  await page.goto('/join/');
  await expect(page).toHaveURL(/\/join\/case-manager\/$/);
  await expect(page.getByRole('heading', { name: 'Someone on the Pam team is still checking', level: 1 })).toBeVisible();
  await expect(page.getByLabel('First name')).toHaveCount(0);
  await page.goto('/signin/');
  await expect(page).toHaveURL(/\/join\/case-manager\/$/);
});

test('refused: it can ask again, with what it sent before', async ({ page }) => {
  await signedInAs(page, ASKER, null, { ...waiting, decision: 'denied' });
  await page.goto('/join/case-manager/');
  await expect(page.getByRole('heading', { name: 'We could not say yes this time', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contact Pam' })).toBeVisible();
  await page.getByRole('button', { name: 'Ask again' }).click();
  await expect(page.getByLabel('Where you work')).toHaveValue('Northside Reentry Center');
  await expect(page.getByLabel('First name')).toHaveValue('Priya');
  await expect(page.getByLabel('Your work email')).toHaveValue('');
});

test('somebody with an account is told to contact Pam', async ({ page }) => {
  await signedInAs(page, ASKER, { role: 'member', first_name: 'Mo' }, null);
  await page.goto('/join/case-manager/');
  await expect(page.getByRole('heading', { name: 'You already have an account', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contact Pam' })).toBeVisible();
});

test('the super admin sees where they work and the work email', async ({ page }) => {
  await signedInAs(page, ME, { role: 'super_admin', first_name: 'Bea' }, {
    user_id: ASKER,
    ...waiting,
    work_email: 'priya.nair@example.org',
    created_at: new Date().toISOString(),
  });
  await page.route('**/rest/v1/regions*', (route) => route.fulfill(json([{ id: 'bbbbbbbb-0000-4000-8000-000000000568', name: 'Philadelphia' }])));
  await page.goto('/requests/');
  await expect(page.getByRole('link', { name: /Priya Nair/ })).toContainText('Northside Reentry Center');
  await page.goto(`/requests/review/?id=${ASKER}`);
  await settled(page);
  await expect(page.getByText('Wants to be a case manager')).toBeVisible();
  await expect(page.getByText('Works at: Northside Reentry Center')).toBeVisible();
  await expect(page.getByText('Work email: priya.nair@example.org')).toBeVisible();
});
