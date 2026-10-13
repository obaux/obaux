import { expect, test, type Page } from '@playwright/test';
import en from '@pam/config/locales/en.json';
import { settled } from './settled';

/**
 * Pause, then Play, puts the pictures moving again (Iris W1, 13 October): on a phone a tap leaves focus on the button
 * it touched, and the carousel held while focus was inside it (D-501), so nothing moved until the person tapped
 * somewhere else. Only focus a keyboard put there holds it; an explicit Play never does.
 * The sign-in screen shows the carousel; it advances every 6s, so each step waits a little longer than that.
 */
const WAIT = 7500;

const slideNumber = (page: Page) =>
  page.evaluate(() => {
    const first = document.querySelector<HTMLElement>('[data-slide="0"]');
    const scroller = first?.parentElement?.parentElement;
    if (!scroller) return -1;
    return Math.round(Math.abs(scroller.scrollLeft) / scroller.clientWidth);
  });

const pause = (page: Page) => page.getByRole('button', { name: en['carousel.pause']! });
const play = (page: Page) => page.getByRole('button', { name: en['carousel.play']! });

test.describe('the sign-in carousel after Pause and Play', () => {
  // The rest of the suite runs with reduced motion (playwright.config), which hides the carousel's Pause control.
  test.use({ reducedMotion: 'no-preference' });

  test('a click on Play moves on without leaving the button first', async ({ page }) => {
    await page.goto('/signin/');
    await settled(page);
    await pause(page).first().click();
    await expect(play(page).first()).toBeVisible();
    const held = await slideNumber(page);
    await page.waitForTimeout(WAIT);
    expect(await slideNumber(page), 'paused: it stays where it is').toBe(held);

    await play(page).first().click(); // the button keeps focus after a click; nothing else is touched
    await page.waitForTimeout(WAIT);
    expect(await slideNumber(page), 'Play: it moves on').not.toBe(held);
  });

  test('Play with the keyboard moves on too', async ({ page }) => {
    await page.goto('/signin/');
    await settled(page);
    await pause(page).first().focus();
    await page.keyboard.press('Enter');
    await expect(play(page).first()).toBeVisible();
    const held = await slideNumber(page);
    await page.keyboard.press('Enter');
    await expect(pause(page).first()).toBeVisible();
    await page.waitForTimeout(WAIT);
    expect(await slideNumber(page)).not.toBe(held);
  });

  test('keyboard focus on the carousel still holds it', async ({ page }) => {
    await page.goto('/signin/');
    await settled(page);
    const start = await slideNumber(page);
    await page.keyboard.press('Tab');
    await page.evaluate(() => (document.querySelector('section [role="group"], section') as HTMLElement | null)?.focus?.());
    await pause(page).first().focus(); // reached by the keyboard model: focus() after a key press is focus-visible
    await page.waitForTimeout(WAIT);
    expect(await slideNumber(page), 'held while keyboard focus is on the controls').toBe(start);
  });
});
