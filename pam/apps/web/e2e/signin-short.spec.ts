import { expect, test, type Page } from '@playwright/test';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';
import ar from '@pam/config/locales/ar.json';
import zhCN from '@pam/config/locales/zh-CN.json';

/**
 * Sign in on a short phone (Iris's member flow pass, S1; D-500). On a 320×568 screen (an iPhone SE, or a
 * 640-tall Android once the browser bar is counted) the Privacy and Terms bar was pinned to the bottom of the
 * screen and stood over "Send me a code": a tap on the button opened Privacy or Terms instead. The legal links
 * now follow the content, so at any height or language the button is whole, on top, and the tap reaches it.
 *
 * Supabase is stubbed at the network. The tap is a raw mouse click on the button's centre, so whatever is on top
 * of the button receives it, as it does under a thumb.
 */
const LOCALES = { en, es, ar, 'zh-CN': zhCN } as const;
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

/**
 * The header stays on top as the page scrolls (Will, 11 October: "otherwise they lose context"; D-502): the invite line,
 * which is the reason they are here, pinned at the very top, and under it a compact bar with the mark and the language
 * switch once the hero has scrolled away. The bar is drawn over the content, not in the flow, so the tap test above
 * (the button whole and tappable at 320×568 with the bar in the page) is the proof it takes no room.
 */
for (const locale of ['en', 'es', 'ar', 'zh-CN'] as const) {
  for (const invited of [true, false]) {
    test(`320×568, ${invited ? 'invited' : 'not invited'}, ${locale}: the header stays on top as the page scrolls`, async ({ page }) => {
      await open(page, locale, invited);
      // At the top the hero carries the mark: the compact bar is not shown yet.
      const barMarks = () =>
        page.evaluate(() =>
          [...document.querySelectorAll('img[alt="Pam"]')]
            .filter((img) => getComputedStyle(img.closest('[class]')!).visibility !== 'hidden')
            .map((img) => Math.round(img.getBoundingClientRect().top))
            .filter((top) => top >= 0 && top < 130).length,
        );
      // As far as the page goes (D-564): on a short phone the page is only a little taller than the screen, so there is no
      // fixed distance to scroll. At the end of it, whatever the language, the mark and the language button are in view at
      // the top (the hero's own have gone by then), and an invite line is still pinned at 0.
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      await page.waitForTimeout(500);

      const pinned = await page.evaluate(() => {
        const note = document.querySelector('[role="note"]');
        // The bar sits under the invite line, whatever height the language gives it: measure against the note's bottom
        // (0 when not invited), plus the bar's own height, not a fixed 140.
        const noteBottom = note ? Math.round(note.getBoundingClientRect().bottom) : 0;
        const limit = noteBottom + 56;
        const inTop = (el: Element) => {
          const r = el.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= limit && r.width > 0 && getComputedStyle(el.parentElement!).visibility !== 'hidden' && getComputedStyle(el).visibility !== 'hidden';
        };
        const marks = [...document.querySelectorAll('img[alt="Pam"]')].filter(inTop);
        const buttons = [...document.querySelectorAll('button')].filter(inTop);
        return {
          scrolled: window.scrollY,
          noteTop: note ? Math.round(note.getBoundingClientRect().top) : null,
          marks: marks.length,
          buttons: buttons.length,
        };
      });
      expect(pinned.scrolled).toBeGreaterThan(0);
      if (invited) expect(pinned.noteTop).toBe(0);
      expect(pinned.marks, 'a Pam mark in view at the top').toBeGreaterThanOrEqual(1);
      expect(pinned.buttons, 'the language button in view at the top').toBeGreaterThanOrEqual(1);
      void barMarks;

      // Back at the top the bar is gone again and the button is where it was, whole.
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(300);
      const button = page.getByRole('button').filter({ hasText: LOCALES[locale]['signin.phone.action'] });
      const box = (await button.boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(568);
    });
  }
}

/**
 * The small wrong-code alert sits between the boxes and "Sign in" (D-510). At 320×568 it must not push the button
 * under the Privacy and Terms links or off the tap: the button stays whole and a raw click on its centre reaches it.
 */
for (const locale of ['en', 'es', 'ar'] as const) {
  test(`320×568, ${locale}: with the wrong-code alert showing, the code step's button still taps cleanly`, async ({ page }) => {
    await open(page, locale, false);
    await page.route('**/auth/v1/verify*', (route) =>
      route.fulfill({ status: 403, contentType: 'application/json', body: '{"code":403,"error_code":"otp_expired","msg":"expired"}' }),
    );
    await page.getByRole('button').filter({ hasText: LOCALES[locale]['signin.phone.action'] }).click();
    const field = page.getByLabel(LOCALES[locale]['signin.code.label']);
    await field.fill('123456');
    await expect(page.getByRole('alert').filter({ hasText: LOCALES[locale]['signin.code.wrong'] })).toBeVisible();

    const button = page.getByRole('button').filter({ hasText: LOCALES[locale]['signin.code.action'] });
    await expect(button).toBeVisible();
    const box = (await button.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(568);
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    // Nothing is over it: what is on top of its centre is the button, so a tap reaches it.
    const onTop = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.textContent ?? '',
      centre,
    );
    expect(onTop).toContain(LOCALES[locale]['signin.code.action']);
    // The legal links come after it, as on the first step.
    const privacy = await page.getByRole('link', { name: LOCALES[locale]['legal.privacy'] }).first().boundingBox();
    expect(privacy!.y).toBeGreaterThanOrEqual(box.y + box.height - 1);
  });
}

/**
 * Sign in keeps its room on a normal phone (Will, 14 October: "what happened to the gap spacing in the sign-in screen?").
 * D-564's short-screen rules set `rowGap` and the card's padding with a `null` default, which unset the card's own room on
 * every screen, not just short ones: the title sat 4px under the picture and the label, field, button and consent line
 * touched. The room is back, and on a 375×667 phone (not short, but small) it still fits above the fold.
 */
for (const [width, height] of [
  [390, 844],
  [375, 667],
] as const) {
  test(`${width}×${height}: the title, label, field, button and consent line have room, and all of it is above the fold`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/signin/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const box = async (locator: ReturnType<Page['locator']>) => (await locator.first().boundingBox())!;
    const hero = await box(page.locator('section'));
    const heading = await box(page.getByRole('heading', { name: en['signin.title'] }));
    const label = await box(page.getByText(en['signin.phone.label'], { exact: true }));
    const field = await box(page.locator('input[type="tel"]'));
    const button = await box(page.getByRole('button', { name: en['signin.phone.action'] }));
    const note = await box(page.getByText(/^Pam texts you a code/));
    const legal = await box(page.getByRole('link', { name: 'Privacy' }));

    expect(heading.y - (hero.y + hero.height), 'picture to title').toBeGreaterThanOrEqual(16);
    expect(label.y - (heading.y + heading.height), 'title to label').toBeGreaterThanOrEqual(8);
    expect(field.y - (label.y + label.height), 'label to field').toBeGreaterThanOrEqual(4);
    expect(button.y - (field.y + field.height) , 'field to button').toBeGreaterThanOrEqual(8);
    expect(note.y - (button.y + button.height), 'button to consent line').toBeGreaterThanOrEqual(8);
    expect(legal.y + legal.height, 'the legal links are above the fold').toBeLessThanOrEqual(height);
  });
}
