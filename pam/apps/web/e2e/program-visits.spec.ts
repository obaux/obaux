import { test, expect } from '@playwright/test';
import { settled } from './settled';

/**
 * A program lead's Home lists the visits members planned at their own program
 * (D-526, attendance part A): by first name, from `my_program_visits`. No
 * example visits beside them.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const ORG = '22222222-0000-0000-0000-0000000000aa';
const PROGRAM = '4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedInLead(page: import('@playwright/test').Page, visits: unknown[]) {
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

const soon = (days: number) => {
  const d = new Date(Date.now() + days * 86_400_000);
  d.setHours(14, 0, 0, 0);
  return d.toISOString();
};

test('Home lists the visits planned at the lead\'s own program, by first name, with no example visits', async ({ page }) => {
  await signedInLead(page, [
    { appointment_id: 'a1', member_id: 'm1', first_name: 'Tanya', starts_at: soon(0), ends_at: null, status: 'scheduled', service_name: 'GED class', checked_in_at: null },
    { appointment_id: 'a2', member_id: 'm2', first_name: 'Luis', starts_at: soon(0), ends_at: null, status: 'scheduled', service_name: null, checked_in_at: null },
  ]);
  await page.goto('/');
  await settled(page);
  await expect(page.getByText('Tanya').first()).toBeVisible();
  await expect(page.getByText('GED class').first()).toBeVisible();
  await expect(page.getByText(/Example /)).toHaveCount(0);
  // A member's page is not the program's to open: no link on the name.
  await expect(page.getByRole('link', { name: 'Tanya' })).toHaveCount(0);
});

const VISIT = 'aaaaaaaa-0000-4000-8000-000000005701';
const here = (checkedInAt: string | null = null) => ({
  appointment_id: VISIT, member_id: 'm1', first_name: 'Tanya', starts_at: soon(0), ends_at: null,
  status: checkedInAt ? 'attended' : 'scheduled', service_name: 'GED class', checked_in_at: checkedInAt,
});

test('tapping here asks check_in_visit for that visit, and the circle fills once the database says yes', async ({ page }) => {
  await signedInLead(page, [here()]);
  const asked: unknown[] = [];
  await page.route('**/rest/v1/rpc/check_in_visit*', (route) => {
    asked.push(route.request().postDataJSON());
    return route.fulfill(json([{ appointment_id: VISIT, status: 'attended', checked_in_at: new Date().toISOString(), points: 100 }]));
  });
  await page.goto('/');
  await settled(page);
  const circle = page.getByRole('button', { name: 'Check Tanya in' });
  await circle.click();
  await expect.poll(() => asked.length).toBe(1);
  expect(asked[0]).toEqual({ p_appointment_id: VISIT });
  await expect(page.getByRole('button', { name: /Tanya is checked in/ })).toBeVisible();
});

test('when the database refuses, the circle stays empty', async ({ page }) => {
  await signedInLead(page, [here()]);
  await page.route('**/rest/v1/rpc/check_in_visit*', (route) =>
    route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'OUTSIDE_THE_VISIT_WINDOW' }) }),
  );
  await page.goto('/');
  await settled(page);
  await page.getByRole('button', { name: 'Check Tanya in' }).click();
  await expect(page.getByText('We could not save')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Check Tanya in' })).toBeVisible();
});

test('a visit the database has as checked in shows filled, and undo asks first, then asks undo_check_in', async ({ page }) => {
  await signedInLead(page, [here(new Date().toISOString())]);
  const undone: unknown[] = [];
  await page.route('**/rest/v1/rpc/undo_check_in*', (route) => {
    undone.push(route.request().postDataJSON());
    return route.fulfill(json([{ appointment_id: VISIT, status: 'scheduled', checked_in_at: null, points: -100 }]));
  });
  await page.goto('/');
  await settled(page);
  await page.getByRole('button', { name: /Tanya is checked in/ }).click();
  expect(undone).toHaveLength(0);
  await page.getByRole('dialog').getByRole('button', { name: 'Undo check-in' }).click();
  await expect.poll(() => undone.length).toBe(1);
  expect(undone[0]).toEqual({ p_appointment_id: VISIT });
  await expect(page.getByRole('button', { name: 'Check Tanya in' })).toBeVisible();
});
