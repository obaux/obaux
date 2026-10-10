import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * Programs to check (D-386, part 6): a super admin reads what program leaders
 * have sent, opens one, and approves it, asks for changes (a note is required)
 * or — for one a leader deleted to start over — discards it. The decisions are
 * the database's (`review_program_submission`); these check the screen asks it
 * the right thing and only offers what the status allows.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const row = (over: Record<string, unknown>) => ({
  id: 'sub-1',
  service_id: 'svc-1',
  kind: 'new',
  status: 'in_review',
  sent_at: '2026-10-06T10:00:00Z',
  days_waiting: 4,
  program_name: 'Hearth Kitchen Training',
  details: { name: 'Hearth Kitchen Training', category: 'workforce', description: 'Cooking classes.', address: '1234 Market St' },
  changes_note: null,
  lead_name: 'Lou',
  replaces_id: null,
  replaced_by: null,
  withdrawn_at: null,
  ...over,
});

async function signedInAsSuperAdmin(page: import('@playwright/test').Page, rows: unknown[]) {
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
  await page.route('**/rest/v1/staff_requests*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/programs_to_check*', (route) => route.fulfill(json(rows)));
}

test.describe('programs to check', () => {
  test('lists what was sent, with how long it has waited, and no WCAG A/AA violations', async ({ page }) => {
    await signedInAsSuperAdmin(page, [
      row({}),
      row({ id: 'sub-2', kind: 'change', program_name: 'Riverside Career Center', days_waiting: 1, details: { name: 'Riverside Learning Center' }, lead_name: 'Rae' }),
    ]);
    await page.goto('/programs/review/');
    await settled(page);

    await expect(page.getByRole('heading', { name: 'Programs to check', level: 1 })).toBeVisible();
    const first = page.getByRole('link', { name: /Hearth Kitchen Training/ });
    await expect(first).toContainText('From Lou');
    await expect(first).toContainText('Days waiting: 4');
    await expect(page.getByRole('link', { name: /Riverside Career Center/ })).not.toContainText('Days waiting');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Approve asks the database to approve that one', async ({ page }) => {
    await signedInAsSuperAdmin(page, [row({})]);
    const asked: unknown[] = [];
    await page.route('**/rest/v1/rpc/review_program_submission*', (route) => {
      asked.push(route.request().postDataJSON());
      return route.fulfill(json({ id: 'sub-1' }));
    });
    await page.goto('/programs/review/item/?id=sub-1');
    await settled(page);

    await expect(page.getByText('1234 Market St')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page).toHaveURL(/\/programs\/review\/$/);
    expect(asked).toEqual([{ p_id: 'sub-1', p_decision: 'approved' }]);
  });

  test('Ask for changes needs a note, then sends it', async ({ page }) => {
    await signedInAsSuperAdmin(page, [row({})]);
    const asked: unknown[] = [];
    await page.route('**/rest/v1/rpc/review_program_submission*', (route) => {
      asked.push(route.request().postDataJSON());
      return route.fulfill(json({ id: 'sub-1' }));
    });
    await page.goto('/programs/review/item/?id=sub-1');
    await settled(page);

    await page.getByRole('button', { name: 'Ask for changes' }).click();
    await page.getByRole('button', { name: 'Send to the leader' }).click();
    await expect(page.getByText('Write what to change first.')).toBeVisible();
    expect(asked).toEqual([]);

    await page.getByLabel('What should they change?').fill('Please add the street address.');
    await page.getByRole('button', { name: 'Send to the leader' }).click();
    await expect(page).toHaveURL(/\/programs\/review\/$/);
    expect(asked).toEqual([{ p_id: 'sub-1', p_decision: 'changes_asked', p_note: 'Please add the street address.' }]);
  });

  test('a withdrawn request can only be discarded, and asks first', async ({ page }) => {
    await signedInAsSuperAdmin(page, [row({ id: 'sub-3', status: 'withdrawn', withdrawn_at: '2026-10-07T10:00:00Z' })]);
    const asked: unknown[] = [];
    await page.route('**/rest/v1/rpc/review_program_submission*', (route) => {
      asked.push(route.request().postDataJSON());
      return route.fulfill(json({ id: 'sub-3' }));
    });
    await page.goto('/programs/review/item/?id=sub-3');
    await settled(page);

    await expect(page.getByText(/Lou deleted this and started again on/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Ask for changes' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Discard' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Yes, discard it' }).click();
    await expect(page).toHaveURL(/\/programs\/review\/$/);
    expect(asked).toEqual([{ p_id: 'sub-3', p_decision: 'discarded' }]);
  });

  test('one waiting on the leader offers no decision', async ({ page }) => {
    await signedInAsSuperAdmin(page, [row({ status: 'changes_asked' })]);
    await page.goto('/programs/review/item/?id=sub-1');
    await settled(page);
    await expect(page.getByText('Waiting for the leader to send it again')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Discard' })).toHaveCount(0);
  });
});
