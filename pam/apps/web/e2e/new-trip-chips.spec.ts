import { expect, test, type Locator, type Page } from '@playwright/test';
import { asMember } from './asMember';
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

// At 320×568 the step scrolls (the fade covers what is under the Next bar until it does). Dot's check, in English and Arabic: scrolled to
// the end, and tabbing to the last time, the 3:30 PM chip's whole 48px target is clear of the fade and of Next.
for (const lang of ['en', 'ar'] as const) {
  test(`at 320×568 (${lang}) the last time scrolls clear of the fade and Next, by scrolling and by Tab`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await asMember(page, 'member', lang === 'en' ? null : lang);
    await open(page);
    const chips = page.locator('button').filter({ hasText: /[0-9\u0660-\u0669]+[:\u066b][0-9\u0660-\u0669]+/ });
    await expect(chips).toHaveCount(4);
    const last = chips.nth(3);
    // The sticky footer is the Next bar and the fade above it: its top is where the fade starts.
    const room = () =>
      last.evaluate((el) => {
        let footer: Element | null = null;
        for (const d of document.querySelectorAll('div')) if (getComputedStyle(d).position === 'sticky' && d.querySelector('button')) footer = d;
        const r = el.getBoundingClientRect();
        return { targetBottom: r.bottom + 4, fadeTop: footer!.getBoundingClientRect().top };
      });
    // Scrolled to the end.
    await page.evaluate(() => window.scrollTo(0, 99999));
    const atEnd = await room();
    expect(atEnd.targetBottom, 'scrolled to the end, the last time\'s 48px target ends above the fade').toBeLessThanOrEqual(atEnd.fadeTop);
    // Tabbing to it from the first time (no mouse: the browser scrolls what it must).
    await page.evaluate(() => window.scrollTo(0, 0));
    await chips.nth(0).focus();
    for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
    await expect(last).toBeFocused();
    await page.waitForTimeout(300);
    const tabbed = await room();
    expect(tabbed.targetBottom, 'tabbed to, the last time is scrolled to above the fade').toBeLessThanOrEqual(tabbed.fadeTop);
  });
}
