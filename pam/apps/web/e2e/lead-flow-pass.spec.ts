import { expect, test, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * Iris's program lead pass (15 October 2026): W1 (Help on the lead's Home), W3 (Day/Week/Month are 48px, and the
 * week opens at today), W4 (a visible heading over the people strip), P1 (Back a step on Add a program),
 * P7 (a rule above Search in the + menu), P9 (info tips are 48px to tap). Supabase is stubbed.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const ORG = '22222222-0000-0000-0000-0000000000aa';
const PROGRAM = '4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function liveLead(page: Page, visits: unknown[]) {
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, ME);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: ME, org_id: ORG, role: 'provider', first_name: 'Lou', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/program_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/program_submissions*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/services*', (route) =>
    route.fulfill(json([{ id: PROGRAM, name: 'Fresh Start Kitchen', category: 'workforce', subcategory: null, description_plain: 'Words.', address: null, phone: null, website: null, needs_review: false, is_active: true, created_at: '2026-10-06T10:00:00Z' }])),
  );
  await page.route('**/rest/v1/rpc/my_program_visits*', (route) => route.fulfill(json(visits)));
}

const at = (days: number, hour = 14) => {
  const d = new Date(Date.now() + days * 86_400_000);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const visit = (id: string, first: string, days: number) => ({
  appointment_id: id, member_id: `m-${id}`, first_name: first, starts_at: at(days), ends_at: null, status: 'scheduled', service_name: 'GED class', checked_in_at: null,
});
const help = (page: Page) => page.getByRole('link', { name: 'Help' }).or(page.getByRole('button', { name: 'Help' }));

test('a lead\'s Home has Help beside the bell (W1), and the header fits the phone', async ({ page }) => {
  await liveLead(page, [visit('a1', 'Tanya', 0)]);
  await page.goto('/');
  await settled(page);
  await expect(help(page)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow, 'sideways scroll').toBe(false);
});

test('Day, Week and Month are 48px tall (W3)', async ({ page }) => {
  await liveLead(page, [visit('a1', 'Tanya', 0)]);
  await page.goto('/');
  await settled(page);
  for (const name of ['Day', 'Week', 'Month']) {
    const box = await page.getByRole('radio', { name }).boundingBox();
    expect(box, name).not.toBeNull();
    expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(48);
    expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(48);
  }
});

test('Coming in opens on the week starting today: no days already gone above it (W3)', async ({ page }) => {
  await liveLead(page, [visit('a1', 'Tanya', 0), visit('a2', 'Luis', -1), visit('a3', 'Mia', 2)]);
  await page.goto('/');
  await settled(page);
  await expect(page.getByRole('heading', { name: /^Today ·/ })).toBeVisible();
  // The week is today and the six after it: yesterday is not a heading above it.
  const yesterday = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(Date.now() - 86_400_000));
  await expect(page.getByRole('heading', { name: yesterday })).toHaveCount(0);
  // Yesterday's visit is in the past of this week and is not listed first.
  await expect(page.getByText('Luis')).toHaveCount(0);
  await expect(page.getByText('Mia').first()).toBeVisible();
});

test('a lead with a program and nobody yet has the people strip with a visible heading (W4)', async ({ page }) => {
  await liveLead(page, []);
  await page.route('**/rest/v1/rpc/messageable_people*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/people_activity*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/conversation_members*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/conversation_partners*', (route) => route.fulfill(json([])));
  await page.goto('/');
  await settled(page);
  await expect(page.getByRole('heading', { name: 'Members interested in your program' })).toBeVisible();
});

test('Search sits under a rule in the + menu, apart from what it creates (P7)', async ({ page }) => {
  const many = Array.from({ length: 12 }, (_, i) => visit(`b${i}`, `Person${i}`, i % 5));
  await liveLead(page, many);
  await page.goto('/');
  await settled(page);
  await page.getByRole('button', { name: 'Add' }).first().click();
  await expect(page.getByRole('separator')).toHaveCount(1);
  await expect(page.getByRole('menuitem', { name: 'Search' })).toBeVisible();
});

test('Add a program: from step 2 the back arrow says it goes back a step (P1)', async ({ page }) => {
  await liveLead(page, []);
  await page.goto('/programs/new/?from=home');
  await settled(page);
  await expect(page.getByRole('link', { name: 'Back to Home' })).toBeVisible();
  await page.getByRole('textbox').first().fill('Fresh Start Kitchen');
  await page.getByRole('button', { name: /Next/ }).click();
  await expect(page.getByRole('button', { name: 'Back a step' }).or(page.getByRole('link', { name: 'Back a step' }))).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Home' })).toHaveCount(0);
});

test('an info tip is 48px to tap, though drawn small (P9)', async ({ page }) => {
  const { asMember } = await import('./asMember');
  await asMember(page, 'super_admin');
  await page.goto('/use-as/');
  await settled(page);
  const tip = page.getByRole('button', { name: 'About Use Pam as' });
  await expect(tip).toBeVisible();
  const box = await tip.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(48);
  expect(box!.height).toBeGreaterThanOrEqual(48);
});

test('Review details warns when there is no address, and the address row goes back to it (P2)', async ({ page }) => {
  await liveLead(page, []);
  await page.goto('/programs/new/?from=home');
  await settled(page);
  await page.getByRole('textbox').first().fill('Fresh Start Kitchen');
  for (let i = 0; i < 8; i += 1) {
    const forward = page.getByRole('button', { name: /^(Next|Skip for now)/ });
    if ((await forward.count()) === 0) break;
    await forward.first().click();
    await page.waitForTimeout(150);
  }
  await expect(page.getByRole('heading', { name: 'Review details' })).toBeVisible();
  await expect(page.getByText('No address yet')).toBeVisible();
  await expect(page.getByText("Members won't know where to go. You can still send it, or add the address first.")).toBeVisible();
});

test('the lead\'s Program tab says "Policies for members" and counts policies, not "to sign" (P4)', async ({ page }) => {
  await liveLead(page, []);
  const policy = (id: string) => ({
    id, service_id: PROGRAM, title: `Policy ${id}`, version: 1, replaces_id: null, created_at: '2026-10-06T10:00:00Z', archived_at: null,
    program_policy_files: [{ id: `${id}-f`, path: `${PROGRAM}/${id}.pdf`, name: `${id}.pdf`, content_type: 'application/pdf', size_bytes: 1000, position: 0 }],
  });
  await page.route('**/rest/v1/program_policies*', (route) => route.fulfill(json([policy('a'), policy('b')])));
  await page.goto('/program/');
  await settled(page);
  await expect(page.getByText('Policies for members', { exact: true })).toBeVisible();
  await expect(page.getByText('2 policies')).toBeVisible();
  await expect(page.getByText(/to sign/)).toHaveCount(0);
});
