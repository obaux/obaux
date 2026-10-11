import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * Places gathered from public lists have no program lead on Pam, so nobody is
 * told about a visit there (D-498; Will, 10 October 2026). A member planning
 * one is told it is only for them; a place with a lead keeps the wording it
 * had. A program lead with no program of their own is asked to add it, and
 * does not see the program's tools.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const REAL = 'a1b2c3d4-0000-4000-8000-0000000000e1';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const NO_LEAD = 'This is only to help you plan. Pam does not tell Example Library Tech Lab you are coming.';

// These walk the example places, which a demo asks for outright; a real account has none (D-509).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('pam.examples', '1'));
});

async function signedIn(page: Page, role: 'member' | 'provider') {
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
      json({ id: ME, role, first_name: 'Pia', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', org_id: null }),
    ),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
}

async function toCheckStep(page: Page, url: string) {
  await page.goto(url);
  await settled(page);
  await page.getByRole('button', { name: /^(Mon|Tue|Wed|Thu|Fri), / }).first().click();
  await page.getByRole('button', { name: /AM|PM/ }).first().click();
  await page.getByRole('button', { name: 'Next' }).click();
}

const LIBRARY = '/trips/new/?place=dummy-place-library&name=Example%20Library%20Tech%20Lab&category=education';
const LEARNING = '/trips/new/?place=dummy-place-learning&name=Example%20Learning%20Center&category=education';

test.describe('a member plans a visit', () => {
  test('at a place with no program lead: only for them, saved not booked, and the place is not told', async ({ page }) => {
    await toCheckStep(page, LIBRARY);
    await expect(page.getByText(NO_LEAD)).toBeVisible();
    await expect(page.getByLabel('A note for yourself (you can skip this)')).toBeVisible();
    await expect(page.getByText(/Anything to tell them/)).toHaveCount(0);
    await page.getByRole('button', { name: 'Add this trip' }).click();
    await expect(page.getByRole('heading', { name: 'Your trip is saved' })).toBeVisible();
    await expect(page.getByText(NO_LEAD)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your trip is booked' })).toHaveCount(0);
  });

  test('at a place with a program lead: the wording it had', async ({ page }) => {
    await toCheckStep(page, LEARNING);
    await expect(page.getByLabel('Anything to tell them? (you can skip this)')).toBeVisible();
    await expect(page.getByText(/Pam does not tell/)).toHaveCount(0);
    await page.getByRole('button', { name: 'Add this trip' }).click();
    await expect(page.getByRole('heading', { name: 'Your trip is booked' })).toBeVisible();
    await expect(page.getByText(/Pam does not tell/)).toHaveCount(0);
  });

  test('a place in the catalogue is asked of the database: no lead says so, a lead does not', async ({ page }) => {
    for (const hasLead of [false, true]) {
      await page.route('**/rest/v1/rpc/service_has_lead*', (route) => route.fulfill(json(hasLead)));
      await toCheckStep(page, `/trips/new/?place=${hasLead ? REAL.replace(/1$/, '2') : REAL}&name=Example%20Library%20Tech%20Lab&category=education`);
      const line = page.getByText(NO_LEAD);
      if (hasLead) await expect(page.getByLabel('Anything to tell them? (you can skip this)')).toBeVisible();
      else await expect(line).toBeVisible();
      if (hasLead) await expect(line).toHaveCount(0);
      await page.unroute('**/rest/v1/rpc/service_has_lead*');
    }
  });

  test('on the place page, a place with no lead says it too', async ({ page }) => {
    await signedIn(page, 'member');
    await page.route('**/rest/v1/rpc/service_detail*', (route) =>
      route.fulfill(
        json([
          {
            id: 'svc-1', name: 'Example Library Tech Lab', lookup_name: null, category: 'education', subcategory: null,
            address: '1901 Vine St, Philadelphia, PA 19103', phone: null, place_id: null, lat: 39.96, lon: -75.17,
            description_plain: 'Free computer classes.', website: null, audience: null, hours: null,
          },
        ]),
      ),
    );
    await page.goto('/place/?id=svc-1');
    await expect(page.getByText(NO_LEAD)).toBeVisible();
  });
});

test.describe('a program lead with no program of their own', () => {
  // A real lead: no examples (the file's default opts in for the member walks above).
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.sessionStorage.removeItem('pam.examples'));
  });
  test('Home leads with Add your program and has no calendar of visits', async ({ page }) => {
    await signedIn(page, 'provider');
    await page.route('**/rest/v1/services*', (route) => route.fulfill(json([])));
    await page.goto('/');
    await settled(page);
    await expect(page.getByRole('link', { name: /Add your program/ }).first()).toBeVisible();
    await expect(page.getByText('See who is coming in')).toHaveCount(0);
  });

  test('the policies page asks them to add their program first', async ({ page }) => {
    await signedIn(page, 'provider');
    await page.route('**/rest/v1/services*', (route) => route.fulfill(json([])));
    await page.goto('/program/policies/');
    await settled(page);
    await expect(page.getByRole('heading', { name: 'Add your program first' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Add your program' })).toHaveAttribute('href', /\/programs\/new\//);
  });
});
