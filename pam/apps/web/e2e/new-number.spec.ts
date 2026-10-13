import { expect, test, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * Moving an account to a new phone number (D-567; card a73). Supabase is stubbed at the network.
 *
 * The rules this holds to:
 *   - The way in is "New number?" beside Privacy on Sign in (and not on Join).
 *   - A sign-in made only with the new number (no profile) is never sent to Join, and asking makes no
 *     profile: it sees only its request — sent, still checking, moved or not moved.
 *   - The super admin (who decides every request, for now) sees what was typed beside the account, a
 *     mismatch marked, and cannot approve without "I spoke to this person"; a yes then moves the sign-in.
 *   - A super admin's account never moves: only Deny.
 */
const TEMP = '7e000000-0000-4000-8000-000000000567';
const BOSS = '7b000000-0000-4000-8000-000000000567';
const REQUEST = '7a1f0000-0000-4000-8000-000000000567';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedInAs(page: Page, userId: string, profile: Record<string, unknown> | null) {
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
  await page.route('**/rest/v1/staff_requests*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/served_cities*', (route) => route.fulfill(json([{ city: 'Philadelphia' }])));
  await page.route('**/rest/v1/rpc/pending_invite_for_me*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json(profile ? { id: userId, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', region_id: null, regions: null, ...profile } : null)),
  );
}

function detail(over: Record<string, unknown> = {}) {
  return [
    {
      id: REQUEST,
      status: 'waiting',
      created_at: new Date(Date.now() - 3_600_000).toISOString(),
      first_name: 'Rosa',
      last_name: 'Diaz',
      city: 'Philadelphia',
      who_knows: 'Tanya',
      new_phone: '+12155550188',
      old_phone_last4: '0142',
      has_account: true,
      is_protected: false,
      is_staff: false,
      account_first: 'Rosa',
      account_last: 'Díaz',
      account_city: 'Philadelphia',
      invited_by_name: 'Tanya',
      last_active_at: null,
      must_speak: true,
      ...over,
    },
  ];
}

test.describe('the way in', () => {
  test('Sign in has "New number?" beside Privacy, and it opens the page that asks for the new number', async ({ page }) => {
    await page.goto('/signin/');
    const link = page.getByRole('link', { name: 'New number?' });
    await expect(link).toHaveAttribute('href', '/signin/new-number/');
    await page.goto('/signin/new-number/');
    await expect(page.getByRole('heading', { name: 'Your new number', level: 1 })).toBeVisible();
    await expect(page.getByLabel('Your phone number')).toBeVisible();
  });
});

