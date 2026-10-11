import { expect, test } from '@playwright/test';

/**
 * A heading whose text is a name keeps its own direction (D-534); Pam's own words keep the page's. On an
 * Arabic page a Latin name reads left to right (its final "." stays on its right, and a long one is cut at
 * its end), an Arabic name reads right to left, and "Your trips" follows the page.
 */
const direction = (page: import('@playwright/test').Page, id: string) =>
  page.getByTestId(id).evaluate((el) => getComputedStyle(el).direction);

for (const [locale, pageDir] of [['ar', 'rtl'], ['en', 'ltr']] as const) {
  test.describe(`on a ${locale} page`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((code) => localStorage.setItem('pam.locale', code), locale);
      await page.goto('/gallery/');
      await expect(page.locator('html')).toHaveAttribute('dir', pageDir);
    });

    test('a Latin name is ltr, an Arabic name is rtl', async ({ page }) => {
      expect(await direction(page, 'latin-name')).toBe('ltr');
      expect(await direction(page, 'arabic-name')).toBe('rtl');
    });

    test("Pam's own heading keeps the page's direction", async ({ page }) => {
      expect(await direction(page, 'pam-heading')).toBe(pageDir);
    });
  });
}
