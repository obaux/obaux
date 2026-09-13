import type { Page } from '@playwright/test';

/**
 * Wait for the page a member actually reads.
 *
 * Astryx ships three stylesheets and Next splits them across chunks; the theme
 * sheet is the last to land, and every colour in it is a `light-dark()` pair.
 * Measured in that window, axe reports the browser's greys rather than the
 * theme's — 3.5:1 on text that is 6.8:1 a moment later — and a box measured
 * before the webfont swaps in is a layout nobody ever sees.
 *
 * So every contrast and geometry assertion goes through this. It is not a
 * workaround for flakiness: it is the difference between measuring the page and
 * measuring the load. The window itself is real and was shrunk separately, by
 * declaring `color-scheme` on the root (globals.css).
 */
export async function settled(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}
