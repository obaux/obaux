import { expect, test } from '@playwright/test';
import ar from '@pam/config/locales/ar.json';

/**
 * Arabic fills the sign-in code boxes from the left (Iris CP3, D-530). A code reads 1234 in every
 * language, like the phone number beside it; typed 1234 used to show "_ _ 4 3 2 1" in Arabic.
 */
const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

test.describe('the code boxes in Arabic', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pam.locale', 'ar'));
    await page.route('**/auth/v1/otp*', (route) => route.fulfill(json({})));
    // A complete code is sent at once; hold the answer so the boxes still show what was typed.
    await page.route('**/auth/v1/verify*', () => {});
    await page.goto('/signin/');
    await page.locator('input[type="tel"]').fill('215 555 0100');
    await page.getByRole('button', { name: ar['signin.phone.action'] }).click();
    await expect(page.getByRole('heading', { name: ar['signin.code.title'], level: 1 })).toBeVisible();
  });

  const boxes = (page: import('@playwright/test').Page) =>
    page.locator('[data-pam-code] [aria-hidden="true"] > *').evaluateAll((els) =>
      els
        .map((el) => ({ x: el.getBoundingClientRect().x, t: (el.textContent ?? '').trim() }))
        .sort((a, b) => a.x - b.x)
        .map((b) => b.t),
    );

  test('page is right to left, the code group is left to right', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('[data-pam-code]')).toHaveAttribute('dir', 'ltr');
  });

  test('typing 1234 reads 1234 from the left', async ({ page }) => {
    const field = page.getByLabel(ar['signin.code.label']);
    await field.click();
    await page.keyboard.type('12');
    expect((await boxes(page)).slice(0, 2)).toEqual(['1', '2']);
    await page.keyboard.type('34');
    expect(await boxes(page)).toEqual(['1', '2', '3', '4', '', '']);
  });

  test('a pasted code reads in the order it was sent', async ({ page }) => {
    // fill() sets the whole value at once, the way a paste or the phone's code suggestion does.
    await page.getByLabel(ar['signin.code.label']).fill('Your code is 123456');
    expect(await boxes(page)).toEqual(['1', '2', '3', '4', '5', '6']);
  });
});
