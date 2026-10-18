import { test, expect, type Page } from '@playwright/test';
import { asMember } from './asMember';

/**
 * The press layer (Will, 17 October, card a99: items "feeling very flat"): a row darkens while held, a card, tile or button presses in
 * (scale 0.97), and with reduced motion the shade stays and the scale goes. A held mouse button sets `:active` as a finger does in Safari.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('pam.examples', '1'));
  // The projects ask for reduced motion (no waiting on animations); the press is measured with motion on, and once with it off.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
});

const scaleOf = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => {
    const t = getComputedStyle(el).transform;
    return t === 'none' ? 1 : Number(t.slice(7).split(',')[0]);
  });

async function hold(page: Page, selector: string) {
  const box = (await page.locator(selector).first().boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + box.height / 2);
  await page.mouse.down();
}

test.describe('the press layer', () => {
  test('a row darkens while it is held, and lets go', async ({ page }) => {
    await asMember(page);
    await page.goto('/profile/');
    const row = '.astryx-item:has(a[href="/language/"])';
    await page.locator(row).scrollIntoViewIfNeeded();
    const shade = () => page.evaluate((sel) => getComputedStyle(document.querySelector(sel)!).backgroundColor, row);
    expect(await shade()).toBe('rgba(0, 0, 0, 0)');
    await hold(page, row);
    await expect.poll(shade).not.toBe('rgba(0, 0, 0, 0)');
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await expect.poll(shade).toBe('rgba(0, 0, 0, 0)');
  });

  test('a tile presses in: scale 0.97, and back on release', async ({ page }) => {
    await asMember(page);
    await page.goto('/profile/');
    await page.locator('.astryx-clickable-card').first().scrollIntoViewIfNeeded();
    expect(await scaleOf(page, '.astryx-clickable-card')).toBe(1);
    await hold(page, '.astryx-clickable-card');
    await expect.poll(() => scaleOf(page, '.astryx-clickable-card')).toBeCloseTo(0.97, 2);
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await expect.poll(() => scaleOf(page, '.astryx-clickable-card')).toBe(1);
  });

  test('a button presses in', async ({ page }) => {
    await asMember(page);
    await page.goto('/');
    const button = 'button.astryx-button.astryx-button';
    await page.getByRole('button', { name: /Search programs/ }).first().waitFor();
    const search = page.getByRole('button', { name: /Search programs/ }).first();
    const box = (await search.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect.poll(() => search.evaluate((el) => { const t = getComputedStyle(el).transform; return t === 'none' ? 1 : Number(t.slice(7).split(',')[0]); })).toBeCloseTo(0.97, 2);
    void button;
    await page.mouse.move(0, 0);
    await page.mouse.up();
  });

  test('reduced motion keeps the shade and drops the scale', async ({ page }) => {
    await asMember(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/profile/');
    await page.locator('.astryx-clickable-card').first().scrollIntoViewIfNeeded();
    await hold(page, '.astryx-clickable-card');
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector('.astryx-clickable-card')!).backgroundImage)).toContain('linear-gradient');
    expect(await scaleOf(page, '.astryx-clickable-card')).toBe(1);
    await page.mouse.up();
  });

  // Part 2 (Iris's re-test): the kinds that did not press. `:active` is held with the mouse, as above.
  const PLACE = { id: 'p1', name: 'Santore Library', lookup_name: 'Santore Library', category: 'education', subcategory: null, address: '932 S 7th St, Philadelphia, PA', phone: null, place_id: null, lat: 39.9371, lon: -75.15526, meters: 1919.3, has_hours: false };
  const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

  async function explore(page: Page) {
    await asMember(page);
    await page.route('**/rest/v1/rpc/services_near*', (route) => route.fulfill(json([PLACE])));
    await page.route('**/rest/v1/rpc/search_areas*', (route) => route.fulfill(json([])));
    await page.goto('/');
  }

  test('Explore\'s program card presses in as a whole, by its stretched link', async ({ page }) => {
    await explore(page);
    const card = '.astryx-card:has(a[data-pam-stretch])';
    await page.locator(card).first().waitFor();
    await page.locator(card).first().scrollIntoViewIfNeeded();
    expect(await scaleOf(page, card)).toBe(1);
    await hold(page, card);
    await expect.poll(() => scaleOf(page, card)).toBeCloseTo(0.97, 2);
    expect(await page.locator(card).first().evaluate((el) => getComputedStyle(el).backgroundImage)).toContain('linear-gradient');
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await expect.poll(() => scaleOf(page, card)).toBe(1);
  });

  test('a service choice presses in', async ({ page }) => {
    await asMember(page);
    await page.goto('/place/?id=dummy-place-learning');
    const card = '.astryx-selectable-card';
    await page.locator(card).first().waitFor();
    await page.locator(card).first().scrollIntoViewIfNeeded();
    expect(await scaleOf(page, card)).toBe(1);
    await hold(page, card);
    await expect.poll(() => scaleOf(page, card)).toBeCloseTo(0.97, 2);
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await expect.poll(() => scaleOf(page, card)).toBe(1);
  });

  test('a tab in the bar shades while held', async ({ page }) => {
    await asMember(page);
    await page.goto('/');
    const tab = 'a.astryx-tab';
    await page.locator(tab).first().waitFor();
    const shade = () => page.evaluate((sel) => getComputedStyle(document.querySelectorAll(sel)[1]!).backgroundColor, tab);
    const before = await shade();
    const box = (await page.locator(tab).nth(1).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect.poll(shade).not.toBe(before);
    await page.mouse.move(0, 0);
    await page.mouse.up();
  });

  // The two staff screens whose cards are stretched links: tonight's lesson is that a press test samples the screens people tap.
  async function staff(page: Page, role: 'admin' | 'provider') {
    await asMember(page, role);
    await page.route('**/rest/v1/rpc/**', (route) => route.fulfill(json([])));
    await page.route('**/rest/v1/services*', (route) => route.fulfill(json([])));
    await page.route('**/rest/v1/program_services*', (route) => route.fulfill(json([])));
    await page.route('**/rest/v1/program_submissions*', (route) => route.fulfill(json([])));
    await page.route('**/rest/v1/enrollments*', (route) => route.fulfill(json([])));
    await page.route('**/rest/v1/access_controls*', (route) => route.fulfill(json([])));
  }

  async function pressesAsAWhole(page: Page, card: string) {
    await page.locator(card).first().waitFor();
    await page.locator(card).first().scrollIntoViewIfNeeded();
    expect(await scaleOf(page, card)).toBe(1);
    await hold(page, card);
    await expect.poll(() => scaleOf(page, card)).toBeCloseTo(0.97, 2);
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await expect.poll(() => scaleOf(page, card)).toBe(1);
  }

  test('a case manager\'s member card presses in as a whole', async ({ page }) => {
    await staff(page, 'admin');
    await page.route('**/rest/v1/profiles*', (route) =>
      route.request().url().includes('role=eq.member')
        ? route.fulfill(json([{ id: 'm1', first_name: 'Marcus', access_status: 'active', last_active_at: null }]))
        : route.fallback(),
    );
    await page.goto('/');
    await pressesAsAWhole(page, '.astryx-card:has(a[data-pam-stretch][href*="person"])');
  });

  test('a program lead\'s Finish setting up card presses in as a whole', async ({ page }) => {
    await staff(page, 'provider');
    // A real lead with no program yet (examples would give them one, and no cards to finish).
    await page.addInitScript(() => window.sessionStorage.removeItem('pam.examples'));
    await page.route('**/rest/v1/profiles*', (route) =>
      route.fulfill(json({ id: 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b', org_id: '22222222-0000-0000-0000-0000000000aa', role: 'provider', first_name: 'Lou', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
    );
    await page.goto('/');
    await pressesAsAWhole(page, '.astryx-card:has(a[data-pam-stretch])');
  });
});
