import { expect, test, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * Cities people are waiting for (D-593; card a96, Will 17 October): a super admin sees each city someone signed up from that
 * Pam is not in, and how many, biggest first, to choose where to open next. Counts only. Supabase is stubbed at the network.
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

async function superAdmin(page: Page, cities: unknown[] = [{ place: 'Camden, NJ', people: 14 }, { place: 'Chester', people: 9 }]) {
  await page.route('**/rest/v1/rpc/waiting_city_counts*', (route) => route.fulfill(json(cities)));
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

test.describe('cities people are waiting for (a96)', () => {
  test('Home has the row, with everyone waiting as its number, and it opens the list biggest first', async ({ page }) => {
    await superAdmin(page);
    await page.goto('/');
    await settled(page);
    const row = page.getByRole('link', { name: /Cities people are waiting for/ });
    await expect(row).toHaveAttribute('href', '/cities/waiting/?from=home');
    await expect(page.locator('main')).toContainText(/Cities people are waiting for\s*23(?!\d)/);
    await row.click();
    await expect(page.getByRole('heading', { name: 'Cities people are waiting for', level: 1 })).toBeVisible();
    const items = page.getByRole('list', { name: 'Cities people are waiting for' }).getByRole('listitem');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText('Camden, NJ');
    await expect(items.nth(0)).toContainText('14');
    await expect(items.nth(1)).toContainText('Chester');
    // Counts only: nothing on a row to tap through to a person.
    await expect(page.getByRole('list', { name: 'Cities people are waiting for' }).getByRole('link')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/');
  });

  test('when nobody is waiting, it says so', async ({ page }) => {
    await superAdmin(page, []);
    await page.goto('/cities/waiting/');
    await settled(page);
    await expect(page.getByText('Nobody is waiting yet')).toBeVisible();
  });
});
