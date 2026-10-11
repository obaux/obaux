import { expect, test, type Page } from '@playwright/test';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';
import ar from '@pam/config/locales/ar.json';

/**
 * Sign in on a short phone (Iris's member flow pass, S1; D-500). On a 320×568 screen (an iPhone SE, or a
 * 640-tall Android once the browser bar is counted) the Privacy and Terms bar was pinned to the bottom of the
 * screen and stood over "Send me a code": a tap on the button opened Privacy or Terms instead. The legal links
 * now follow the content, so at any height or language the button is whole, on top, and the tap reaches it.
 *
 * Supabase is stubbed at the network. The tap is a raw mouse click on the button's centre, so whatever is on top
 * of the button receives it, as it does under a thumb.
 */
const LOCALES = { en, es, ar } as const;
const NUMBER = '2155550100';

async function open(page: Page, locale: keyof typeof LOCALES, invited: boolean) {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript((code) => localStorage.setItem('pam.locale', code), locale);
  await page.route('**/rest/v1/rpc/invite_preview*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ inviter_first_name: 'Dana', invited_role: 'member', state: 'valid' }]),
    }),
  );
  await page.route('**/auth/v1/otp*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await page.goto(invited ? '/signin/?invite=ABCD2345&as=member' : '/signin/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="tel"]').fill(NUMBER);
}

for (const locale of ['en', 'es', 'ar'] as const) {
  for (const invited of [true, false]) {
    test(`320×568, ${invited ? 'invited' : 'not invited'}, ${locale}: the tap on "Send me a code" reaches it`, async ({ page }) => {
      await open(page, locale, invited);
      const label = LOCALES[locale]['signin.phone.action'];
      const button = page.getByRole('button').filter({ hasText: label });
      await expect(button).toBeVisible();

      const box = (await button.boundingBox())!;
      const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      // Whole on the screen, and what is on top of its centre is the button.
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(568);
      const onTop = await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.textContent ?? document.elementFromPoint(x, y)?.outerHTML.slice(0, 80),
        centre,
      );
      expect(onTop).toContain(label);
      // The legal links are never over it: they come after it.
      const privacy = await page.getByRole('link', { name: LOCALES[locale]['legal.privacy'] }).first().boundingBox();
      expect(privacy!.y).toBeGreaterThanOrEqual(box.y + box.height - 1);

      await page.mouse.click(centre.x, centre.y);
      await expect(page).toHaveURL(/\/signin\//);
      await expect(page.getByRole('heading', { name: LOCALES[locale]['signin.code.title'] })).toBeVisible();
    });
  }
}
