import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';
import { asMember } from './asMember';

/**
 * Explore's one search field (D-573): inline, typing filters the list right under it. Only Pam's programs ever show. A typed address that no
 * program matches is turned into a point by Pam's server and the list is the programs nearest it; nothing is asked of Google otherwise.
 */
const AREAS = '**/rest/v1/rpc/search_areas*';
const PROGRAMS = '**/rest/v1/rpc/services_search*';
const NEAR = '**/rest/v1/rpc/services_near*';
const FUNCTION = '**/functions/v1/places-search';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const row = (id: string, name: string, address: string, meters: number, category = 'family_services') => ({
  id, name, lookup_name: name.toUpperCase(), category, subcategory: null, address, phone: null, place_id: null,
  lat: null, lon: null, meters, has_hours: false, description_plain: 'An example program.', website: null, audience: null, hours: null,
});
const ALL = [
  row('a1000000-0000-4000-8000-000000000001', 'Example Learning Hub', '1600 Arch St Philadelphia, PA 19103', 540, 'education'),
  row('a1000000-0000-4000-8000-000000000002', 'Example Work Center', '1100 Chestnut St Philadelphia, PA 19107', 1120, 'workforce'),
];
const FOOD = [
  row('f1000000-0000-4000-8000-000000000001', 'Example Food Pantry', '2210 Spring Garden St Philadelphia, PA 19130', 2253),
  row('f1000000-0000-4000-8000-000000000002', 'Example Community Kitchen', '1420 Market St Philadelphia, PA 19102', 322),
];
const NEAREST = [row('b1000000-0000-4000-8000-000000000001', 'Example Market Street Clinic', '1500 Market St Philadelphia, PA 19102', 40)];

async function open(page: Page, opts: { language?: string; areas?: unknown[]; enabled?: boolean | 'unreadable'; programs?: (q: string) => unknown[] | 'fail'; role?: 'member' | 'admin'; path?: string } = {}) {
  const { language = null, areas = [], enabled = true, programs = (q) => (/food/i.test(q) ? FOOD : []), role = 'member', path = '/' } = opts;
  await asMember(page, role, language);
  const asked: Record<string, unknown>[] = [];
  const nearAsked: Record<string, unknown>[] = [];
  const outside: string[] = [];
  page.on('request', (request) => {
    if (/googleapis\.com|google\.com\/maps/.test(request.url())) outside.push(request.url());
  });
  await page.route(AREAS, (route) => route.fulfill(json(areas)));
  await page.route(PROGRAMS, (route) => {
    const q = String((route.request().postDataJSON() as { p_query?: string }).p_query ?? '');
    const answer = programs(q);
    return answer === 'fail' ? route.fulfill({ status: 500, body: '{}' }) : route.fulfill(json(answer));
  });
  await page.route(NEAR, (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    nearAsked.push(body);
    // Measured from the typed address: the programs nearest it; otherwise the ordinary list.
    return route.fulfill(json(Math.abs(Number(body['p_lat']) - 39.9526) < 0.0003 && Math.abs(Number(body['p_lon']) + 75.1664) < 0.0003 ? NEAREST : ALL));
  });
  await page.route(FUNCTION, (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    if (body['action'] === 'status') {
      return enabled === 'unreadable' ? route.fulfill({ status: 500, body: '{}' }) : route.fulfill(json({ enabled }));
    }
    asked.push(body);
    if (body['action'] === 'choose') {
      return route.fulfill(json({ enabled: true, place: { label: '1500 Market St, Philadelphia, PA 19102', lat: 39.9526, lon: -75.1664 } }));
    }
    // One place per address (its first eleven characters), so a longer text for the same address leads to the same place.
    const q = String(body['q'] ?? '');
    return route.fulfill(json({ enabled: true, suggestions: [{ placeId: q.length >= 11 ? 'ChIJ1500marketstreet' : `ChIJshort${q.length}xxxxx`, label: '1500 Market St, Philadelphia, PA' }] }));
  });
  await page.goto(path);
  await settled(page);
  return { asked, nearAsked, outside, box: page.getByRole('textbox', { name: /Search programs/ }) };
}

