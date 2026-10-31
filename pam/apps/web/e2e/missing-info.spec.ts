import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * Places on Pam and Missing information (D-623; Will, 31 October, Control Room note n-20261031-2020: "visibility on how many
 * programs exist total. And a list of programs missing info, clicking into it, opens a nested page with list of missing
 * details, filtered and searchable"). The super admin's Home counts the places and how many have each detail, over the places
 * that need it (Parks & Rec need only an address, D-622); a row opens every place that lacks something, with filters for what
 * is missing and the kind of place, a search, and each row opening the place. Supabase is stubbed at the network.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const PLACES = [
  { id: 'gap-1', name: 'Fresh Start Kitchen', address: '1231 N Broad St, Philadelphia, PA 19122', kind: 'hand', missing: ['hours'] },
  { id: 'gap-2', name: 'Kensington Wellness', address: '2930 Kensington Ave, Philadelphia, PA 19134', kind: 'health', missing: ['website', 'hours'] },
  { id: 'gap-3', name: 'West Philly Recovery House', address: null, kind: 'health', missing: ['address', 'hours'] },
  { id: 'gap-4', name: 'Fox Chase Library', address: '501 Rhawn St, Philadelphia, PA 19111', kind: 'library', missing: ['hours'] },
  { id: 'gap-5', name: 'Hunting Park Playground', address: null, kind: 'parks', missing: ['address'] },
];

const COUNTS = {
  total: 754,
  phone_need: 588,
  phone_have: 331,
  website_need: 588,
  website_have: 207,
  address_need: 754,
  address_have: 750,
  hours_need: 588,
  hours_have: 6,
  missing: 590,
};

async function signedIn(page: Page, { role = 'super_admin', places = PLACES }: { role?: string; places?: unknown[] } = {}) {
  const asked: { p_with_list?: boolean }[] = [];
  await page.addInitScript((userId: string) => {
    const session = { access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: userId, aud: 'authenticated', role: 'authenticated' } };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, ME);
  await page.route('**/rest/v1/**', (route) => route.fulfill(json([])));
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: ME, role, first_name: 'Will', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
  );
  await page.route('**/rest/v1/rpc/program_info_gaps*', (route) => {
    const body = (route.request().postDataJSON() ?? {}) as { p_with_list?: boolean };
    asked.push(body);
    return route.fulfill(json({ ...COUNTS, places: body.p_with_list ? places : null }));
  });
  return asked;
}

const rows = (page: Page) => page.getByRole('list', { name: 'Missing information' }).getByRole('listitem');

