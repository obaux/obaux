import { expect, test, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * Iris's super admin pass (docs/research/2026-10-15-super-admin-flow.md), the Accounts & invites part.
 * Supabase is stubbed at the network. (W1, the confirm before each decision and the line after it, is in
 * invite.spec.ts, staff-request-approve.spec.ts and programs-review.spec.ts.)
 *   P1  Home's "Programs to check" row has a count; a request says "City:", not "Typed:".
 *   P2  Programs to check, opened from Home, goes back to Home.
 *   P3  "To look at" counts only what is in review, not a withdrawn one.
 *   P4  a program's phone and website open from the page.
 *   P5  each "Demo view" switch says whose it is.
 *   P6  Profile's list of work is named for what it is.
 *   P7  the invites log's states are not 12px.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const program = (over: Record<string, unknown>) => ({
  id: 'sub-1',
  service_id: 'svc-1',
  kind: 'new',
  status: 'in_review',
  sent_at: '2026-10-06T10:00:00Z',
  days_waiting: 4,
  program_name: 'Hearth Kitchen Training',
  details: {
    name: 'Hearth Kitchen Training',
    category: 'workforce',
    phone: '+12155550142',
    website: 'hearthkitchen.example.org',
    address: '1234 Market St',
  },
  changes_note: null,
  lead_name: 'Lou',
  replaces_id: null,
  replaced_by: null,
  withdrawn_at: null,
  ...over,
});

async function superAdmin(page: Page) {
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 't',
      refresh_token: 'r',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, ME);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({ id: ME, role: 'super_admin', first_name: 'Will', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' }),
    ),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/access_controls*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/staff_requests*', (route) =>
    route.fulfill(
      json([{ user_id: 'r1', wants_role: 'admin', first_name: 'Priya', last_name: 'Nair', city: 'Philadelphia', created_at: new Date().toISOString() }]),
    ),
  );
  // One in review, one withdrawn, one waiting on its leader: only the first is still to look at.
  await page.route('**/rest/v1/rpc/programs_to_check*', (route) =>
    route.fulfill(
      json([
        program({}),
        program({ id: 'sub-2', status: 'withdrawn', program_name: 'Corner Pantry', withdrawn_at: '2026-10-07T10:00:00Z' }),
        program({ id: 'sub-3', status: 'changes_asked', program_name: 'Riverside Learning' }),
      ]),
    ),
  );
  await page.route('**/rest/v1/rpc/directory_people*', (route) =>
    route.fulfill(
      json([
        { id: 'p1', first_name: 'Marcus', role: 'member', region_name: 'Philadelphia', access_status: 'active', last_active_at: null, is_demo: false },
        { id: 'p2', first_name: 'Alice', role: 'provider', region_name: 'Philadelphia', access_status: 'active', last_active_at: null, is_demo: true },
      ]),
    ),
  );
  await page.route('**/rest/v1/rpc/invites_log*', (route) =>
    route.fulfill(
      json([
        {
          id: 'i1',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
          invited_role: 'member',
          inviter_first: 'Dana',
          inviter_last: null,
          inviter_role: 'admin',
          state: 'open',
          joined_first: null,
          emailed_to: null,
          reissued: false,
        },
      ]),
    ),
  );
}

test.describe('a super admin (Iris, 15 October)', () => {
  test('P1 and P3: Home counts what is still to check, and a request says City', async ({ page }) => {
    await superAdmin(page);
    await page.goto('/');
    await settled(page);
    const row = page.getByRole('link', { name: /Programs to check/ });
    // The count sits at the row's end, beside the link: one in review (not the withdrawn one, not the one waiting on its leader).
    await expect(page.locator('main')).toContainText(/Programs to check\s*1(?!\d)/);
    await expect(row).toHaveAttribute('href', '/programs/review/?from=home');
    await expect(page.getByRole('link', { name: /Priya Nair/ })).toContainText('City: Philadelphia');
    await expect(page.getByText(/Typed:/)).toHaveCount(0);
  });

  test('P2 and P3: from Home, back goes Home; the list counts only what is in review', async ({ page }) => {
    await superAdmin(page);
    await page.goto('/programs/review/?from=home');
    await settled(page);
    await expect(page.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/');
    await expect(page.getByText('To look at: 1')).toBeVisible();
    await page.goto('/programs/review/');
    await settled(page);
    await expect(page.getByRole('link', { name: 'Back to Profile' })).toHaveAttribute('href', '/profile/');
  });

  test('P4: the phone calls and the website opens', async ({ page }) => {
    await superAdmin(page);
    await page.goto('/programs/review/item/?id=sub-1');
    await settled(page);
    await expect(page.getByRole('link', { name: /215.*555.*0142/ })).toHaveAttribute('href', 'tel:+12155550142');
    await expect(page.getByRole('link', { name: 'hearthkitchen.example.org' })).toHaveAttribute('href', 'https://hearthkitchen.example.org');
  });

  test('P5: each Demo view switch says whose it is', async ({ page }) => {
    await superAdmin(page);
    await page.goto('/directory/');
    await settled(page);
    await expect(page.getByRole('switch', { name: 'Demo view for Marcus' })).toBeVisible();
    await expect(page.getByRole('switch', { name: 'Demo view for Alice' })).toBeVisible();
    await expect(page.getByRole('switch', { name: 'Demo view', exact: true })).toHaveCount(0);
  });

  test('P6: Profile names the list of work for what it is', async ({ page }) => {
    await superAdmin(page);
    await page.goto('/profile/');
    await settled(page);
    await expect(page.locator('[aria-label="Your work"]')).toBeVisible();
  });

  test('P7: the invites log states are readable', async ({ page }) => {
    await superAdmin(page);
    await page.goto('/invites/');
    await settled(page);
    const state = page.getByText('Link open', { exact: true });
    await expect(state).toBeVisible();
    expect(await state.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThan(12);
  });
});
