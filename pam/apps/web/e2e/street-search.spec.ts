import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * Street addresses and corners in the area search, from Google through Pam's server (D-552). Pam's own list answers first; Google is
 * asked only for an address, a corner, or what Pam's list has no match for; the phone never calls Google; and with no key the search is
 * exactly what it was.
 */
const AREAS = '**/rest/v1/rpc/search_areas*';
const FUNCTION = '**/functions/v1/places-search';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const ZIPS = [
  { id: 'a1', kind: 'zip', label: '19104', lat: 39.963788, lon: -75.202914 },
  { id: 'a3', kind: 'landmark', label: 'City Hall', lat: 39.9526, lon: -75.1652 },
];
const FISHTOWN = [{ id: 'n1', kind: 'neighborhood', label: 'Fishtown - Lower Kensington', lat: 39.97289, lon: -75.12471 }];

async function open(page: Page, { enabled = true } = {}) {
  const asked: Record<string, unknown>[] = [];
  const outside: string[] = [];
  page.on('request', (request) => {
    if (/googleapis\.com|google\.com\/maps/.test(request.url())) outside.push(request.url());
  });
  // Pam's own list: a few ZIPs when nothing is typed, Fishtown for "fish", nothing for anything else.
  await page.route(AREAS, (route) => {
    const q = String((route.request().postDataJSON() as { p_query?: string }).p_query ?? '').toLowerCase();
    return route.fulfill(json(q === '' ? ZIPS : q.includes('fish') ? FISHTOWN : []));
  });
  await page.route('**/rest/v1/rpc/services_near*', (route) => route.fulfill(json([])));
  await page.route(FUNCTION, (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    // "Is it on?" asks Google nothing and is not counted with the questions about what was typed.
    if (body['action'] === 'status') return route.fulfill(json({ enabled }));
    asked.push(body);
    if (!enabled) return route.fulfill(json({ enabled: false }));
    if (body['action'] === 'choose') {
      return route.fulfill(json({ enabled: true, place: { label: '1500 Market St, Philadelphia, PA 19102', lat: 39.9526, lon: -75.1664 } }));
    }
    return route.fulfill(
      json({
        enabled: true,
        suggestions: [
          { placeId: 'ChIJ1500marketstreet', label: '1500 Market St, Philadelphia, PA' },
          { placeId: 'ChIJ1500marketstreet2', label: '1500 Market St Unit B, Philadelphia, PA' },
        ],
      }),
    );
  });
  await page.goto('/places/');
  await settled(page);
  await page.getByRole('button', { name: 'Change the area' }).click();
  return { asked, outside, box: page.getByRole('textbox', { name: /ZIP code/ }) };
}

test.describe('street search', () => {
  test('an address: Pam’s list first, Google’s rows below with its mark; picking one sets the area', async ({ page }) => {
    const { asked, outside, box } = await open(page);
    // With a key, the field says an address works (Sage, 13 October): the street label and hint, not the old ones.
    await expect(page.getByRole('textbox', { name: 'ZIP code, neighborhood or address' })).toBeVisible();
    await expect(page.getByText('Like 19107, Fishtown, or Broad and Girard.')).toBeVisible();
    await box.fill('1500 Market');
    await expect(page.getByRole('button', { name: /^1500 Market St, Philadelphia, PA/ })).toBeVisible();
    // Under option A a pick is never kept, and the row says so where it is picked, like "Use my current location".
    await expect(page.getByRole('button', { name: /^1500 Market St, Philadelphia, PA.*Used for this search only\./ }).first()).toBeVisible();
    await expect(page.locator('[data-google-attribution]')).toBeVisible();
    // The mark and the footer line under it are centred on one line (Will, 13 October).
    const mark = await page.locator('[data-google-attribution]').boundingBox();
    const footer = await page.getByText('Pam remembers the area you pick on this phone only.').boundingBox();
    expect(Math.abs(mark!.x + mark!.width / 2 - (footer!.x + footer!.width / 2))).toBeLessThan(2);
    // The function got the words and a session token, and nothing else; the phone itself never spoke to Google.
    expect(asked[0]).toEqual({ action: 'suggest', q: '1500 Market', token: expect.stringMatching(/^[0-9a-f]{32}$/) });
    expect(outside).toEqual([]);

    await page.getByRole('button', { name: /^1500 Market St, Philadelphia, PA/ }).click();
    await expect.poll(() => asked.some((body) => body['action'] === 'choose')).toBe(true);
    // The pick ends the search session: the choose call carries the same token the suggestions did.
    expect(asked.at(-1)).toEqual({ action: 'choose', placeId: 'ChIJ1500marketstreet', token: (asked[0] as { token: string }).token });
    await page.getByRole('button', { name: 'Done' }).click();
    // Only the ZIP on the chip, to save room on the main screen (Will, 13 October); the point still orders the places.
    await expect(page.getByRole('button', { name: 'Near 19102' })).toBeVisible();
    await expect(page.getByText('1500 Market St, Philadelphia, PA 19102')).toHaveCount(0);
    // Used for this search only (Mira, 13 October): nothing about it is written to the phone, and the next visit starts from City Hall.
    expect(await page.evaluate(() => JSON.stringify([window.localStorage, window.sessionStorage]) + String(window.localStorage.getItem('pam.origin')))).not.toMatch(/Market|39\.95|google:/);
    expect(page.url()).not.toMatch(/Market|39\.95|-75\.16/);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Near City Hall' })).toBeVisible();
  });

  test('a corner and a place by name are asked of Google; a ZIP, a neighborhood and a bare number are not', async ({ page }) => {
    const { asked, box } = await open(page);
    await box.fill('19104');
    await box.fill('fish');
    await box.fill('1500');
    await page.waitForTimeout(900);
    expect(asked).toEqual([]);
    await box.fill('Broad and Erie');
    await expect.poll(() => asked.length).toBe(1);
    await box.fill('Temple Hospital');
    await expect.poll(() => asked.length).toBe(2);
    expect(asked.map((body) => body['q'])).toEqual(['Broad and Erie', 'Temple Hospital']);
  });

  test('typing waits for a pause: one question per pause, not one per letter', async ({ page }) => {
    const { asked, box } = await open(page);
    await box.pressSequentially('1500 Market St', { delay: 60 });
    await expect(page.getByRole('button', { name: /^1500 Market St, Philadelphia, PA/ })).toBeVisible();
    expect(asked.length).toBeLessThanOrEqual(2);
    expect(asked.at(-1)).toMatchObject({ q: '1500 Market St' });
  });

  test('with no key the search is exactly what it was: the old label and hint, no question about what was typed, no Google rows, no mark, no error', async ({ page }) => {
    const { asked, box } = await open(page, { enabled: false });
    // No key: the old label and hint stay, with nothing about an address.
    await expect(page.getByText('Like 19107, or Fishtown.')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'ZIP code, neighborhood or address' })).toHaveCount(0);
    await box.fill('1500 Market');
    await page.waitForTimeout(900);
    await box.fill('Broad and Erie');
    await page.waitForTimeout(900);
    // "Is it on?" said no once; nothing typed was ever sent anywhere.
    expect(asked).toEqual([]);
    await expect(page.locator('[data-google-attribution]')).toHaveCount(0);
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
  });

  test('has no WCAG A/AA violations with Google’s rows showing', async ({ page }) => {
    const { box } = await open(page);
    await box.fill('1500 Market');
    await expect(page.locator('[data-google-attribution]')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
