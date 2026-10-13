import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * A real member's page, for their case manager (D-509): the visits they have really planned, and never made-up ones, and no
 * "examples" note. The case manager's database rule decides which members' visits come back.
 */
const ADMIN = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const MEMBER = 'a0a0a0a0-0000-4000-8000-0000000000aa';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

async function open(page: Page, visits: unknown[], path = `/person/?id=${MEMBER}`) {
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, ADMIN);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ADMIN })));
  await page.route('**/rest/v1/profiles*', (route) => {
    if (route.request().url().includes('role=eq.member')) {
      return route.fulfill(json([{ id: MEMBER, first_name: 'Dante', access_status: 'active', last_active_at: '2026-10-10T14:00:00Z' }]));
    }
    return route.fulfill(
      json({ id: ADMIN, role: 'admin', first_name: 'Will', is_demo: false, region_id: '0195b1c0-0000-4000-8000-000000000001', regions: { name: 'Philadelphia' }, onboarded_at: '2026-09-14T00:00:00Z' }),
    );
  });
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/access_controls*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/enrollments*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/member_points*', (route) => route.fulfill(json(0)));
  await page.route('**/rest/v1/appointments*', (route) => route.fulfill(json(visits)));
  await page.goto(path);
  await settled(page);
}

test('a real member with nothing planned shows no trips and no example note', async ({ page }) => {
  await open(page, []);
  await expect(page.getByRole('heading', { name: 'Dante' }).first()).toBeVisible();
  await expect(page.getByText('The trips shown are examples until Pam books visits.')).toHaveCount(0);
  await expect(page.getByText(/Example /)).toHaveCount(0);
  await expect(page.getByText('None yet.')).toBeVisible();
});

test('a real member shows the visits they really planned, from the database', async ({ page }) => {
  await open(page, [
    { id: 'v1', starts_at: inDays(3), status: 'scheduled', service_id: 'a1b2c3d4-0000-4000-8000-0000000000e1', services: { name: 'Riverside Job Center', category: 'workforce' } },
    { id: 'v0', starts_at: inDays(-5), status: 'attended', service_id: 'a1b2c3d4-0000-4000-8000-0000000000e2', services: { name: 'Santore Library', category: 'education' } },
  ]);
  await expect(page.getByText('Riverside Job Center').first()).toBeVisible();
  // Only the coming-up visit is on this page; the past one is a tap away.
  await expect(page.getByText('Santore Library')).toHaveCount(0);
  await expect(page.getByText('The trips shown are examples until Pam books visits.')).toHaveCount(0);
});

test('the past visits page shows real ones too, and no example note', async ({ page }) => {
  await open(
    page,
    [{ id: 'v0', starts_at: inDays(-5), status: 'attended', service_id: 'a1b2c3d4-0000-4000-8000-0000000000e2', services: { name: 'Santore Library', category: 'education' } }],
    `/person/past/?id=${MEMBER}`,
  );
  await expect(page.getByText('Santore Library').first()).toBeVisible();
  await expect(page.getByText('The trips shown are examples until Pam books visits.')).toHaveCount(0);
});

/** W5: "Programs attended in the past" says the member went only where the program marked them as there. */
const MIXED = [
  { id: 'a', starts_at: inDays(-10), status: 'attended', service_id: 'a1b2c3d4-0000-4000-8000-0000000000e2', services: { name: 'Santore Library', category: 'education' } },
  { id: 'm', starts_at: inDays(-8), status: 'missed', service_id: 'a1b2c3d4-0000-4000-8000-0000000000e3', services: { name: 'Missed Place', category: 'workforce' } },
  { id: 'u', starts_at: inDays(-2), status: 'scheduled', service_id: 'a1b2c3d4-0000-4000-8000-0000000000e4', services: { name: 'Unmarked Place', category: 'workforce' } },
];

test('the past visits page lists only attended visits: a missed one and an unmarked one are not there', async ({ page }) => {
  await open(page, MIXED, `/person/past/?id=${MEMBER}`);
  await expect(page.getByText('Santore Library').first()).toBeVisible();
  await expect(page.getByText('Missed Place')).toHaveCount(0);
  await expect(page.getByText('Unmarked Place')).toHaveCount(0);
});

test('the member\'s page counts only the attended ones next to "Programs attended in the past"', async ({ page }) => {
  await open(page, MIXED);
  // The count sits at the right of the row, beside its link.
  const row = page.getByRole('listitem').filter({ hasText: 'Programs attended in the past' }).first();
  await expect(row).toBeVisible();
  // One attended visit of three: the label and a 1, not a 3.
  await expect(row).toHaveText('Programs attended in the past1');
});
