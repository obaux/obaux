import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * A booked visit is one widget on its place (a91 part 3): "Check in" and "Change" are views of the card, who sees the visit is behind
 * the eye, and nothing jumps. Supabase is stubbed.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const PLACE = '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11';
const VISIT = '7a1f0f3c-2b11-4c0f-8b64-000000000009';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();

async function open(page: Page, startsAt: string, opts: { hasLead?: boolean; status?: string } = {}) {
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
    route.fulfill(json([{ id: VISIT, service_id: PLACE, place_name: 'Riverside Job Center', category: 'workforce', address: '1234 Market St', lat: 39.95, lon: -75.16, starts_at: startsAt, note: null, status: opts.status ?? 'scheduled' }])),
  );
  await page.route('**/rest/v1/rpc/service_detail*', (route) =>
    route.fulfill(json([{ id: PLACE, name: 'Riverside Job Center', lookup_name: 'RIVERSIDE JOB CENTER', category: 'workforce', subcategory: null, address: '1234 Market St', phone: null, place_id: null, lat: 39.95, lon: -75.16, description_plain: 'Jobs.', website: null, audience: null, hours: null }])),
  );
  await page.route('**/rest/v1/rpc/service_has_lead*', (route) => route.fulfill(json(opts.hasLead ?? true)));
  await page.goto(`/place/?id=${PLACE}&from=trips&trip=${VISIT}`);
  await settled(page);
}

test('a visit days away: footer is Change alone; Change shows Change date and time and Cancel, each with Back', async ({ page }) => {
  await open(page, hoursFromNow(72));
  await expect(page.getByText('Your next visit')).toBeVisible();
  await expect(page.getByRole('button', { name: "I'm here" })).toHaveCount(0);
  await page.getByRole('button', { name: 'Change', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Change date and time' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel this visit' })).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: 'Cancel this visit' })).toHaveCount(0);
});

test('who sees the visit is behind the eye, not a banner under the card', async ({ page }) => {
  await open(page, hoursFromNow(72));
  // The sentence is not on the page until the eye is opened.
  await expect(page.getByText(/will see your visit/i)).toHaveCount(0);
  await page.getByRole('button', { name: 'Who sees this visit' }).click();
  await expect(page.getByRole('dialog').getByText(/Riverside Job Center will see your visit/)).toBeVisible();
});

test('a place with no program on Pam says so in the eye', async ({ page }) => {
  await open(page, hoursFromNow(72), { hasLead: false });
  await page.getByRole('button', { name: 'Who sees this visit' }).click();
  await expect(page.getByRole('dialog').getByText(/Pam does not tell Riverside Job Center you are coming/)).toBeVisible();
});

test('in its window the footer offers I\'m here and Change; the card does not change height between views', async ({ page }) => {
  await open(page, hoursFromNow(0.5));
  await expect(page.getByRole('button', { name: "I'm here" })).toBeVisible();
  const card = page.getByText('Your next visit').locator('xpath=ancestor::*[contains(@class,"x")][3]');
  const before = (await card.boundingBox())?.height;
  await page.getByRole('button', { name: "I'm here" }).click();
  await expect(page.getByRole('button', { name: 'I went' })).toBeVisible();
  const after = (await card.boundingBox())?.height;
  expect(after).toBe(before);
});

test('a marked visit has no buttons, and says so', async ({ page }) => {
  await open(page, hoursFromNow(-1), { status: 'attended' });
  await expect(page.getByText('Your visit is marked.')).toBeVisible();
  await expect(page.getByRole('button', { name: "I'm here" })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Change', exact: true })).toHaveCount(0);
});

test('Cancel this visit from the Change view asks first, and cancelling asks the database', async ({ page }) => {
  const cancelled: unknown[] = [];
  await page.route('**/rest/v1/rpc/cancel_trip*', (route) => {
    cancelled.push(route.request().postDataJSON());
    return route.fulfill(json({ id: VISIT, status: 'cancelled' }));
  });
  await open(page, hoursFromNow(72));
  await page.getByRole('button', { name: 'Change', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel this visit' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(cancelled).toHaveLength(0);
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, cancel it' }).click();
  await expect(page).toHaveURL(/\/trips\/$/);
  expect(cancelled).toEqual([{ p_id: VISIT }]);
});
