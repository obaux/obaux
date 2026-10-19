import { test, expect } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';

/**
 * Screens don't explain (D-608, Will 18 October 15:19): what a promise or a reason is lives in Privacy and Terms, and the screen is its title
 * and its choices. These are the lines cut from the member's place and the program lead's screens. The flag screen's own spec
 * (`flag.spec.ts`) and the staff Home's (`staff-home.spec.ts`) cover theirs.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('pam.examples', '1'));
});

test('cancelling a visit asks the question and says nothing more about reminders', async ({ page }) => {
  await asMember(page, 'member');
  await page.goto('/place/?id=dummy-place-learning&from=trips&trip=dummy-trip-1');
  await settled(page);
  await page.getByRole('button', { name: 'Cancel this visit' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Cancel your visit to Example Learning Center?')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Keep my visit' })).toBeVisible();
  await expect(dialog.getByText(/Any reminder for it is cancelled too/)).toHaveCount(0);
});

test('a program lead\'s Policies is the list, with no line explaining what policies are', async ({ page }) => {
  await asMember(page, 'provider');
  await page.goto('/program/policies/');
  await settled(page);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(page.getByText(/Documents members read and sign before they take part/)).toHaveCount(0);
});
