import { expect, test, type Page } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';

/**
 * A program lead books a visit for a member who has written to the program, for real (D-595, a94). The lead's
 * confirmation says "Booked", not "Example"; the member's Trips and Explore say who booked it; the bell tells them;
 * the case manager is told "Booked by {program}". Supabase is stubbed.
 */
const MEMBER = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const JORDAN = '7c1f8c1e-1c7e-4a5c-9d6e-0f3a2b4c5d6e';
const ORG = '22222222-0000-0000-0000-0000000000aa';
const PROGRAM = '4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a';
const VISIT = '7a1f0f3c-2b11-4c0f-8b64-000000000002';
const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

test('a lead books for a member who wrote: the database is asked, and the screen says Booked, never Example', async ({ page }) => {
  await asMember(page, 'provider');
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: MEMBER, org_id: ORG, role: 'provider', first_name: 'Lou', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
  );
  let asked: Record<string, unknown> | null = null;
  await page.route('**/rest/v1/rpc/book_visit_for_member*', (route) => {
    asked = route.request().postDataJSON();
    return route.fulfill(json({ id: VISIT, starts_at: inDays(3) }));
  });
  await page.goto(
    `/trips/new/?${new URLSearchParams({ place: PROGRAM, name: 'Fresh Start Kitchen', category: 'workforce', address: '1 Main St', for: JORDAN, forName: 'Jordan' })}`,
  );
  await settled(page);
  await page.getByRole('button', { name: /^\w{3}, / }).first().click();
  await page.getByRole('button', { name: '10:30 AM' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  // No "Example trips only for now" ending: this one is saved.
  await expect(page.getByText(/Example trips only for now/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Book for Jordan' }).click();
  await expect(page.getByRole('heading', { name: 'Booked for Jordan!' })).toBeVisible();
  await expect(page.getByText(/Example/)).toHaveCount(0);
  expect(asked).toMatchObject({ p_member_id: JORDAN, p_service_id: PROGRAM });
});

// Every refusal book_visit_for_member can raise says what is true (Iris, b58): not "Try again", which can never work for a refusal.
const REFUSED = [
  ['MEMBER_NOT_LINKED', 'Pam cannot book a visit for Jordan right now.'],
  ['ALREADY_BOOKED', 'Jordan already has a visit here at about that time. Pick a different time.'],
  ['RATE_LIMIT', 'You have booked as many visits as Pam allows today. Try again tomorrow.'],
  ['TRIP_IN_THE_PAST', 'That time has already passed. Pick a later time.'],
  ['TRIP_TOO_FAR', 'A visit can be booked up to about six months ahead. Pick an earlier day.'],
  ['PLACE_NOT_FOUND', 'You cannot book a visit at Fresh Start Kitchen right now.'],
  ['SERVICE_NOT_FOUND', 'You cannot book that service right now. Pick another one.'],
] as const;
for (const [code, words] of REFUSED) {
  test(`a lead whose booking is refused (${code}) is told why, and not told it was booked or to try again`, async ({ page }) => {
    await asMember(page, 'provider');
    await page.route('**/rest/v1/profiles*', (route) =>
      route.fulfill(json({ id: MEMBER, org_id: ORG, role: 'provider', first_name: 'Lou', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
    );
    await page.route('**/rest/v1/rpc/book_visit_for_member*', (route) =>
      route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: code }) }),
    );
    await page.goto(
      `/trips/new/?${new URLSearchParams({ place: PROGRAM, name: 'Fresh Start Kitchen', category: 'workforce', address: '1 Main St', for: JORDAN, forName: 'Jordan' })}`,
    );
    await settled(page);
    await page.getByRole('button', { name: /^\w{3}, / }).first().click();
    await page.getByRole('button', { name: '10:30 AM' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Book for Jordan' }).click();
    await expect(page.getByText(words, { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Booked for/ })).toHaveCount(0);
    // Not the generic message, and no way to ask Pam about something only a different choice fixes.
    await expect(page.getByText(/Try again\. If it keeps happening/)).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Contact Pam' })).toHaveCount(0);
  });
}

test('any other failure keeps the generic message: it may work on a second try', async ({ page }) => {
  await asMember(page, 'provider');
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: MEMBER, org_id: ORG, role: 'provider', first_name: 'Lou', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
  );
  await page.route('**/rest/v1/rpc/book_visit_for_member*', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'something else' }) }),
  );
  await page.goto(
    `/trips/new/?${new URLSearchParams({ place: PROGRAM, name: 'Fresh Start Kitchen', category: 'workforce', address: '1 Main St', for: JORDAN, forName: 'Jordan' })}`,
  );
  await settled(page);
  await page.getByRole('button', { name: /^\w{3}, / }).first().click();
  await page.getByRole('button', { name: '10:30 AM' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Book for Jordan' }).click();
  await expect(page.getByText(/Try again\. If it keeps happening/)).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Booked for/ })).toHaveCount(0);
});

async function asRealMember(page: Page, booked: boolean) {
  await asMember(page, 'member');
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trip_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trip_booked_by*', (route) => route.fulfill(json(booked ? [{ appointment_id: VISIT }] : [])));
  await page.route('**/rest/v1/rpc/my_trips*', (route) =>
    route.fulfill(
      json([
        { id: VISIT, service_id: PROGRAM, place_name: 'Fresh Start Kitchen', category: 'workforce', address: '1 Main St', lat: 39.95, lon: -75.16, starts_at: inDays(3), note: null, status: 'scheduled' },
      ]),
    ),
  );
  await page.route('**/rest/v1/program_policies*', (route) => route.fulfill(json([])));
}

test('the member\'s Trips and Explore cards say "Booked for you", and nothing about which program', async ({ page }) => {
  // Will, 17 October 15:21: under the trip card "booked for you", that's it: the card's title already names the place.
  await asRealMember(page, true);
  await page.goto('/trips/');
  await settled(page);
  await expect(page.getByText('Booked for you', { exact: true })).toBeVisible();
  await expect(page.getByText(/Booked for you by/)).toHaveCount(0);
  await page.goto('/');
  await settled(page);
  await expect(page.getByText('Booked for you', { exact: true })).toBeVisible();
  await expect(page.getByText(/Booked for you by/)).toHaveCount(0);
});

test('a visit the member planned says nothing about a program', async ({ page }) => {
  await asRealMember(page, false);
  await page.goto('/trips/');
  await settled(page);
  await expect(page.getByText(/Booked for you/)).toHaveCount(0);
});

test('the bell tells the member, in the app only, with the time in their words', async ({ page }) => {
  await asMember(page, 'member');
  await page.route('**/rest/v1/notifications*', (route) =>
    route.fulfill(
      json([
        {
          id: 'n1', kind: 'visit_booked_for_you', body_key: 'notify.visit_booked_for_you',
          body_vars: { place: 'Fresh Start Kitchen', placeId: PROGRAM, startsAt: inDays(3) },
          subject_type: 'appointment', subject_id: VISIT, created_at: new Date().toISOString(), read_at: null,
        },
      ]),
    ),
  );
  await page.goto('/notifications/');
  await settled(page);
  await expect(page.getByText(/Fresh Start Kitchen booked a visit for you:/)).toBeVisible();
  await expect(page.getByText('Visit booked for you')).toBeVisible();
});
