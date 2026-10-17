import { test, type Page } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';
const OUT = '/tmp/p18/pam/docs/research/shots/2026-10-17-piper-a94-booked-for-you';
const PROGRAM = '4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a';
const VISIT = '7a1f0f3c-2b11-4c0f-8b64-000000000002';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
async function member(page: Page, lang: string | null) {
  await asMember(page, 'member', lang);
  await page.route('**/rest/v1/notifications*', (r) => r.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (r) => r.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trip_services*', (r) => r.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trip_booked_by*', (r) => r.fulfill(json([{ appointment_id: VISIT }])));
  await page.route('**/rest/v1/rpc/my_trips*', (r) => r.fulfill(json([{ id: VISIT, service_id: PROGRAM, place_name: 'Fresh Start Kitchen', category: 'workforce', address: '1 Main St', lat: 39.95, lon: -75.16, starts_at: new Date(Date.now() + 3 * 86_400_000).toISOString(), note: null, status: 'scheduled' }])));
  await page.route('**/rest/v1/program_policies*', (r) => r.fulfill(json([])));
}
const cases = [['390', 390, 800, 'light', null, 'en'], ['390', 390, 800, 'dark', null, 'en'], ['320', 320, 700, 'light', 'ar', 'ar']] as const;
for (const [w, width, height, scheme, lang, tag] of cases) {
  test(`booked for you ${w} ${scheme} ${tag}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ colorScheme: scheme });
    await member(page, lang);
    await page.goto('/trips/'); await settled(page);
    await page.screenshot({ path: `${OUT}-trips-${w}-${scheme}-${tag}.png` });
    await page.goto('/'); await settled(page);
    await page.screenshot({ path: `${OUT}-explore-${w}-${scheme}-${tag}.png` });
  });
}
