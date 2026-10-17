import type { Locator, Page } from '@playwright/test';

/**
 * Explore's search bar is a centred launcher until it is tapped (Will, 17 October, a86); the tap opens the field in its place,
 * focused, with Cancel on its right. Tap it if it is still at rest, and return the field.
 */
export const launcherOf = (page: Page): Locator => page.locator('[data-search-launcher]');

export async function openSearch(page: Page): Promise<Locator> {
  const launcher = launcherOf(page);
  if (await launcher.count()) await launcher.click();
  // The field by what it is, not by its words: they change with the language.
  const box = page.locator('.astryx-input-group[data-size="lg"] input').first();
  await box.waitFor();
  return box;
}
