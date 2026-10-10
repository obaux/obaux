import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * A program books a visit for a member (D-316). Nothing is saved with the
 * program and nobody is texted yet (the step before says so), so the end screen
 * must not say "Booked" or "Pam texted" (Lena's promise sweep, 10 October).
 */
test('booking for a member ends on an example that says nothing was booked or texted', async ({ page }) => {
  await page.goto('/program/book/');
  await settled(page);
  await page.getByText('Miguel').first().click();
  await page.getByRole('button', { name: /^Tue, / }).first().click();
  await page.getByRole('button', { name: '10:30 AM' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText(/Example trips only for now/)).toBeVisible();
  await page.getByRole('button', { name: 'Book for Miguel' }).click();

  await expect(page.getByRole('heading', { name: 'Example booking for Miguel' })).toBeVisible();
  await expect(page.getByText(/This is only an example: nothing was booked with the program, and nobody was texted/)).toBeVisible();
  await expect(page.getByText(/Pam texted/)).toHaveCount(0);
  await expect(page.getByText(/^The text:/)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /^Booked for/ })).toHaveCount(0);

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
