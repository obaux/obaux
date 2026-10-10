import { test, expect } from '@playwright/test';
import { settled } from './settled';

/**
 * A program lead who runs more than one program (D-318): the Program tab shows
 * one, "Your programs" lists them, tapping another shows it, and Add another
 * program waits while Pam is checking one.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const ORG = '22222222-0000-0000-0000-0000000000aa';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const program = (id: string, name: string, over: Record<string, unknown> = {}) => ({
  id, name, category: 'workforce', subcategory: null, description_plain: 'Words.', address: null, phone: null, website: null,
  needs_review: false, is_active: true, created_at: '2026-10-06T10:00:00Z', ...over,
});

async function signedInLead(page: import('@playwright/test').Page, services: unknown[], submissions: unknown[] = []) {
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
  await page.route('**/rest/v1/services*', (route) => route.fulfill(json(services)));
  await page.route('**/rest/v1/program_submissions*', (route) => route.fulfill(json(submissions)));
}

test('switch to another program, which the Program tab then shows', async ({ page }) => {
  await signedInLead(page, [
    program('4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a', 'Fresh Start Kitchen'),
    program('4c0f6b64-3a0e-4b8e-9d6c-0b0b0b0b0b0b', 'Riverside Pantry', { created_at: '2026-09-06T10:00:00Z' }),
  ]);
  await page.goto('/program/');
  await settled(page);
  await expect(page.getByRole('heading', { name: 'Fresh Start Kitchen', level: 1 })).toBeVisible();

  await page.getByRole('link', { name: /Your programs/ }).click();
  await expect(page.getByRole('heading', { name: 'Your programs', level: 1 })).toBeVisible();
  await expect(page.locator('[aria-current="true"]')).toContainText('Fresh Start Kitchen');
  await page.getByRole('button', { name: /Riverside Pantry/ }).click();

  await expect(page).toHaveURL(/\/program\/$/);
  await expect(page.getByRole('heading', { name: 'Riverside Pantry', level: 1 })).toBeVisible();
  // It is remembered on this phone.
  await page.reload();
  await settled(page);
  await expect(page.getByRole('heading', { name: 'Riverside Pantry', level: 1 })).toBeVisible();
});

test('Add another program is offered while all are live, and waits while one is being checked', async ({ page }) => {
  await signedInLead(page, [program('4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a', 'Fresh Start Kitchen')]);
  await page.goto('/program/switch/');
  await settled(page);
  await expect(page.getByRole('link', { name: /Add another program/ })).toHaveAttribute('href', /\/programs\/new\//);
});

test('with one being checked, the others wait for Pam', async ({ page }) => {
  await signedInLead(
    page,
    [
      program('4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a', 'Fresh Start Kitchen'),
      program('4c0f6b64-3a0e-4b8e-9d6c-0c0c0c0c0c0c', 'Corner Cafe', { needs_review: true, created_at: '2026-10-09T10:00:00Z' }),
    ],
    [{ id: 'sub-1', service_id: '4c0f6b64-3a0e-4b8e-9d6c-0c0c0c0c0c0c', kind: 'new', status: 'in_review', details: {}, sent_at: '2026-10-09T10:00:00Z', changes_note: null }],
  );
  await page.goto('/program/switch/');
  await settled(page);
  await expect(page.getByText(/Pam is checking Corner Cafe/)).toBeVisible();
  await expect(page.getByRole('link', { name: /Add another program/ })).toHaveCount(0);
});
