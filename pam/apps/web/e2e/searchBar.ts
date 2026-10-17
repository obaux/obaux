import type { Locator, Page } from '@playwright/test';

/**
 * Explore's search bar is a centred launcher until it is tapped (Will, 17 October, a86); the tap opens the field in its place,
 * focused, with Cancel on its right. Tap it if it is still at rest, and return the field.
 */
export const launcherOf = (page: Page): Locator => page.getByRole('button', { name: /^Search programs$/ });

export async function openSearch(page: Page): Promise<Locator> {
  const launcher = launcherOf(page);
  if (await launcher.count()) await launcher.click();
  const box = page.getByRole('textbox', { name: /Search programs/ });
  await box.waitFor();
  return box;
}
