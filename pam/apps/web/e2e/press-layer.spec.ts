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
});
