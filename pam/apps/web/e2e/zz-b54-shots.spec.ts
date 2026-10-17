import { test } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';
const OUT = process.env['SHOT_PREFIX']!;
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
for (const [s, w, h] of [['320x568', 320, 568], ['390x800', 390, 800]] as const) {
  for (const lang of ['en', 'ar']) {
    test(`when ${s} ${lang}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.addInitScript(() => window.sessionStorage.setItem('pam.examples', '1'));
      await asMember(page, 'member', lang === 'en' ? null : lang);
      await page.goto('/trips/new/?place=dummy-place-learning');
      await settled(page);
      await page.screenshot({ path: `${OUT}-when-${s}-${lang}.png` });
    });
  }
}
test('trip card 320', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await asMember(page);
  const d = new Date(Date.now() + 3 * 86_400_000); d.setUTCHours(10, 0, 0, 0);
  await page.route('**/rest/v1/rpc/my_trip_services*', (r) => r.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trip_booked_by*', (r) => r.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trips*', (r) => r.fulfill(json([{ id: 'v1', service_id: '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11', place_name: 'Riverside Job Center', category: 'workforce', address: '1 Main St', lat: 39.95, lon: -75.16, starts_at: d.toISOString(), note: null, status: 'scheduled' }])));
  await page.route('**/rest/v1/program_policies*', (r) => r.fulfill(json([])));
  await page.goto('/trips/'); await settled(page);
  await page.screenshot({ path: `${OUT}-tripcard-320.png` });
});
