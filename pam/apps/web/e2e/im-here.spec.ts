import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * "I'm here" and "I went" (D-535): on a real visit's page, in its window. The
 * phone's position goes to the database once, on the tap; "I went" sends none.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const PLACE = '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11';
const VISIT = '7a1f0f3c-2b11-4c0f-8b64-000000000009';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();

async function signedIn(page: Page, startsAt: string, hasLead = true) {
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
  await page.route('**/rest/v1/rpc/my_trip_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trips*', (route) =>
    route.fulfill(json([{ id: VISIT, service_id: PLACE, place_name: 'Riverside Job Center', category: 'workforce', address: '1234 Market St', lat: 39.95, lon: -75.16, starts_at: startsAt, note: null, status: 'scheduled' }])),
  );
  await page.route('**/rest/v1/rpc/service_detail*', (route) =>
    route.fulfill(json([{ id: PLACE, name: 'Riverside Job Center', lookup_name: 'RIVERSIDE JOB CENTER', category: 'workforce', subcategory: null, address: '1234 Market St', phone: null, place_id: null, lat: 39.95, lon: -75.16, description_plain: 'Jobs.', website: null, audience: null, hours: null }])),
  );
  await page.route('**/rest/v1/rpc/service_has_lead*', (route) => route.fulfill(json(hasLead)));
}

const open = async (page: Page) => {
  await page.goto(`/place/?id=${PLACE}&from=trips&trip=${VISIT}`);
  await settled(page);
};

test('tapping I\'m here sends the position to the database once, and a yes says so and the points', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 39.95, longitude: -75.16 });
  await signedIn(page, hoursFromNow(0.5));
  const asked: unknown[] = [];
  await page.route('**/rest/v1/rpc/i_am_here*', (route) => {
    asked.push(route.request().postDataJSON());
    return route.fulfill(json([{ appointment_id: VISIT, there: true, points: 100 }]));
  });
  await open(page);
  expect(asked).toHaveLength(0); // Nothing is asked of the phone until the tap.
  await expect(page.getByText('Cancel this visit')).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('button', { name: "I'm here" }).click();
  await expect(page.getByText("Your visit is marked.")).toBeVisible();
  await expect(page.getByText('You earned 100 points.')).toBeVisible();
  // A marked visit is not cancelled (Iris's second member pass, P6).
  await expect(page.getByText('Cancel this visit')).toHaveCount(0);
  expect(asked).toHaveLength(1);
  expect(asked[0]).toMatchObject({ p_appointment_id: VISIT, p_lat: 39.95, p_lon: -75.16 });
});

test('too far: it says so and the button stays for another try', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 40.5, longitude: -75.0 });
  await signedIn(page, hoursFromNow(0.5));
  await page.route('**/rest/v1/rpc/i_am_here*', (route) => route.fulfill(json([{ appointment_id: VISIT, there: false, points: 0 }])));
  await open(page);
  await page.getByRole('button', { name: "I'm here" }).click();
  await expect(page.getByText(/You don't seem to be at Riverside Job Center yet/)).toBeVisible();
  await expect(page.getByRole('button', { name: "I'm here" })).toBeVisible();
});

test('no location given: nothing is sent, and I went earns 60 without a position', async ({ page }) => {
  // The person said no to the phone's question.
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_ok, fail) => fail?.({ code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
  });
  await signedIn(page, hoursFromNow(0.5));
  let here = 0;
  await page.route('**/rest/v1/rpc/i_am_here*', (route) => {
    here += 1;
    return route.fulfill(json([]));
  });
  const went: unknown[] = [];
  await page.route('**/rest/v1/rpc/i_went*', (route) => {
    went.push(route.request().postDataJSON());
    return route.fulfill(json([{ appointment_id: VISIT, points: 60 }]));
  });
  await open(page);
  await page.getByRole('button', { name: "I'm here" }).click();
  await expect(page.getByText(/Pam can't check where you are/)).toBeVisible();
  expect(here).toBe(0);
  await page.getByRole('button', { name: 'I went' }).click();
  await expect(page.getByText('You earned 60 points.')).toBeVisible();
  expect(went).toEqual([{ p_appointment_id: VISIT }]);
});

test('a refusal for the weekly limit is said plainly', async ({ page, context }) => {
  await context.clearPermissions();
  await signedIn(page, hoursFromNow(0.5));
  await page.route('**/rest/v1/rpc/i_went*', (route) =>
    route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'SELF_REPORT_LIMIT' }) }),
  );
  await open(page);
  await page.getByRole('button', { name: 'I went' }).click();
  await expect(page.getByText(/you have used them/)).toBeVisible();
});

test('a visit days away has no I\'m here', async ({ page }) => {
  await signedIn(page, hoursFromNow(72));
  await open(page);
  await expect(page.getByRole('button', { name: "I'm here" })).toHaveCount(0);
});

test('at a place with no lead on Pam there is no I\'m here and no I went: nobody is there to mark it (D-545)', async ({ page }) => {
  await signedIn(page, hoursFromNow(-0.5), false);
  await open(page);
  await expect(page.getByRole('heading', { name: 'Riverside Job Center' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: "I'm here" })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'I went' })).toHaveCount(0);
});

const ALERT = "That didn't go through. It's not your fault, so try again.";

test("a failed I'm here is the small alert at the bottom, with no reason, and the button is as it was (D-616)", async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 39.95, longitude: -75.16 });
  await signedIn(page, hoursFromNow(0.5));
  await page.route('**/rest/v1/rpc/i_am_here*', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'secret detail' }) }));
  await open(page);
  await page.getByRole('button', { name: "I'm here" }).click();
  await expect(page.getByRole('alert').filter({ hasText: ALERT })).toBeVisible();
  await expect(page.getByText('secret detail')).toHaveCount(0);
  await expect(page.getByText('We could not save that')).toHaveCount(0);
  await expect(page.getByRole('button', { name: "I'm here" })).toBeEnabled();
});

test('a failed I went is the same small alert, and the link is as it was (D-616)', async ({ page }) => {
  await signedIn(page, hoursFromNow(0.5));
  await page.route('**/rest/v1/rpc/i_went*', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
  await open(page);
  await page.getByRole('button', { name: 'I went' }).click();
  await expect(page.getByRole('alert').filter({ hasText: ALERT })).toBeVisible();
  await expect(page.getByRole('button', { name: 'I went' })).toBeVisible();
});

test('a visit that could not be cancelled stays, with the small alert at the bottom (D-616)', async ({ page }) => {
  await signedIn(page, hoursFromNow(5));
  await page.route('**/rest/v1/rpc/cancel_trip*', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
  await open(page);
  await page.getByText('Cancel this visit').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, cancel it' }).click();
  await expect(page.getByRole('alert').filter({ hasText: ALERT })).toBeVisible();
  await expect(page.getByText('We could not cancel that visit')).toHaveCount(0);
  await expect(page.getByText('Cancel this visit')).toBeVisible();
});
