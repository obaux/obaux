import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';
import { asMember } from './asMember';

/**
 * The one search box on Explore (D-573): programs, Pam's areas and addresses in one list, no switch. Google is asked only for address-like
 * words that no program matches, or when the person taps "Search addresses"; program words never go.
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
const FOOD = [
  row('f1000000-0000-4000-8000-000000000001', 'Example Food Pantry', '2210 Spring Garden St Philadelphia, PA 19130', 2253),
  row('f1000000-0000-4000-8000-000000000002', 'Example Community Kitchen', '1420 Market St Philadelphia, PA 19102', 322),
];
const ZIPS = [
  { id: 'a1', kind: 'zip', label: '19104', lat: 39.963788, lon: -75.202914 },
  { id: 'a3', kind: 'landmark', label: 'City Hall', lat: 39.9526, lon: -75.1652 },
];

async function open(page: Page, opts: { enabled?: boolean | 'unreadable'; programs?: (q: string) => unknown[] | 'fail'; role?: 'member' | 'admin'; path?: string } = {}) {
  const { enabled = true, programs = (q) => (/food/i.test(q) ? FOOD : []), role = 'member', path = '/' } = opts;
  await asMember(page, role);
  const asked: Record<string, unknown>[] = [];
  const nearAsked: Record<string, unknown>[] = [];
  const areaAsks: string[] = [];
  await page.route(AREAS, (route) => {
    const q = String((route.request().postDataJSON() as { p_query?: string }).p_query ?? '');
    areaAsks.push(q);
    return route.fulfill(json(q === '' ? ZIPS : /191/.test(q) ? ZIPS : []));
  });
  await page.route(PROGRAMS, (route) => {
    const q = String((route.request().postDataJSON() as { p_query?: string }).p_query ?? '');
    const answer = programs(q);
    return answer === 'fail' ? route.fulfill({ status: 500, body: '{}' }) : route.fulfill(json(answer));
  });
  await page.route(NEAR, (route) => {
    nearAsked.push(route.request().postDataJSON() as Record<string, unknown>);
    return route.fulfill(json(FOOD));
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
    return route.fulfill(json({ enabled: true, suggestions: [{ placeId: 'ChIJ1500marketstreet', label: '1500 Market St, Philadelphia, PA' }] }));
  });
  await page.goto(path);
  await settled(page);
  const launcher = role === 'member' ? page.getByRole('button', { name: 'Search programs' }) : page.getByRole('button', { name: /Search programs/ });
  await launcher.click();
  return { asked, nearAsked, areaAsks, box: page.getByRole('textbox', { name: /Search programs/ }) };
}

test.describe('one search box', () => {
  test('opens full screen with the cursor in the box and one row, Use my current location', async ({ page }) => {
    const { box } = await open(page);
    await expect(box).toBeFocused();
    await expect(box).toHaveAttribute('placeholder', 'Search programs');
    await expect(box).toHaveAccessibleName('Search programs, areas or addresses');
    await expect(page.getByRole('button', { name: /^Use my current location/ })).toBeVisible();
    // No explainer under it, no switch, no category chips here (they stay on Explore).
    await expect(page.getByText(/Type a program/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'School and training' })).toHaveCount(0);
    await expect(page.getByRole('tab')).toHaveCount(0);
  });

  test('program words: programs first, and nothing about them goes to Google', async ({ page }) => {
    const { asked, box } = await open(page);
    await box.fill('food');
    await expect(page.getByRole('button', { name: /^Example Food Pantry/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Example Community Kitchen/ })).toBeVisible();
    // Name, address and how far.
    await expect(page.getByRole('button', { name: /^Example Community Kitchen.*1420 Market St.*0\.2 miles/ })).toBeVisible();
    // A person can ask Google on purpose; until they do, nothing was sent.
    await expect(page.getByRole('button', { name: /^Search addresses for “food”.*Sends what you typed to Google\./ })).toBeVisible();
    await page.waitForTimeout(1200);
    expect(asked).toEqual([]);
    await expect(page.locator('[data-google-attribution]')).toHaveCount(0);
  });

  test('a program opens its page, from Explore', async ({ page }) => {
    const { box } = await open(page);
    await box.fill('food');
    await page.getByRole('button', { name: /^Example Food Pantry/ }).click();
    await expect(page).toHaveURL(/\/place\/\?id=f1000000-0000-4000-8000-000000000001&from=explore/);
  });

  test('a ZIP is an area first: Areas above Programs when only digits are typed', async ({ page }) => {
    const { box } = await open(page, { programs: () => FOOD });
    await box.fill('191');
    await expect(page.getByRole('button', { name: /^19104/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Example Food Pantry/ })).toBeVisible();
    const zip = await page.getByRole('button', { name: /^19104/ }).boundingBox();
    const program = await page.getByRole('button', { name: /^Example Food Pantry/ }).boundingBox();
    expect(zip!.y).toBeLessThan(program!.y);
  });

  test('picking an area comes back to Explore and sets the Near control; it is remembered', async ({ page }) => {
    const { box, nearAsked } = await open(page);
    await box.fill('191');
    await page.getByRole('button', { name: /^19104/ }).click();
    await expect(page.getByRole('button', { name: 'Near 19104' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'All programs' })).toBeVisible();
    await expect.poll(() => nearAsked.some((body) => Math.abs(Number(body['p_lat']) - 39.963788) < 0.001)).toBe(true);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Near 19104' })).toBeVisible();
  });

  test('an address no program matches: Google’s rows with its mark; a pick shows only its ZIP, and is never kept', async ({ page }) => {
    const { box, asked } = await open(page);
    await box.fill('1500 Market');
    await expect(page.getByRole('button', { name: /^1500 Market St, Philadelphia, PA.*Used for this search only\./ })).toBeVisible();
    await expect(page.locator('[data-google-attribution]')).toBeVisible();
    expect(asked[0]).toEqual({ action: 'suggest', q: '1500 Market', token: expect.stringMatching(/^[0-9a-f]{32}$/) });
    await page.getByRole('button', { name: /^1500 Market St, Philadelphia, PA/ }).click();
    await expect(page.getByRole('button', { name: 'Near 19102' })).toBeVisible();
    expect(await page.evaluate(() => String(window.localStorage.getItem('pam.origin')))).not.toMatch(/Market|39\.95|google:/);
    expect(page.url()).not.toMatch(/Market|39\.95|-75\.16/);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Near City Hall' })).toBeVisible();
  });

  test('an address a program matches is not sent; tapping Search addresses sends exactly those words', async ({ page }) => {
    const { box, asked } = await open(page, { programs: (q) => (/market/i.test(q) ? FOOD : []) });
    await box.fill('1500 Market');
    await expect(page.getByRole('button', { name: /^Example Community Kitchen/ })).toBeVisible();
    await page.waitForTimeout(1200);
    expect(asked).toEqual([]);
    await page.getByRole('button', { name: /^Search addresses for “1500 Market”/ }).click();
    await expect.poll(() => asked.length).toBe(1);
    expect(asked[0]).toEqual({ action: 'suggest', q: '1500 Market', token: expect.stringMatching(/^[0-9a-f]{32}$/) });
    await expect(page.getByRole('button', { name: /^1500 Market St, Philadelphia, PA/ })).toBeVisible();
    // The tap was for those words only: change them and nothing more is sent until asked again.
    await box.fill('market');
    await page.waitForTimeout(1200);
    expect(asked).toHaveLength(1);
  });

  test('fails safe: when the programs search cannot be read, nothing about the words is sent', async ({ page }) => {
    const { box, asked } = await open(page, { programs: () => 'fail' });
    await box.fill('1500 Market');
    await page.waitForTimeout(1500);
    expect(asked).toEqual([]);
    await expect(page.locator('[data-google-attribution]')).toHaveCount(0);
  });

  test('fails safe: with no key, or a status that cannot be read, nothing is sent and there is no Search addresses row', async ({ page }) => {
    for (const enabled of [false, 'unreadable'] as const) {
      const fresh = await page.context().newPage();
      const { box, asked } = await open(fresh, { enabled });
      await box.fill('1500 Market');
      await fresh.waitForTimeout(1200);
      expect(asked, String(enabled)).toEqual([]);
      await expect(fresh.getByRole('button', { name: /^Search addresses/ })).toHaveCount(0);
      await fresh.close();
    }
  });

  test('a case manager’s All programs opens the same search', async ({ page }) => {
    const { box } = await open(page, { role: 'admin', path: '/programs/' });
    await expect(box).toBeFocused();
    await box.fill('food');
    await expect(page.getByRole('button', { name: /^Example Food Pantry/ })).toBeVisible();
  });

  test('has no WCAG A/AA violations with all three kinds of rows', async ({ page }) => {
    const { box } = await open(page, { programs: () => FOOD });
    await box.fill('1500 Market');
    await expect(page.getByRole('button', { name: /^Example Food Pantry/ })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
