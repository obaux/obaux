import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * A member signs a program's real policy (Will's card a25, part 2): the
 * program's own pages are there to read, what the program keeps is said BEFORE
 * signing, signing asks the database (`sign_policy`) and shows at once, and a
 * place whose program has put no policy asks for nothing (never the example
 * program's).
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const PLACE = '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const CONF = 'a1b2c3d4-0000-4000-8000-000000000001';
const policy = (id: string, title: string) => ({
  id, service_id: PLACE, title, version: 1, replaces_id: null, created_at: '2026-10-06T10:00:00Z', archived_at: null,
  program_policy_files: [{ id: `${id}-f`, path: `${PLACE}/${id}.pdf`, name: `${title}.pdf`, content_type: 'application/pdf', size_bytes: 1000, position: 0 }],
});

async function signedInMember(page: import('@playwright/test').Page, policies: unknown[], signed: unknown[] = []) {
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
    route.fulfill(json({ id: ME, role: 'member', first_name: 'Marcus', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trips*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trip_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/program_policies*', (route) => route.fulfill(json(policies)));
  await page.route('**/rest/v1/policy_signatures*', (route) => route.fulfill(json(signed)));
  await page.route('**/rest/v1/member_signatures*', (route) => route.fulfill(json(null)));
}

const view = (id: string) => `/place/policies/view/?place=${PLACE}&name=Riverside%20Job%20Center&id=${id}&via=list`;

test('a real policy shows its pages and what the program keeps, before the member signs, with no WCAG A/AA violations', async ({ page }) => {
  await signedInMember(page, [policy(CONF, 'Confidentiality')]);
  await page.goto(view(CONF));
  await settled(page);
  await expect(page.getByText('Confidentiality.pdf')).toBeVisible();
  await expect(page.getByText(/The program keeps a record of the policies you sign, with the date/)).toBeVisible();
  await expect(page.getByText(/Signing here is a record that you read and agreed/)).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('signing (by typing a name) asks the database and shows as signed at once', async ({ page }) => {
  await signedInMember(page, [policy(CONF, 'Confidentiality')]);
  const signed: Array<Record<string, unknown>> = [];
  await page.route('**/rest/v1/rpc/sign_policy*', (route) => {
    signed.push(route.request().postDataJSON());
    return route.fulfill(json({ id: 's1' }));
  });
  await page.goto(view(CONF));
  await settled(page);
  await page.getByRole('button', { name: 'Sign', exact: true }).click();
  await page.getByRole('button', { name: 'Type my name instead' }).click();
  await page.getByLabel('Your full name').fill('Marcus Reed');
  await page.getByRole('dialog').getByRole('button', { name: 'Sign', exact: true }).click();

  await expect.poll(() => signed.length).toBe(1);
  expect(signed[0]).toMatchObject({ p_policy_id: CONF });
  expect(String(signed[0]!['p_image'])).toMatch(/^data:image\/png;base64,/);
  await expect(page.getByText(/^Signed /)).toBeVisible();
});

test('a place whose program has put no policy asks for nothing, never the example program\'s', async ({ page }) => {
  await signedInMember(page, []);
  await page.goto(view('anything'));
  await settled(page);
  await expect(page.getByText('Liability disclaimer')).toHaveCount(0);
  await expect(page.getByText('Confidentiality and disclosure')).toHaveCount(0);
});
