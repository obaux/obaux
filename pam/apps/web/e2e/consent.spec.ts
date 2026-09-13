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

  test('says it above the button, where it is read before it is agreed to', async ({ page }) => {
    const order = await page.evaluate((text: string) => {
      const all = [...document.querySelectorAll('*')];
      const consent = all.find((el) => el.children.length === 0 && el.textContent?.includes(text));
      const button = all.find((el) => el.textContent?.trim() === 'Send me a code');
      if (!consent || !button) return 'missing';
      // Node.DOCUMENT_POSITION_FOLLOWING === 4
      return (consent.compareDocumentPosition(button) & 4) === 4 ? 'before' : 'after';
    }, en['signin.phone.consent']);

    expect(order).toBe('before');
  });
});