test.describe('Places on Pam and Missing information (D-623)', () => {
  test("Home counts the places and each detail over the places that need it, and the row opens the list", async ({ page }) => {
    const asked = await signedIn(page);
    await page.goto('/');
    await settled(page);
    const card = page.getByRole('heading', { name: 'Places on Pam', level: 2 }).locator('xpath=ancestor::*[contains(@class,"astryx-card")][1]');
    await expect(card).toContainText('Listed');
    await expect(card).toContainText('754');
    await expect(card).toContainText('331 of 588');
    await expect(card).toContainText('207 of 588');
    await expect(card).toContainText('750 of 754');
    await expect(card).toContainText('6 of 588');
    await expect(card).toContainText('Parks & Rec places need only an address.');
    const link = page.getByRole('link', { name: 'Missing information' });
    await expect(link).toHaveAttribute('href', '/places/missing/?from=home');
    // The number sits in the row, beside the words the link wraps.
    await expect(link.locator('xpath=ancestor::li[1]')).toContainText('590');
    // Home asks for the counts only, not the list.
    expect(asked.every((a) => a.p_with_list === false)).toBe(true);
  });

  test('the list shows each place with its kind, its address (or none) and what it lacks', async ({ page }) => {
    const asked = await signedIn(page);
    await page.goto('/places/missing/?from=home');
    await settled(page);
    await expect(page.getByRole('heading', { name: 'Missing information', level: 1 })).toBeVisible();
    await expect(page.getByText('590 places')).toBeVisible();
    await expect(rows(page)).toHaveCount(5);
    await expect(rows(page).nth(1)).toContainText('Behavioral health');
    await expect(rows(page).nth(1)).toContainText('Missing: Website and Hours');
    await expect(rows(page).nth(2)).toContainText('No address');
    await expect(page.getByRole('status').filter({ hasText: '5 shown' })).toBeVisible();
    expect(asked.some((a) => a.p_with_list === true)).toBe(true);
    await expect(page.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/');
  });

  test("filters keep what is missing and the kind of place, together", async ({ page }) => {
    await signedIn(page);
    await page.goto('/places/missing/');
    await settled(page);
    await page.getByRole('group', { name: "What's missing" }).getByRole('button', { name: 'Address' }).click();
    await expect(rows(page)).toHaveCount(2);
    await expect(page.getByRole('status').filter({ hasText: '2 shown' })).toBeVisible();
    await page.getByRole('group', { name: 'Kind of place' }).getByRole('button', { name: 'Parks & Rec' }).click();
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText('Hunting Park Playground');
    await expect(page.getByRole('group', { name: 'Kind of place' }).getByRole('button', { name: 'Parks & Rec' })).toHaveAttribute('aria-pressed', 'true');
    // Back to everything.
    await page.getByRole('group', { name: "What's missing" }).getByRole('button', { name: 'Anything' }).click();
    await page.getByRole('group', { name: 'Kind of place' }).getByRole('button', { name: 'All' }).click();
    await expect(rows(page)).toHaveCount(5);
  });

  test('the search finds every word in the name or the address, and says when nothing matches', async ({ page }) => {
    await signedIn(page);
    await page.goto('/places/missing/');
    await settled(page);
    const search = page.getByRole('searchbox', { name: 'Search places missing information' }).or(page.getByRole('textbox', { name: 'Search places missing information' }));
    await search.fill('rhawn');
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText('Fox Chase Library');
    await search.fill('kensington   WELLNESS');
    await expect(rows(page)).toHaveCount(1);
    await search.fill('nowhere at all');
    await expect(rows(page)).toHaveCount(0);
    await expect(page.getByText('No place matches. Try fewer words or another filter.')).toBeVisible();
  });

  test("a row opens the place, whose Back comes to the list as it was left", async ({ page }) => {
    await signedIn(page);
    await page.goto('/places/missing/');
    await settled(page);
    await page.getByRole('group', { name: 'Kind of place' }).getByRole('button', { name: 'Library' }).click();
    await expect(rows(page)).toHaveCount(1);
    await rows(page).first().getByRole('link').click();
    await expect(page).toHaveURL(/\/place\/\?id=gap-4&from=missing/);
    const back = page.getByRole('link', { name: 'Back to Missing information' });
    await expect(back).toHaveAttribute('href', '/places/missing/');
    await back.click();
    await expect(page).toHaveURL(/\/places\/missing\//);
    // The filter was kept for the visit.
    await expect(page.getByRole('group', { name: 'Kind of place' }).getByRole('button', { name: 'Library' })).toHaveAttribute('aria-pressed', 'true');
    await expect(rows(page)).toHaveCount(1);
  });

  test('when every place has what it needs, it says so in one line', async ({ page }) => {
    await signedIn(page, { places: [] });
    await page.goto('/places/missing/');
    await expect(page.getByText('Every place has what it needs.')).toBeVisible();
    await expect(rows(page)).toHaveCount(0);
  });

  for (const role of ['member', 'admin', 'provider']) {
    test(`a ${role} is refused, and the counts are never asked for`, async ({ page }) => {
      const asked = await signedIn(page, { role });
      await page.goto('/places/missing/');
      await settled(page);
      await expect(page.getByText('This screen is for the Pam team')).toBeVisible();
      await expect(rows(page)).toHaveCount(0);
      expect(asked).toHaveLength(0);
    });
  }

  for (const path of ['/', '/places/missing/']) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await signedIn(page);
      await page.goto(path);
      await settled(page);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
