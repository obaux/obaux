import { test, expect } from '@playwright/test';

/**
 * Back goes to where you came from (D-277).
 *
 * Every nested screen names a fixed screen to go back to, for a link opened
 * cold. Inside the app, Back should return to the screen that was actually
 * open — Will, 5 October: Text alerts opened from Profile went Home on Back.
 * Places is the proof here: its fixed target is Home, so arriving from Help
 * and getting Help back is only possible through history.
 */
const RPC = '**/rest/v1/rpc/services_near*';

test.describe('back', () => {
  test('returns to the screen you came from, not the fixed one', async ({ page }) => {
    await page.route(RPC, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.goto('/help/');
    // A link into Places, followed inside the app (no reload).
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = '/places/';
      a.textContent = 'Places';
      document.body.append(a);
    });
    await page.getByRole('link', { name: 'Places', exact: true }).click();
    await expect(page).toHaveURL(/\/places\/$/);

    await page.getByRole('link', { name: 'Back to Home' }).click();
    await expect(page).toHaveURL(/\/help\/$/);
  });

  test('opened cold, Back still goes to the fixed screen', async ({ page }) => {
    await page.route(RPC, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.goto('/places/');
    await page.getByRole('link', { name: 'Back to Home' }).click();
    await expect(page).not.toHaveURL(/\/places\/$/);
    await expect(page).not.toHaveURL(/\/help\/$/);
  });
});
