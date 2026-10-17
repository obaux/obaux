import { expect, test, type Locator, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * a95 (Will): the "When?" date and time chips are 40px tall pills, and still a 48px target: 4px of hit area above and below that
 * belongs to the chip, so a thumb that lands between the pill and the row above or below still presses it.
 *
 * Iris's re-test of b54 found the hit area worked ABOVE a chip and not BELOW it: the invisible area is placed from the padding edge,
 * a 1px border takes one pixel off each side, and the area was 46px, not 48. So this measures both sides, on the first and a middle
 * row, for a day and a time chip, selected and not.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('pam.examples', '1'));
});

const open = async (page: Page) => {
  await page.goto('/trips/new/?place=dummy-place-learning');
  await settled(page);
};

/** Does a tap `dy` px from the chip's outline (negative: above its top edge; positive: below its bottom edge) land on the chip? */
const hits = (chip: Locator, dy: number) =>
  chip.evaluate((el, d) => {
    const r = el.getBoundingClientRect();
    const y = d < 0 ? r.top + d : r.bottom + d;
    const at = document.elementFromPoint(r.left + r.width / 2, y);
    return at === el || el.contains(at);
  }, dy);

const days = (page: Page) => page.getByRole('button', { name: /^\w{3}, / });
const times = (page: Page) => page.getByRole('button', { name: /^\d{1,2}:\d{2} [AP]M$/ });

test('the date chips are 40px pills, and six of them', async ({ page }) => {
  await open(page);
  await expect(days(page)).toHaveCount(6);
  const box = (await days(page).first().boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(39.5);
  expect(box.height).toBeLessThanOrEqual(40.5);
});

// Rows at 320: two chips each, so the first row is chips 0, the middle row chips 2 (days) and 0, 2 (times).
for (const [what, pick] of [
  ['a day chip in the first row', (p: Page) => days(p).nth(0)],
  ['a day chip in a middle row', (p: Page) => days(p).nth(2)],
  ['a time chip in the first row', (p: Page) => times(p).nth(0)],
  ['a time chip in the last row', (p: Page) => times(p).nth(2)],
] as const) {
  test(`${what}: 3px above and 3px below the pill press it; 6px away does not`, async ({ page }) => {
    await open(page);
    const chip = pick(page);
    expect(await hits(chip, -3), '3px above').toBe(true);
    expect(await hits(chip, 3), '3px below').toBe(true);
    expect(await hits(chip, -6), '6px above').toBe(false);
    expect(await hits(chip, 6), '6px below').toBe(false);
    // And the same once it is chosen: the filled chip has no border, so it must not have a taller or shorter target.
    await chip.click();
    expect(await hits(chip, -3), 'selected, 3px above').toBe(true);
    expect(await hits(chip, 3), 'selected, 3px below').toBe(true);
    expect(await hits(chip, -6), 'selected, 6px above').toBe(false);
    expect(await hits(chip, 6), 'selected, 6px below').toBe(false);
  });
}

test('at 320×568 all four times sit clear of the Next bar (Will: the time must be in view)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page);
  await expect(times(page)).toHaveCount(4);
  const last = (await times(page).nth(3).boundingBox())!;
  const next = (await page.getByRole('button', { name: 'Next', exact: true }).boundingBox())!;
  // The whole 48px target, not just the pill, ends above the button.
  expect(last.y + last.height + 4, "the last time's target ends above Next").toBeLessThanOrEqual(next.y);
  const first = (await times(page).nth(0).boundingBox())!;
  expect(first.y + first.height, 'and the first row too').toBeLessThanOrEqual(next.y);
});
