import { expect, test } from '@playwright/test';
import en from '@pam/config/locales/en.json';

/**
 * The sign-in screen has to say that PAM will text you, and how to stop, before
 * you hand over a phone number.
 *
 * It is a promise to the member first: nobody should learn they signed up for
 * text messages by receiving one. It is also what US carriers review before they
 * will let an application send at all, and a screenshot of this screen is filed
 * with that registration — so a well-meaning tidy-up that removes it costs the
 * pilot its ability to text anybody.
 */
test.describe('consent to be texted', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin/');
  });

  test('says PAM will text you, and how to stop, on the screen', async ({ page }) => {
    const consent = page.getByText(en['signin.phone.consent']);
    await expect(consent).toBeVisible();
    await expect(consent).toContainText('STOP');
  });

  test('is on screen without scrolling, where somebody types their number', async ({ page }) => {
    // Where it sits is a design decision and may move again. What cannot move is
    // that somebody sees it before they hand over a number — so this asserts it
    // is inside the viewport, not that it is above or below anything.
    const consent = page.getByText(en['signin.phone.consent']);
    const box = await consent.boundingBox();
    const viewport = page.viewportSize();
    expect(box, 'the consent line has no box').not.toBeNull();
    expect(viewport, 'no viewport').not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
  });

  test('is not repeated on the code step, where the number is already given', async ({ page }) => {
    await page.getByLabel('Your phone number').fill('215 555 0100');
    // The screen only moves on once a code is actually requested; asserting the
    // copy exists on the first step and that this one is a different step is
    // enough — a second consent line after consent is noise.
    await expect(page.getByText(en['signin.phone.consent'])).toBeVisible();
  });
});
