import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { settled } from './settled';

/**
 * One visit, from the booked screen (D-604, a98 plan C): a calendar button in the green card opens a sheet of calendars. Apple Calendar and
 * Outlook get a calendar file made on the phone, Google gets a link to its own add-an-event page; the event is the place's name, its address and
 * the time, and nothing says Pam. It all happens on the phone: no request goes anywhere, nothing is stored about which calendar was tapped.
 * Nothing sits under the card: setting up the calendar link for every visit is the last row of the sheet. Once a visit is added the corner button says so.
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
  const stored = () => page.evaluate(() => JSON.stringify([Object.entries(localStorage).filter(([key]) => !key.startsWith('pam.calendarAdded:')), Object.entries(sessionStorage)]));
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
  expect(requests.filter((u) => !u.startsWith('blob:') && !u.startsWith('data:') && !new URL(u).pathname.match(/\.(svg|png|js|css|woff2?|ico)$/) && !u.includes('/_next/'))).toEqual([]);
  // Nothing else was stored: only the visit's own note, which holds a time, never a calendar.
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

/** The longest example place name, at 320 wide, in the language with the longest words and in the one that reads right to left. */
const LONGEST = 'Example Reentry Employment and Housing Resource Center of North Philadelphia';
for (const locale of ['en', 'ar']) {
  test(`${locale}: the longest place name and the Add to calendar button both fit the card, and do not overlap`, async ({ page }) => {
    await page.addInitScript((code) => localStorage.setItem('pam.locale', code), locale);
    await page.goto(`/trips/new/?place=dummy-place-reentry&name=${encodeURIComponent(LONGEST)}&category=employment`);
    await settled(page);
    await page.getByRole('button', { name: /^(Mon|Tue|Wed|Thu|Fri|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)/ }).first().click();
    await page.getByRole('button', { name: /AM|PM|[٠-٩0-9]+[:٫][٠-٩0-9]+/ }).first().click();
    await page.getByRole('button', { name: /^(Next|التالي)/ }).click();
    await page.getByRole('button', { name: /^(Add this trip|إضافة هذه الزيارة)/ }).click();
    const button = page.locator('button', { has: page.locator('svg') }).filter({ hasText: /Add to calendar|calendar|تقويم/i }).first();
    await expect(button).toBeVisible();
    const card = (await page.getByText(LONGEST, { exact: false }).first().boundingBox())!;
    const b = (await button.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(viewport.width);
    expect(b.height).toBeGreaterThanOrEqual(47.5);
    // Not on top of the title: one is wholly above the other, or they do not share a column.
    const apart = b.y >= card.y + card.height - 1 || card.y >= b.y + b.height - 1 || b.x >= card.x + card.width - 1 || card.x >= b.x + b.width - 1;
    expect(apart).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}

/** The green card abbreviates the month (Will, 18 October): "Monday, Oct 19". Arabic months have no short form and must still read. */
test('the booked card says the month short in English', async ({ page }) => {
  await booked(page);
  await expect(page.getByText(/^(Mon|Tues|Wednes|Thurs|Fri)day, (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}$/)).toBeVisible();
  await expect(page.getByText(/^\w+day, (January|February|March|April|June|July|August|September|October|November|December) \d/)).toHaveCount(0);
});

test('the booked card still reads in Arabic, where months have no short form', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('pam.locale', 'ar'));
  await page.goto('/trips/new/?place=dummy-place-learning&name=Example%20Learning%20Center&category=education');
  await settled(page);
  await page.getByRole('button', { name: /^(الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)/ }).first().click();
  await page.getByRole('button', { name: /AM|PM|[٠-٩0-9]+[:٫][٠-٩0-9]+/ }).first().click();
  await page.getByRole('button', { name: /^التالي/ }).click();
  await page.getByRole('button', { name: /^إضافة هذه الزيارة/ }).click();
  const day = page.getByText(/^(الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)[،,] .*[٠-٩0-9]/);
  await expect(day.first()).toBeVisible();
});

const SYNC = 'Add all your future visits';
const ADDED = 'Added to calendar. Opens Calendar settings.';

test('the drawer ends with "Add all your future visits" and its hint, opening the Calendar screen; nothing sits under the card', async ({ page }) => {
  await booked(page);
  await expect(page.getByText('Sync all future trip details?')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  const sheet = page.getByRole('dialog');
  const rows = await sheet.locator('a, button').evaluateAll((els) => els.map((el) => (el.textContent ?? '').trim()).filter(Boolean));
  const names = rows.filter((text) => /Apple Calendar|Google Calendar|Outlook|Add all your future visits/.test(text));
  expect(names.map((text) => text.replace(/Set up a calendar link once\.$/, '').trim())).toEqual(['Apple Calendar', 'Google Calendar', 'Outlook', SYNC]);
  await expect(sheet.getByText('Set up a calendar link once.')).toBeVisible();
  const row = sheet.getByRole('link', { name: new RegExp(SYNC) });
  // The whole row is the tap (b60's row taps): measure the row, not the words' link inside it.
  const whole = row.locator('xpath=ancestor-or-self::*[contains(@class, "astryx-item")][1]');
  expect((await whole.boundingBox())!.height).toBeGreaterThanOrEqual(47.5);
  await row.click();
  await expect(page).toHaveURL(/\/calendar\/$/);
});

test('adding a visit: the corner says Added, opens Calendar, is 48px; only the visit id and its start time are kept, and nothing is sent', async ({ page }) => {
  await booked(page);
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  const keys = () => page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('pam.')).sort());
  const before = await keys();
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('dialog').getByText('Apple Calendar', { exact: true }).click()]);
  expect(download.suggestedFilename()).toBe('visit.ics');
  const added = page.getByRole('link', { name: ADDED });
  await expect(added).toBeVisible();
  await expect(added).toContainText('Added to calendar');
  await expect(added).toHaveAttribute('href', '/calendar/');
  expect((await added.boundingBox())!.height).toBeGreaterThanOrEqual(47.5);
  await expect(page.getByRole('button', { name: 'Add to calendar' })).toHaveCount(0);
  // One new key, "pam.calendarAdded:<visit id>", and its value is the visit's start time, nothing else.
  const after = await keys();
  const fresh = after.filter((key) => !before.includes(key));
  expect(fresh).toHaveLength(1);
  expect(fresh[0]).toMatch(/^pam\.calendarAdded:./);
  const value = await page.evaluate((key) => localStorage.getItem(key), fresh[0]!);
  expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  // Nothing went anywhere for this: only the file made here.
  // (The page's own icon and scripts are the page; nothing to Supabase, a function or another host.)
  expect(requests.filter((u) => !u.startsWith('blob:') && !u.startsWith('data:') && !new URL(u).pathname.match(/\.(svg|png|js|css|woff2?|ico)$/) && !u.includes('/_next/'))).toEqual([]);
  // It is still Added after the page is opened again.
  await page.reload();
  await settled(page);
  await expect(page.getByRole('link', { name: ADDED })).toBeVisible();
});

