import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * Approving a staff request for someone who already has an account (D-491). The
 * decision is the database's (`review_staff_request`); these check what the
 * super admin is told: the role was added to the account they have, a refusal
 * names its reason in staff words, and a super admin is never sent to "Contact Pam".
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const WHO = 'aaaaaaaa-0000-4000-8000-000000000f01';
const CITY = 'bbbbbbbb-0000-4000-8000-000000000f01';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedInAsSuperAdmin(page: Page, wants: 'admin' | 'provider') {
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 't',
      refresh_token: 'r',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) {
      window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
    }
  }, ME);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({ id: ME, role: 'super_admin', first_name: 'Bea', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' }),
    ),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/regions*', (route) => route.fulfill(json([{ id: CITY, name: 'Madeup City' }])));
  await page.route('**/rest/v1/staff_requests*', (route) =>
    route.fulfill(
      json([{ user_id: WHO, wants_role: wants, first_name: 'Pia', last_name: 'Test', city: 'Madeup City', created_at: '2026-09-16T19:58:00Z' }]),
    ),
  );
}

test('the subtitle says what was asked for in plain words', async ({ page }) => {
  await signedInAsSuperAdmin(page, 'provider');
  await page.goto(`/requests/review/?id=${WHO}`);
  await settled(page);
  await expect(page.getByText('Wants to add a program')).toBeVisible();
});

test('approving someone who is already a member says they are now a program lead too', async ({ page }) => {
  await signedInAsSuperAdmin(page, 'provider');
  await page.route('**/rest/v1/rpc/review_staff_request*', (route) => route.fulfill(json({ user_id: WHO, decision: 'approved' })));
  await page.route('**/rest/v1/profile_roles*', (route) => route.fulfill(json([{ role: 'member' }, { role: 'provider' }])));
  await page.goto(`/requests/review/?id=${WHO}`);
  await settled(page);
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, approve' }).click();
  await expect(page.getByText('Pia is now a program lead too')).toBeVisible();
  await expect(page.getByText(/^We texted them that they are in\.$/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Contact Pam/ })).toHaveCount(0);
});

test('a role pair Pam does not allow is explained in staff words, with no call to Pam', async ({ page }) => {
  await signedInAsSuperAdmin(page, 'admin');
  await page.route('**/rest/v1/rpc/review_staff_request*', (route) =>
    route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'ROLE_PAIR_NOT_ALLOWED' }) }),
  );
  await page.goto(`/requests/review/?id=${WHO}`);
  await settled(page);
  await expect(page.getByText('Wants to be a case manager')).toBeVisible();
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, approve' }).click();
  await expect(page.getByText('Pia already has a different kind of account')).toBeVisible();
  await expect(page.getByText(/Deny this request, or text Pia first/)).toBeVisible();
  await expect(page.getByText(/This is not your fault/)).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Contact Pam/ })).toHaveCount(0);
});

test('a request whose person's account was deleted says it is gone, not that it was decided (Iris, D-618)', async ({ page }) => {
  await signedInAsSuperAdmin(page, 'provider');
  await page.route('**/rest/v1/rpc/review_staff_request*', (route) =>
    route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'P0001', message: 'REQUEST_NOT_FOUND' }) }),
  );
  await page.goto(`/requests/review/?id=${WHO}`);
  await settled(page);
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, approve' }).click();
  await expect(page.getByText('This request is no longer here')).toBeVisible();
  await expect(page.getByText(/Pia's account was deleted/)).toBeVisible();
  await expect(page.getByText('This request was already decided')).toHaveCount(0);
  await expect(page.getByRole('alert').filter({ hasText: "It's not your fault" })).toHaveCount(0);
});

test('any other failure is Pam failing: the small alert at the bottom, logged, and no Contact Pam (D-616)', async ({ page }) => {
  await signedInAsSuperAdmin(page, 'provider');
  const reports: unknown[] = [];
  await page.route('**/rest/v1/rpc/report_app_error*', (route) => {
    reports.push(route.request().postDataJSON());
    return route.fulfill(json(null));
  });
  await page.route('**/rest/v1/rpc/review_staff_request*', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'boom' }) }),
  );
  await page.goto(`/requests/review/?id=${WHO}`);
  await settled(page);
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, approve' }).click();
  await expect(page.getByRole('alert').filter({ hasText: "That didn't go through. It's not your fault, so try again." })).toBeVisible();
  await expect(page.getByText('We could not save that')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Approve' })).toBeEnabled();
  await expect(page.getByRole('link', { name: /Contact Pam/ })).toHaveCount(0);
  await expect.poll(() => reports.length).toBe(1);
  expect(reports[0]).toMatchObject({ p_action: 'requests.review' });
});
