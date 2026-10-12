import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * A member can write to a program before booking a visit (D-541; Will, 11 October 2026:
 * "It's important that residents can message programs even before booking a visit").
 *
 * The place's Message row opens the conversation (`message_program()`), and replaces the address
 * with the conversation's. A place with nobody on Pam to answer has no such row: Call and Website
 * are what it shows, so there is no dead end.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const PLACE_ID = 'a1b2c3d4-0000-4000-8000-0000000000e1';
const CONVERSATION = 'c0c0c0c0-0000-4000-8000-0000000000c1';
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

async function signedInMember(page: Page, hasLead: boolean) {
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
  // Anything not named below is an empty answer: this is about one button.
  await page.route('**/rest/v1/**', (route) => route.fulfill(json([])));
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({ id: ME, role: 'member', first_name: 'Marcus', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', org_id: null }),
    ),
  );
  await page.route('**/rest/v1/rpc/service_detail*', (route) => route.fulfill(json([PLACE])));
  await page.route('**/rest/v1/rpc/service_has_lead*', (route) => route.fulfill(json(hasLead)));
}

test.describe('message a program from its page', () => {
  test('a place with a lead on Pam: Send a message opens the conversation, before any visit', async ({ page }) => {
    await signedInMember(page, true);
    let asked: unknown = null;
    await page.route('**/rest/v1/rpc/message_program*', (route) => {
      asked = route.request().postDataJSON();
      return route.fulfill(json(CONVERSATION));
    });
    await page.goto(`/place/?id=${PLACE_ID}`);
    await settled(page);

    const row = page.getByRole('link', { name: /Send a message/ });
    await expect(row).toHaveAttribute('href', new RegExp(`/messages/thread/\\?program=${PLACE_ID}`));
    await row.click();
    await expect(page).toHaveURL(new RegExp(`/messages/thread/\\?id=${CONVERSATION}`));
    expect(asked).toEqual({ p_service_id: PLACE_ID });
    // Back still leads to the program.
    await expect(page).toHaveURL(new RegExp(`from=place&place=${PLACE_ID}`));
  });

  test('a place with no lead on Pam: no Message, Call and Website instead', async ({ page }) => {
    await signedInMember(page, false);
    await page.goto(`/place/?id=${PLACE_ID}`);
    await settled(page);

    await expect(page.getByRole('link', { name: /Call/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Website/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Send a message/ })).toHaveCount(0);
  });

  test('if the program cannot be messaged after all, the page says so and goes back, not a blank', async ({ page }) => {
    await signedInMember(page, true);
    await page.route('**/rest/v1/rpc/message_program*', (route) =>
      route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'NO_PROGRAM_LEAD' }) }),
    );
    await page.goto(`/messages/thread/?program=${PLACE_ID}&from=place&place=${PLACE_ID}`);
    await expect(page.getByText("This program can't be messaged right now")).toBeVisible();
    await expect(page.getByRole('link', { name: /Back/ }).first()).toHaveAttribute('href', new RegExp(`/place/\\?id=${PLACE_ID}`));
  });
});
