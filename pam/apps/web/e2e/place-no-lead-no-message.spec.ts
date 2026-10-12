import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * A place nobody on Pam runs has nobody to answer, so a member is not offered a message to it
 * (Will, 12 October 2026: "they shouldn't be able to see the list item to message that program").
 * A place with a lead keeps its Message row and menu item. Call and Website stay either way.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const PLACE_ID = 'a1b2c3d4-0000-4000-8000-0000000000e1';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const PLACE = {
  id: PLACE_ID,
  name: 'Riverside Works',
  lookup_name: 'RIVERSIDE WORKS',
  category: 'workforce',
  subcategory: null,
  address: '1 Mill St, Philadelphia, PA 19139',
  phone: '+12155550142',
  place_id: null,
  lat: 39.96,
  lon: -75.21,
  description_plain: 'Welding and forklift classes.',
  website: 'https://example.org/riverside',
  audience: null,
  hours: null,
};

async function signedInMember(page: Page, hasLead: boolean | 'never') {
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
  await page.route('**/rest/v1/**', (route) => route.fulfill(json([])));
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({ id: ME, role: 'member', first_name: 'Marcus', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', org_id: null }),
    ),
  );
  await page.route('**/rest/v1/rpc/service_detail*', (route) => route.fulfill(json([PLACE])));
  await page.route('**/rest/v1/rpc/service_has_lead*', (route) =>
    hasLead === 'never' ? new Promise(() => undefined) : route.fulfill(json(hasLead)),
  );
}

async function openMenu(page: Page) {
  await page.getByRole('button', { name: 'More' }).click();
}

test.describe('message entry points on a place', () => {
  test('no lead on Pam: no message row, no menu item; Call and Website stay', async ({ page }) => {
    await signedInMember(page, false);
    await page.goto(`/place/?id=${PLACE_ID}`);
    await settled(page);
    await expect(page.getByRole('link', { name: /^Call/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Website/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Send a message/ })).toHaveCount(0);
    await expect(page.getByText('Ask a question before you go')).toHaveCount(0);
    await openMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Flag something' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Message the program' })).toHaveCount(0);
  });

  test('while it is still being asked, nothing flashes in', async ({ page }) => {
    await signedInMember(page, 'never');
    await page.goto(`/place/?id=${PLACE_ID}`);
    // (not `settled`: the question is left unanswered on purpose, so the network never idles)
    await expect(page.getByRole('link', { name: /^Call/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Send a message/ })).toHaveCount(0);
    await openMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Message the program' })).toHaveCount(0);
  });

  test('a lead on Pam: the message row and menu item are there', async ({ page }) => {
    await signedInMember(page, true);
    await page.goto(`/place/?id=${PLACE_ID}`);
    await settled(page);
    await expect(page.getByRole('link', { name: /Send a message/ })).toBeVisible();
    await openMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Message the program' })).toBeVisible();
  });
});
