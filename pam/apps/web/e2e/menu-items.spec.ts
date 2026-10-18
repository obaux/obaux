import { test, expect } from '@playwright/test';
import { asMember } from './asMember';

/**
 * The items of a drop-down menu are taps, so each is 48px (Iris, W2, 17 October: they were 34px, with "Delete and start over" directly
 * above Help). Measured on a place's More options; Home's + and What you sent's More use the same menu and the same rule.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('pam.examples', '1'));
});

test("a place's More options: every item is at least 48px", async ({ page }) => {
  await asMember(page);
  await page.goto('/place/?id=dummy-place-learning');
  await page.getByRole('button', { name: 'More options' }).click();
  const items = page.getByRole('menuitem');
  await expect(items.first()).toBeVisible();
  expect(await items.count()).toBeGreaterThanOrEqual(2);
  for (const item of await items.all()) {
    const box = (await item.boundingBox())!;
    expect(box.height, `${await item.textContent()}`).toBeGreaterThanOrEqual(47.5);
  }
});
