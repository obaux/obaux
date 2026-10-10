import { expect, test } from '@playwright/test';
import en from '@pam/config/locales/en.json';
import { settled } from './settled';

/**
 * Three things Will found on his phone, 10 October, on the privacy notice and the
 * terms: Back did not return to Sign in after reading, the section tabs glitched
 * when tapped, and "Back to top" stopped short of the top.
 *
 * All three had one cause: the tabs and "Back to top" were plain `#hash` links, and
 * every hash link adds a history entry. So Back undid a tab tap instead of leaving
 * the page, and "Back to top" pointed at the title, which sits in the sticky bar and
 * is always "already in view", so the browser had nowhere to scroll.
 */
const toc = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: en['legal.toc'] });

test.describe('legal pages on a phone', () => {
  test('Back returns to Sign in even after tapping section tabs (D-250)', async ({ page }) => {
    await page.goto('/signin/');
    await page.getByRole('link', { name: en['legal.privacy'] }).click();
    await expect(page).toHaveURL(/\/privacy\/\?from=signin/);
    await settled(page);

    const links = toc(page).getByRole('link');
    await links.nth(2).click();
    await links.nth(4).click();
    await page.getByRole('button', { name: en['nav.back.signInScreen'] }).click();
    await expect(page).toHaveURL(/\/signin\/$/);
  });

  test('a tapped tab puts its heading just under the two bars and adds no history', async ({ page }) => {
    await page.goto('/privacy/');
    await settled(page);
    const before = await page.evaluate(() => history.length);
    const links = toc(page).getByRole('link');
    const href = await links.nth(3).getAttribute('href');

    await links.nth(3).click();
    // Let any smooth scroll finish.
    await page.waitForFunction(() => {
      const y = window.scrollY;
      return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(window.scrollY === y))));
    });

    expect(await page.evaluate(() => history.length)).toBe(before);
    const heading = await page.locator(href!).evaluate((el) => el.getBoundingClientRect().top);
    // Under the header (64px) and the tab row (56px).
    expect(heading).toBeGreaterThanOrEqual(118);
    expect(heading).toBeLessThanOrEqual(150);
    // The tab row stays stuck where it was.
    const tabs = await toc(page).evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.round(tabs)).toBe(64);
    await expect(links.nth(3)).toHaveAttribute('aria-current', 'true');
  });

  test('Back to top takes you all the way to the top', async ({ page }) => {
    await page.goto('/terms/');
    await settled(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);

    await page.getByText(en['legal.backToTop'], { exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBe(0);
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  });
});
