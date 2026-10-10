import { expect, test } from '@playwright/test';
import { settled } from './settled';

/**
 * Will, 10 October, on his phone: an invite link opened a page of raw code — the
 * screen's flight data (`/signin/index.txt`), not the screen (D-495).
 *
 * When a tap's in-app load fails (a dropped connection, or a tab still on the old
 * vercel.app address, whose load is redirected to another site), Next falls back to
 * loading the page in full. In `output: export` the URL it falls back to already ends
 * in `index.txt`, and Next 15.5 forgot to strip it on that one path. Pam patches it
 * (`patches/next@15.5.25.patch`); this is the check that the patch is in.
 */
test('a failed in-app load opens the screen, not its data file (D-495)', async ({ page }) => {
  await page.goto('/signin/?invite=TEST&as=case-manager');
  await settled(page);

  // Whatever the server does with it, the browser must never be sent to a data file.
  const dataFileLoads: string[] = [];
  page.on('request', (request) => {
    if (request.isNavigationRequest() && /index\.txt/.test(request.url())) dataFileLoads.push(request.url());
  });

  let failed = 0;
  await page.route('**/index.txt*', (route) => {
    if (route.request().resourceType() === 'fetch' && failed === 0) {
      failed += 1;
      return route.abort('connectionreset');
    }
    return route.continue();
  });

  await page.locator('a[href="/about/"]').first().click();
  // The test server drops the trailing slash; what matters is that it isn't the data file.
  await expect(page).toHaveURL(/\/about\/?$/);
  expect(failed).toBe(1);
  expect(dataFileLoads).toEqual([]);
  await expect(page.locator('body')).not.toContainText('$Sreact');
});