test('a visit that moved after it was added asks to be added again', async ({ page }) => {
  await booked(page);
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('dialog').getByText('Outlook', { exact: true }).click()]);
  void download;
  await expect(page.getByRole('link', { name: ADDED })).toBeVisible();
  // The visit's time changes: the note holds the time it had when it was added.
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('pam.calendarAdded:')) localStorage.setItem(key, '2020-01-01T10:00:00.000Z');
  });
  await page.reload();
  await settled(page);
  await expect(page.getByRole('button', { name: 'Add to calendar' })).toBeVisible();
  const line = page.getByText('Your calendar has the old time.');
  await expect(line).toBeVisible();
  // Inside the green card, between the countdown and its divider, not under it (Dot's drawing).
  const card = (await page.getByText('Change appointment').locator('xpath=ancestor::*[contains(@class,"astryx-card")][1]').boundingBox())!;
  const at = (await line.boundingBox())!;
  expect(at.y).toBeGreaterThanOrEqual(card.y);
  expect(at.y + at.height).toBeLessThanOrEqual(card.y + card.height);
  expect(at.y).toBeLessThan((await page.getByText('Change appointment').boundingBox())!.y);
  // A screen reader gets the whole sentence, in the same element.
  await expect(page.getByText('This visit changed after you added it. Your calendar has the old time.')).toHaveCount(1);
});

test('the place page\'s green card has the same button, and Added after one is added', async ({ page }) => {
  await page.goto('/place/?id=dummy-place-learning&from=trips&trip=dummy-trip-1');
  await settled(page);
  await expect(page.getByText('Your next visit')).toBeVisible();
  // In the card's corner beside "Your next visit", not on a row of its own (Will; Dot's drawing): the same line, measured.
  const title = (await page.getByText('Your next visit').boundingBox())!;
  const corner = (await page.getByRole('button', { name: 'Add to calendar' }).boundingBox())!;
  expect(Math.abs(corner.y + corner.height / 2 - (title.y + title.height / 2))).toBeLessThan(30);
  expect(corner.x).toBeGreaterThan(title.x + title.width - 1);
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('dialog').getByText('Apple Calendar', { exact: true }).click()]);
  expect(download.suggestedFilename()).toBe('visit.ics');
  await expect(page.getByRole('link', { name: ADDED })).toBeVisible();
  await expect(page.getByText('Sync all future trip details?')).toHaveCount(0);
});

/** A member who already has a calendar link: every visit reaches their calendar by itself, so the card says Added. */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
test('a member with a calendar link sees Added at once', async ({ page }) => {
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
  await page.route('**/rest/v1/rpc/calendar_link_state*', (route) =>
    route.fulfill(json([{ is_on: true, is_legacy: false, calendar: 'google', linked_on: '2026-10-12', token: 'A'.repeat(22) + 'b'.repeat(43) }])),
  );
  await booked(page);
  await expect(page.getByRole('link', { name: ADDED })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to calendar' })).toHaveCount(0);
});
