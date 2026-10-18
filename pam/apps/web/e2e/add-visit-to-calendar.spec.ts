import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { settled } from './settled';

/**
 * One visit, from the booked screen (D-604, a98 plan C): a calendar button in the green card opens a sheet of calendars. Apple Calendar and
 * Outlook get a calendar file made on the phone, Google gets a link to its own add-an-event page; the event is the place's name, its address and
 * the time, and nothing says Pam. It all happens on the phone: no request goes anywhere, nothing is stored about which calendar was tapped.
 * Under the card, "Sync all future trip details?" opens the Calendar screen.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('pam.examples', '1'));
});

async function booked(page: Page) {
  await page.goto('/trips/new/?place=dummy-place-learning&name=Example%20Learning%20Center&category=education');
  await settled(page);
  await page.getByRole('button', { name: /^(Mon|Tue|Wed|Thu|Fri), / }).first().click();
  await page.getByRole('button', { name: /AM|PM/ }).first().click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Add this trip' }).click();
  await expect(page.getByRole('heading', { name: 'Your trip is booked' })).toBeVisible();
}

test('the calendar button is in the green card, a 48px target, and opens a sheet of three calendars', async ({ page }) => {
  await booked(page);
  const button = page.getByRole('button', { name: 'Add to calendar' });
  const box = (await button.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(47.5);
  expect(box.height).toBeGreaterThanOrEqual(47.5);
  await button.click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  for (const name of ['Apple Calendar', 'Google Calendar', 'Outlook']) await expect(sheet.getByText(name, { exact: true })).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Close' })).toBeVisible();
  await expect(sheet.getByText('Place, address and time, in the calendar you pick.')).toBeVisible();
});

test('Apple Calendar gets a calendar file made on the phone: the place, its address and the time, and nothing that says Pam', async ({ page }) => {
  await booked(page);
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  const stored = () => page.evaluate(() => JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]));
  const before = await stored();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('dialog').getByText('Apple Calendar', { exact: true }).click()]);
  expect(download.suggestedFilename()).toBe('visit.ics');
  const text = (await readFile((await download.path())!, 'utf8')).replace(/\r\n /g, '');
  const lines = text.split('\r\n');
  expect(lines).toContain('SUMMARY:Example Learning Center');
  expect(lines.some((l) => l.startsWith('LOCATION:'))).toBe(true);
  expect(lines.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(1);
  expect(lines.some((l) => l.startsWith('DTSTART:'))).toBe(true);
  expect(lines.some((l) => l.startsWith('DTEND:'))).toBe(true);
  expect(text).not.toMatch(/Pam visit|URL:|DESCRIPTION|joinpam\.org\/|app\.joinpam/i);
  // Nothing left the phone for this (a file made here is a blob: address), and nothing was kept about which calendar was tapped.
  expect(requests.filter((u) => !u.startsWith('blob:') && !u.startsWith('data:'))).toEqual([]);
  expect(await stored()).toBe(before);
});

test('Outlook gets the same file', async ({ page }) => {
  await booked(page);
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('dialog').getByText('Outlook', { exact: true }).click()]);
  expect(download.suggestedFilename()).toBe('visit.ics');
  expect(await readFile((await download.path())!, 'utf8')).toContain('SUMMARY:Example Learning Center');
});

test('Google gets a link to its own add-an-event page: the place, the address, the time and the time zone, and nothing else', async ({ page }) => {
  await booked(page);
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  const link = page.getByRole('dialog').getByRole('link', { name: 'Google Calendar' });
  const url = new URL((await link.getAttribute('href'))!);
  expect(`${url.origin}${url.pathname}`).toBe('https://calendar.google.com/calendar/render');
  expect([...url.searchParams.keys()].sort()).toEqual(['action', 'ctz', 'dates', 'location', 'text']);
  expect(url.searchParams.get('text')).toBe('Example Learning Center');
  expect(url.searchParams.get('dates')).toMatch(/^\d{8}T\d{6}Z\/\d{8}T\d{6}Z$/);
  expect(url.searchParams.get('ctz')).toBeTruthy();
  await expect(link).toHaveAttribute('target', '_blank');
});

test('under the card, "Sync all future trip details?" opens the Calendar screen, a 48px target', async ({ page }) => {
  await booked(page);
  const sync = page.getByRole('link', { name: 'Sync all future trip details?' });
  const box = (await sync.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(47.5);
  await sync.click();
  await expect(page).toHaveURL(/\/calendar\/$/);
});
