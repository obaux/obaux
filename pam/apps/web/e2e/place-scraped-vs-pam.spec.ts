import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * A place gathered from a public list is not a program on Pam (D-498, D-543; Will, 12 October: "programs scraped from the
 * internet and also programs created in Pam. We need different approaches. We don't offer all those capabilities for scraped
 * programs"). Its page offers what works for ANY place: details, hours, directions, Call, Website, Save, Share, Flag, and
 * planning a trip for yourself. Nothing that implies somebody from the program is on Pam: no messaging, no rules to sign, no
 * services it manages, no staff, no "the program will see your visit".
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const PLACE = 'a1b2c3d4-0000-4000-8000-0000000000e1';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function open(page: Page, hasLead: boolean) {
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
    route.fulfill(json({ id: ME, role: 'member', first_name: 'Pia', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', org_id: null })),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/service_has_lead*', (route) => route.fulfill(json(hasLead)));
  await page.route('**/rest/v1/program_policies*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/program_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/service_detail*', (route) =>
    route.fulfill(
      json([
        {
          id: PLACE, name: 'Scraped Place', lookup_name: null, category: 'education', subcategory: null,
          address: '1901 Vine St, Philadelphia, PA 19103', phone: '+12155550100', place_id: null, lat: 39.96, lon: -75.17,
          description_plain: 'Free computer classes.', website: 'https://example.org', audience: null, hours: null,
        },
      ]),
    ),
  );
  await page.goto(`/place/?id=${PLACE}`);
  await settled(page);
  await expect(page.getByRole('link', { name: /Plan a trip/ })).toBeVisible();
}

const rows = (page: Page) =>
  page.getByRole('link').evaluateAll((links) => links.map((a) => (a.textContent ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean));

test('a scraped place offers only what works for any place', async ({ page }) => {
  await open(page, false);
  // The page's rows and button: how to get there, Call, Website, Plan a trip. No message, no policies, no services, no staff.
  const found = await rows(page);
  expect(found.filter((text) => /Get directions/.test(text))).toHaveLength(1);
  expect(found.some((text) => /^Call/.test(text))).toBe(true);
  expect(found.some((text) => /^Website/.test(text))).toBe(true);
  expect(found.some((text) => /Plan a trip/.test(text))).toBe(true);
  expect(found.some((text) => /message/i.test(text))).toBe(false);
  expect(found.some((text) => /Policies/i.test(text))).toBe(false);
  // It says plainly that the plan is only theirs.
  await expect(page.getByText('This is only to help you plan. Pam does not tell Scraped Place you are coming.')).toBeVisible();
  for (const absent of [/What this program offers/, /Policies to sign/, /When to come/, /Program lead/, /Your visit will be seen/]) {
    await expect(page.getByText(absent)).toHaveCount(0);
  }
  // The ⋯ menu: Flag and Share work for any place; "Message the program" does not.
  await page.getByRole('button', { name: 'More options' }).click();
  await expect(page.getByRole('menuitem')).toHaveText(['Flag something', 'Share this place']);
  // Save works for any place.
  await expect(page.getByRole('button', { name: 'Save this place' })).toBeVisible();
});

test('a place with a lead on Pam keeps its message rows and does not say the plan is only theirs', async ({ page }) => {
  await open(page, true);
  await expect(page.getByText(/Pam does not tell/)).toHaveCount(0);
  await page.getByRole('button', { name: 'More options' }).click();
  await expect(page.getByRole('menuitem', { name: 'Message the program' })).toBeVisible();
});
