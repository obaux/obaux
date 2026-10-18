import { test, expect } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';

/**
 * Every example circle opens a page (Iris's b63 re-test, P4). The pretend people on a staff Home come from one list of example people
 * (`dummy-people`); a circle drawn on Home, or a row on Members interested, must open a person, never "We could not find that person".
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('pam.examples', '1'));
});

for (const [role, start] of [['provider', '/'], ['provider', '/interested/']] as const) {
  test(`${role} ${start}: every example person opens that person`, async ({ page }) => {
    await asMember(page, role);
    await page.goto(start);
    await settled(page);
    const hrefs = await page.locator('a[href*="/person/"]').evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
    expect(hrefs.length).toBeGreaterThanOrEqual(2);
    for (const href of [...new Set(hrefs)]) {
      await page.goto(href);
      await settled(page);
      await expect(page.getByText('We could not find that person'), href).toHaveCount(0);
    }
  });
}