test.describe('one search field', () => {
  test('is inline: nothing opens, no dropdown, no Cancel; the chips and the Near control stay', async ({ page }) => {
    const { box } = await open(page);
    await expect(box).toHaveAttribute('placeholder', 'Search programs');
    await expect(box).toHaveAccessibleName('Search programs by name or address');
    await box.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'School and training' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Near City Hall' })).toBeVisible();
    await box.fill('food');
    await expect(page.getByRole('button', { name: 'School and training' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Near City Hall' })).toBeVisible();
  });

  test('program words filter the list under it, and nothing about them goes to Google', async ({ page }) => {
    const { box, asked, outside } = await open(page);
    await box.fill('food');
    await expect(page.getByRole('heading', { name: 'Results for “food”' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Example Food Pantry' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Example Community Kitchen' })).toBeVisible();
    await page.waitForTimeout(1200);
    expect(asked).toEqual([]);
    expect(outside).toEqual([]);
    await expect(page.locator('[data-google-attribution]')).toHaveCount(0);
    await expect(page.getByText(/^Nearest to/)).toHaveCount(0);
  });

  test('clearing brings the normal list back and keeps the keyboard up', async ({ page }) => {
    const { box } = await open(page);
    await box.fill('food');
    await expect(page.getByRole('heading', { name: 'Example Food Pantry' })).toBeVisible();
    const clear = page.getByRole('button', { name: /^Clear/ });
    await clear.click();
    await expect(box).toHaveValue('');
    await expect(box).toBeFocused();
    await expect(page.getByRole('heading', { name: 'All programs' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Example Learning Hub' })).toBeVisible();
  });

  test('nothing matched: one short line and a way to clear it', async ({ page }) => {
    const { box } = await open(page);
    await box.fill('zzzz');
    await expect(page.getByRole('heading', { name: 'Nothing matched that.' })).toBeVisible();
    // Two buttons are named Clear search: the one in the field, and the one under "Nothing matched that."
    await page.getByRole('button', { name: 'Clear search' }).last().click();
    await expect(page.getByRole('heading', { name: 'All programs' })).toBeVisible();
  });

  test('an address no program matches: the heading says what was typed, the control says Near 19102, Pam’s programs nearest it, Google’s mark', async ({ page }) => {
    const { box, asked, nearAsked, outside } = await open(page);
    await box.fill('1500 Market');
    await expect(page.getByRole('heading', { name: 'Results for “1500 Market”' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Near 19102' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Example Market Street Clinic' })).toBeVisible();
    await expect(page.getByText(/^Nearest to/)).toHaveCount(0);
    // Google's mark, left-aligned under the heading row, 18px.
    const mark = page.locator('[data-google-attribution]');
    await expect(mark).toBeVisible();
    const logo = page.locator('[data-google-attribution] img[alt="Google Maps"]');
    expect(Math.round((await logo.boundingBox())!.height)).toBe(18);
    const heading = (await page.getByRole('heading', { name: 'Results for “1500 Market”' }).boundingBox())!;
    expect(Math.abs((await logo.boundingBox())!.x - heading.x)).toBeLessThan(3);
    // Two calls, the same two as the drawer: the words and a session token, then the first suggestion's id and the same token.
    expect(asked).toEqual([
      { action: 'suggest', q: '1500 Market', token: expect.stringMatching(/^[0-9a-f]{32}$/) },
      { action: 'choose', placeId: 'ChIJ1500marketstreet', token: expect.stringMatching(/^[0-9a-f]{32}$/) },
    ]);
    expect((asked[0] as { token: string }).token).toBe((asked[1] as { token: string }).token);
    expect(outside).toEqual([]);
    // Nothing from Google but its mark: no address, no suggestion row, no dropdown.
    await expect(page.getByText('1500 Market St, Philadelphia, PA')).toHaveCount(0);
    await expect(page.getByRole('listbox')).toHaveCount(0);
    // The point stays in memory: nothing is written to the phone or the address.
    expect(await page.evaluate(() => JSON.stringify([window.localStorage, window.sessionStorage]))).not.toMatch(/Market|39\.95|google:/);
    expect(page.url()).not.toMatch(/Market|39\.95|-75\.16/);
    expect(nearAsked.some((body) => Math.abs(Number(body['p_lat']) - 39.9526) < 0.0003)).toBe(true);
    // Clearing brings the normal list back, and the control says the area as before.
    await page.getByRole('button', { name: /^Clear/ }).first().click();
    await expect(page.getByRole('button', { name: 'Near City Hall' })).toBeVisible();
    await expect(page.locator('[data-google-attribution]')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Example Learning Hub' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Near City Hall' })).toBeVisible();
  });

  test('a pick in the drawer wins over a typed address: it clears the box and sets Near for real', async ({ page }) => {
    const { box } = await open(page, { areas: [{ id: 'a1', kind: 'zip', label: '19104', lat: 39.963788, lon: -75.202914 }] });
    await box.fill('1500 Market');
    await expect(page.getByRole('button', { name: 'Near 19102' })).toBeVisible();
    await page.getByRole('button', { name: 'Near 19102' }).click();
    await page.getByRole('button', { name: /^19104/ }).click();
    await expect(box).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Near 19104' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Near 19104' })).toBeVisible();
  });

  test('an address with no programs near it: Nothing matched that., and Near 19102 still says where it looked', async ({ page }) => {
    const { box } = await open(page);
    await page.route(NEAR, (route) => route.fulfill(json([])));
    await box.fill('1500 Market');
    await expect(page.getByRole('heading', { name: 'Nothing matched that.' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Near 19102' })).toBeVisible();
  });

  test('Place Details is frugal: three bursts of typing cost one choose, and a longer text for the same place costs none', async ({ page }) => {
    const { box, asked } = await open(page);
    // Three bursts with pauses long enough for each to be asked about (400 ms + the round trip), but not long enough to settle.
    await box.pressSequentially('1500 M', { delay: 40 });
    await page.waitForTimeout(900);
    await box.pressSequentially('arket', { delay: 40 });
    await page.waitForTimeout(900);
    await box.pressSequentially(' St', { delay: 40 });
    await expect(page.getByRole('heading', { name: 'Results for “1500 Market St”' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Near 19102' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Example Market Street Clinic' })).toBeVisible();
    const chooses = () => asked.filter((body) => body['action'] === 'choose').length;
    const suggests = () => asked.filter((body) => body['action'] === 'suggest').length;
    expect(chooses()).toBe(1);
    // One Autocomplete per pause, no more than the bursts (and at least the two that were waited for).
    expect(suggests()).toBeGreaterThanOrEqual(2);
    expect(suggests()).toBeLessThanOrEqual(4);
    // The same place for a longer text: reused, no second Place Details call.
    await box.pressSequentially(' A', { delay: 40 });
    await expect(page.getByRole('heading', { name: 'Results for “1500 Market St A”' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Near 19102' })).toBeVisible();
    await page.waitForTimeout(2500);
    expect(chooses()).toBe(1);
  });

  test('an address a program matches is not sent to Google', async ({ page }) => {
    const { box, asked } = await open(page, { programs: (q) => (/market/i.test(q) ? FOOD : []) });
    await box.fill('1500 Market');
    await expect(page.getByRole('heading', { name: 'Example Community Kitchen' })).toBeVisible();
    await page.waitForTimeout(1200);
    expect(asked).toEqual([]);
    await expect(page.getByText(/^Nearest to/)).toHaveCount(0);
  });

  test('fails safe: when the programs search cannot be read, nothing about the words is sent', async ({ page }) => {
    const { box, asked } = await open(page, { programs: () => 'fail' });
    await box.fill('1500 Market');
    await page.waitForTimeout(1500);
    expect(asked).toEqual([]);
    await expect(page.locator('[data-google-attribution]')).toHaveCount(0);
  });

  test('fails safe: with no key, or a status that cannot be read, nothing is sent and the list says nothing matched', async ({ page }) => {
    for (const enabled of [false, 'unreadable'] as const) {
      const fresh = await page.context().newPage();
      const { box, asked } = await open(fresh, { enabled });
      await box.fill('1500 Market');
      await expect(fresh.getByRole('heading', { name: 'Nothing matched that.' })).toBeVisible();
      await fresh.waitForTimeout(800);
      expect(asked, String(enabled)).toEqual([]);
      await fresh.close();
    }
  });

  test('a case manager’s All programs has the same field, on its own row under Back, Add and Help', async ({ page }) => {
    const { box } = await open(page, { role: 'admin', path: '/programs/' });
    const back = (await page.getByRole('link', { name: /Back/ }).first().boundingBox())!;
    const field = (await box.boundingBox())!;
    expect(field.y).toBeGreaterThan(back.y + back.height - 2);
    await box.fill('food');
    await expect(page.getByRole('heading', { name: 'Example Food Pantry' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Search programs$/ })).toHaveCount(0);
  });

  test('in Arabic, a typed Latin address keeps its own direction (dir="auto"): "1500 Market", not "Market 1500"', async ({ page }) => {
    await open(page, { language: 'ar' });
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    // The field's name is Arabic here, so find it by what it is.
    const box = page.locator('.astryx-input-group[data-size="lg"] input').first();
    await box.fill('1500 Market');
    await expect(box).toHaveAttribute('dir', 'auto');
    // The browser resolves "auto" from the first strong letter: this text lays out left to right.
    expect(await box.evaluate((el) => el.matches(':dir(ltr)'))).toBe(true);
    // An Arabic word typed in the same field lays out right to left.
    await box.fill('طعام');
    expect(await box.evaluate((el) => el.matches(':dir(rtl)'))).toBe(true);
  });

  test('has no WCAG A/AA violations while typing an address', async ({ page }) => {
    const { box } = await open(page);
    await box.fill('1500 Market');
    await expect(page.getByRole('button', { name: 'Near 19102' })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
