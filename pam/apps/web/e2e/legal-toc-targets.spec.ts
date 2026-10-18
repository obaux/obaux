import { test, expect } from '@playwright/test';
import { settled } from './settled';

/**
 * The jump links on Terms and Privacy are 40px pills (D-417) with an invisible 4px margin above and below (a `::before`), so each is a
 * 48px tap target: a tap 3px above or below the pill's edge opens the section, as a tap on the pill does (Iris, P2, measured the
 * visible 40px).
 */
test('every jump link on Terms is a 48px target', async ({ page }) => {
  await page.goto('/terms/');
  await settled(page);
  const links = page.locator('nav a[href^="#"]');
  expect(await links.count()).toBeGreaterThanOrEqual(3);
  for (const link of await links.all()) {
    await link.scrollIntoViewIfNeeded();
    const box = (await link.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(40);
    const x = box.x + box.width / 2;
    // 4px above the pill and 4px below: 48px in all, so the points just inside those edges.
    for (const y of [box.y - 3.5, box.y + box.height + 3.5]) {
      const hits = await page.evaluate(([px, py]) => document.elementFromPoint(px!, py!)?.closest('a')?.getAttribute('href') ?? null, [x, y]);
      expect(hits, `a tap at ${Math.round(y - box.y)}px from the top of ${await link.textContent()}`).toBe(await link.getAttribute('href'));
    }
  }
});
