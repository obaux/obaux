import { expect, test, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * Iris's case manager pass (docs/research/2026-10-15-case-manager-flow.md): what a case manager meets after
 * joining. Supabase is stubbed at the network.
 *   W3  a member's page is titled with their name, not "Profile".
 *       Its name is said once: the card shows it, but only the title is a heading.
 *   P3  "Connect" says where the miles are from.
 *   P4  after recommending, the way back to the member is there, as well as Home.
 *   P5  "What you can see" on Home is at reading size.
 *   P8  the members search is named once.
 *   P9  an empty invite form names every missing field at once.
 *   10  an example member's page offers no "Programs saved by" (transparency.ts: a new save, not which one).
 * (W1, the way back from joining step 2, is in join.spec.ts.)
 */
const CATEGORY = 'education';
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


test.describe('a case manager after joining (Iris, 15 October)', () => {
  test('W3: a member\'s page is titled with their name', async ({ page }) => {
    await caseManager(page);
    await page.goto('/person/?id=m1');
    await settled(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Marcus');
    await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toHaveCount(0);
    // The card still shows the name, but only the title is a heading, so it is said once (Iris re-test, 15 October).
    await expect(page.getByRole('heading', { name: 'Marcus' })).toHaveCount(1);
    await expect(page.locator('main p').getByText('Marcus', { exact: true })).toBeVisible();
  });

  test('10: an example member\'s page offers no "Programs saved by" (a new save, never which place)', async ({ page }) => {
    await caseManager(page, { examples: true });
    await page.goto('/person/?id=dummy-m1');
    await settled(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Jordan');
    await expect(page.getByRole('heading', { name: 'Jordan' })).toHaveCount(1);
    await expect(page.getByText(/Programs saved by/)).toHaveCount(0);
  });

  test('P3 and P4: Connect says where the miles are from; after recommending, back to the member or Home', async ({ page }) => {
    await caseManager(page, { examples: true });
    // One program, 800 metres from where Pam measures.
    await page.route('**/rest/v1/rpc/services_near*', (route) =>
      route.fulfill(
        json([
          { id: 'p1', name: 'Northside Learning', lookup_name: null, category: CATEGORY, address: null, phone: null, place_id: null,
            lat: 39.96, lon: -75.16, meters: 800, has_hours: false, hours: null, description_plain: null, website: null, audience: null },
        ]),
      ),
    );
    await page.goto('/person/connect/?id=dummy-m1');
    await settled(page);
    await expect(page.getByText('Distances are from City Hall.')).toBeVisible();
    await page.getByRole('button', { name: /^Recommend/ }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: /Recommend/ }).last().click();
    await expect(page.getByRole('link', { name: 'Back to Jordan' })).toHaveAttribute('href', '/person/?id=dummy-m1');
    await expect(page.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
  });

  test('P5 and P8: the promise on Home is at reading size, and the search is named once', async ({ page }) => {
    await caseManager(page);
    await page.goto('/');
    await settled(page);
    // A short list, the joining step's own four items, each at reading size (item 11).
    const items = page.getByRole('listitem').filter({ hasText: /What they want to work on|The programs they sign up for|Not what they say|When they save a new place/ });
    await expect(items).toHaveCount(4);
    for (const size of await items.evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).fontSize)))) {
      expect(size).toBeGreaterThanOrEqual(16);
    }
    await expect(page.getByText('They were told exactly this.')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Search members by name', exact: true })).toBeVisible();
  });

  test("Home's member search filters the list in place: no dropdown of names over the page (Will, 18 October)", async ({ page }) => {
    await caseManager(page);
    await page.goto('/');
    await settled(page);
    const box = page.getByRole('textbox', { name: 'Search members by name', exact: true });
    await expect(page.getByRole('combobox')).toHaveCount(0);
    await box.fill('Mar');
    await expect(page.getByRole('heading', { level: 1, name: /Mar/ })).toBeVisible();
    // The names the old dropdown listed are the list itself now: nothing floats over it.
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Marcus/ }).first()).toBeVisible();
    await box.fill('Zed');
    await expect(page.getByRole('heading', { level: 2, name: /Nothing matches/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Marcus/ })).toHaveCount(0);
    await expect(page.getByRole('listbox')).toHaveCount(0);
  });

  test('P9: an empty invite names every missing field at once', async ({ page }) => {
    await caseManager(page);
    await page.goto('/invite/new/?role=admin');
    await page.getByRole('button', { name: 'Create link' }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'Add their first name.' });
    await expect(alert).toContainText('Add their mobile number, with the area code.');
    await expect(alert).toContainText('Add their email address.');
  });
});
