import { expect, test } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';

/** A trip card's time stays whole (Iris, b54, a95 polish): at 320 "10:00 AM" was "10:00" over "AM". */
const VISIT = '7a1f0f3c-2b11-4c0f-8b64-000000000002';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
// The browser's clock is UTC here, so 10:00Z is "10:00 AM" on the card whatever machine the test runs on.
test.use({ timezoneId: 'UTC' });
const tenInTheMorning = () => {
  const d = new Date(Date.now() + 3 * 86_400_000);
  d.setUTCHours(10, 0, 0, 0);
  return d.toISOString();
};

test('the time on a trip card is on one line, whatever the width', async ({ page }) => {
  await asMember(page);
  // Some phones' time formats put a plain space before AM/PM (this Chromium puts a no-break one, so the bug hid here): make it plain, as it
  // is where Iris saw "10:00" over "AM".
  await page.addInitScript(() => {
    Object.defineProperty(Intl.DateTimeFormat.prototype, 'format', {
      configurable: true,
      get(this: Intl.DateTimeFormat) {
        return (date?: Date | number) =>
          this.formatToParts(date).map((p) => p.value).join('').replace(/[\u202f\u00a0]/g, ' ');
      },
    });
  });
  await page.route('**/rest/v1/rpc/my_trip_services*', (r) => r.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trip_booked_by*', (r) => r.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trips*', (r) =>
    r.fulfill(json([{ id: VISIT, service_id: '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11', place_name: 'Riverside Job Center', category: 'workforce', address: '1 Main St', lat: 39.95, lon: -75.16, starts_at: tenInTheMorning(), note: null, status: 'scheduled' }])),
  );
  await page.route('**/rest/v1/program_policies*', (r) => r.fulfill(json([])));
  await page.goto('/trips/');
  await settled(page);
  const linesOfTheTime = () =>
    page.evaluate(() => {
      // Only the card has the time in it (the map's pin says just the day).
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = walker.nextNode())) {
        const m = /10:00\s*AM/.exec(n.textContent ?? '');
        if (m) {
          const range = document.createRange();
          range.setStart(n, m.index);
          range.setEnd(n, m.index + m[0].length);
          return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
        }
      }
      return -1;
    });
  // Whether "AM" falls off the line depends on how wide the card is, so it is checked across the narrow phones, 4px apart: without the
  // fix some of these widths split it.
  const split: number[] = [];
  for (let width = 280; width <= 400; width += 4) {
    await page.setViewportSize({ width, height: 640 });
    const lines = await linesOfTheTime();
    if (lines !== 1) split.push(width);
  }
  expect(split, 'widths at which "10:00 AM" is not on one line (or is not found)').toEqual([]);
});
