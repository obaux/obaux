import { expect, test } from '@playwright/test';
import { settled } from './settled';

/**
 * a95 (Will): the "When?" date and time chips are 40px tall pills, and still a 48px target: 4px of hit area above and below that
 * belongs to the chip, so a thumb that lands between the pill and the row above still presses it.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('pam.examples', '1'));
});

test('the date chips are 40px pills with a 48px hit area, and six of them', async ({ page }) => {
  await page.goto('/trips/new/?place=dummy-place-learning');
  await settled(page);
  const chips = page.getByRole('button', { name: /^\w{3}, / });
  await expect(chips).toHaveCount(6);
  const box = (await chips.first().boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(39.5);
  expect(box.height).toBeLessThanOrEqual(40.5);
  // 3px above the pill is inside the hit area; 5px is not.
  const hit = (dy: number) =>
    chips.first().evaluate((el, y) => {
      const r = el.getBoundingClientRect();
      const at = document.elementFromPoint(r.left + r.width / 2, y === 0 ? r.top : r.top + y);
      return at === el || el.contains(at);
    }, dy);
  expect(await hit(-3)).toBe(true);
  expect(await hit(-6)).toBe(false);
});