test.describe('the temporary sign-in (the new number only, no profile)', () => {
  test('asks for the old account, sends it, and is told the same thing whatever it typed — never Join', async ({ page }) => {
    await signedInAs(page, TEMP, null);
    await page.route('**/rest/v1/rpc/my_number_change*', (route) => route.fulfill(json([])));
    const sent: Record<string, unknown>[] = [];
    let profileWrites = 0;
    await page.route('**/rest/v1/rpc/start_membership*', (route) => {
      profileWrites += 1;
      return route.fulfill(json({}));
    });
    await page.route('**/rest/v1/rpc/submit_number_change*', (route) => {
      sent.push(route.request().postDataJSON() as Record<string, unknown>);
      return route.fulfill(json('received'));
    });
    await page.goto('/signin/new-number/');
    await expect(page.getByRole('heading', { name: 'Your account', level: 1 })).toBeVisible();
    await page.getByLabel('Your old phone number').fill('(215) 555-0142');
    await page.getByLabel('First name').fill('Rosa');
    await page.getByLabel('Last name').fill('Diaz');
    await page.getByLabel(/Who on Pam knows you/).fill('Tanya');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByRole('heading', { name: 'We got your request', level: 1 })).toBeVisible();
    expect(sent[0]).toMatchObject({ p_old_phone: '(215) 555-0142', p_first_name: 'Rosa', p_last_name: 'Diaz', p_city: 'Philadelphia', p_who_knows: 'Tanya' });
    expect(profileWrites).toBe(0);
    await expect(page).toHaveURL(/\/signin\/new-number\/$/);
  });

  test('a sign-in that asked goes to its request from Sign in and from Join, not to setting up an account', async ({ page }) => {
    await signedInAs(page, TEMP, null);
    await page.route('**/rest/v1/rpc/my_number_change*', (route) => route.fulfill(json([{ status: 'waiting', created_at: new Date().toISOString() }])));
    await page.goto('/signin/');
    await expect(page).toHaveURL(/\/signin\/new-number\/$/);
    await expect(page.getByRole('heading', { name: 'A person at Pam is still checking', level: 1 })).toBeVisible();
    await page.goto('/join/');
    await expect(page).toHaveURL(/\/signin\/new-number\/$/);
    await expect(page.getByLabel('First name')).toHaveCount(0);
  });

  test('moved: sign in again; not moved: Contact Pam', async ({ page }) => {
    await signedInAs(page, TEMP, null);
    let status = 'approved';
    await page.route('**/rest/v1/rpc/my_number_change*', (route) => route.fulfill(json([{ status, created_at: new Date().toISOString() }])));
    await page.goto('/signin/new-number/');
    await expect(page.getByRole('heading', { name: 'Your account is moving to this number', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    status = 'denied';
    await page.reload();
    await expect(page.getByRole('heading', { name: 'We could not move your account', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact Pam' })).toHaveAttribute('href', /\/support\/$/);
  });
});

test.describe('the person who decides', () => {
  test('the super admin sees it on Requests, marked as a new number', async ({ page }) => {
    await signedInAs(page, BOSS, { role: 'super_admin', first_name: 'Will' });
    await page.route('**/rest/v1/rpc/number_changes_to_decide*', (route) =>
      route.fulfill(
        json([{ id: REQUEST, first_name: 'Rosa', last_name: 'Diaz', city: 'Philadelphia', created_at: new Date().toISOString(), is_protected: false }]),
      ),
    );
    await page.goto('/requests/');
    await expect(page.getByRole('link', { name: /Rosa Diaz/ })).toHaveAttribute('href', `/requests/number/?id=${REQUEST}`);
    await expect(page.getByText(/New number · /)).toBeVisible();
  });

  test('typed beside the account, the mismatch marked; Approve waits for "I spoke to this person"; a yes moves the sign-in', async ({ page }) => {
    await signedInAs(page, BOSS, { role: 'super_admin', first_name: 'Will' });
    await page.route('**/rest/v1/rpc/number_change_detail*', (route) => route.fulfill(json(detail())));
    const decided: Record<string, unknown>[] = [];
    await page.route('**/rest/v1/rpc/decide_number_change*', (route) => {
      decided.push(route.request().postDataJSON() as Record<string, unknown>);
      return route.fulfill(json('approved'));
    });
    const moved: unknown[] = [];
    await page.route('**/functions/v1/move-number*', (route) => {
      moved.push(route.request().postDataJSON());
      return route.fulfill(json({ moved: true }));
    });
    await page.goto(`/requests/number/?id=${REQUEST}`);
    await settled(page);
    await expect(page.getByText('They typed: Diaz')).toBeVisible();
    await expect(page.getByText('The account says: Díaz')).toBeVisible();
    await expect(page.getByText('These do not match')).toHaveCount(1);
    await expect(page.getByText('New number: +12155550188')).toBeVisible();
    await expect(page.getByText('Old number ends in 0142')).toBeVisible();

    const approve = page.getByRole('button', { name: 'Approve' });
    await expect(approve).toBeDisabled();
    await page.getByRole('checkbox', { name: "I spoke to this person and I'm sure it's them." }).check();
    await approve.click();
    await expect(page.getByText('They can sign in with the new number now.')).toBeVisible();
    expect(decided[0]).toMatchObject({ p_id: REQUEST, p_decision: 'approved', p_spoke: true });
    expect(moved[0]).toEqual({ requestId: REQUEST });
  });

  test("a super admin's account: only Deny", async ({ page }) => {
    await signedInAs(page, BOSS, { role: 'super_admin', first_name: 'Will' });
    await page.route('**/rest/v1/rpc/number_change_detail*', (route) => route.fulfill(json(detail({ is_protected: true }))));
    await page.goto(`/requests/number/?id=${REQUEST}`);
    await expect(page.getByRole('heading', { name: 'This account cannot be moved' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Deny' })).toBeEnabled();
  });

});
