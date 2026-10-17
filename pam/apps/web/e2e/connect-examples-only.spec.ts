import { expect, test, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * "Connect {name} to…" recommends nothing yet: ConnectView stores and sends nothing, yet its
 * headline says the member will see the recommendation. So a real case manager does not get the
 * row, and the address sends a real account back to the person's page (D-509's rule: no examples
 * for a real account). An example walk (a tab that asked with `pam.examples`) still shows it.
 * Supabase is stubbed at the network.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function caseManager(page: Page, { examples = false } = {}) {
  await page.addInitScript(
    ([userId, wantExamples]) => {
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
      if (wantExamples) window.sessionStorage.setItem('pam.examples', '1');
    },
    [ME, examples] as const,
  );
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/access_controls*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/enrollments*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/appointments*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/**', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      // The caseload asks for members; everything else is the case manager's own profile.
      route.request().url().includes('role=eq.member')
        ? json([{ id: 'm1', first_name: 'Marcus', access_status: 'active', last_active_at: null }])
        : json({
            id: ME,
            role: 'admin',
            first_name: 'Dana',
            region_id: null,
            regions: null,
            access_status: 'active',
            onboarded_at: '2026-09-14T00:00:00Z',
          }),
    ),
  );
}

test.describe('Connect is for examples only', () => {
  test('a real case manager sees no Connect row on a member of their caseload', async ({ page }) => {
    await caseManager(page);
    await page.goto('/person/?id=m1');
    await settled(page);
    await expect(page.getByRole('heading', { name: 'Marcus', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Message Marcus' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Connect Marcus to/ })).toHaveCount(0);
  });

  test('the Connect address sends a real case manager back to the person', async ({ page }) => {
    await caseManager(page);
    await page.goto('/person/connect/?id=m1');
    await expect(page).toHaveURL(/\/person\/\?id=m1$/);
    await expect(page.getByText(/is recommended to/)).toHaveCount(0);
  });

  test('an example walk still has the Connect row', async ({ page }) => {
    await caseManager(page, { examples: true });
    await page.goto('/person/?id=dummy-m1');
    await settled(page);
    await expect(page.getByRole('link', { name: /Connect .* to/ })).toBeVisible();
  });
});
