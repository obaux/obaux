import { expect, test, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * The two live cases Iris found on b15 (D-534): in Arabic a Latin place name ("Example Library Tech Lab") and a
 * Latin policy title ("Confidentiality and disclosure") computed `rtl` in their page title. A place's name is
 * data; so is a policy's title, which the program uploads with the file. Both keep their own direction, and
 * Pam's own page title on the same pages ("Policies") keeps the page's.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const PLACE_ID = '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11';
const POLICY_ID = 'a1b2c3d4-0000-4000-8000-000000000001';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedInInArabic(page: Page) {
  await page.addInitScript((userId: string) => {
    localStorage.setItem('pam.locale', 'ar');
    const session = {
      access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, ME);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: ME, role: 'member', first_name: 'Marcus', preferred_language: 'ar', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trips*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trip_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/policy_signatures*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/member_signatures*', (route) => route.fulfill(json(null)));
}

const title = (page: Page) => page.getByRole('heading', { level: 1 }).first();
const directionOf = (page: Page) => title(page).evaluate((el) => getComputedStyle(el).direction);

test('a Latin place name in an Arabic page title reads left to right', async ({ page }) => {
  await signedInInArabic(page);
  await page.route('**/rest/v1/rpc/service_detail*', (route) =>
    route.fulfill(
      json([
        {
          id: PLACE_ID, name: 'Example Library Tech Lab', lookup_name: 'EXAMPLE LIBRARY TECH LAB', category: 'education',
          subcategory: null, address: '1901 Vine St, Philadelphia, PA 19103', phone: null, place_id: null, lat: 39.96, lon: -75.17,
          description_plain: 'Free computers.', website: null, audience: null, hours: null,
        },
      ]),
    ),
  );
  await page.goto(`/place/?id=${PLACE_ID}`);
  await settled(page);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(title(page)).toHaveText('Example Library Tech Lab');
  expect(await directionOf(page)).toBe('ltr');
});

test("a program's policy title is data: a Latin one is ltr, Pam's own page title is rtl", async ({ page }) => {
  await signedInInArabic(page);
  await page.route('**/rest/v1/program_policies*', (route) =>
    route.fulfill(
      json([
        {
          id: POLICY_ID, service_id: PLACE_ID, title: 'Confidentiality and disclosure', version: 1, replaces_id: null,
          created_at: '2026-10-06T10:00:00Z', archived_at: null,
          program_policy_files: [{ id: 'f1', path: `${PLACE_ID}/c.pdf`, name: 'c.pdf', content_type: 'application/pdf', size_bytes: 1000, position: 0 }],
        },
      ]),
    ),
  );
  await page.goto(`/place/policies/view/?place=${PLACE_ID}&name=Riverside&id=${POLICY_ID}&via=list`);
  await settled(page);
  await expect(title(page)).toHaveText('Confidentiality and disclosure');
  expect(await directionOf(page)).toBe('ltr');

  // The list of policies is Pam's own title.
  await page.goto(`/place/policies/?place=${PLACE_ID}&name=Riverside`);
  await settled(page);
  expect(await directionOf(page)).toBe('rtl');
});
