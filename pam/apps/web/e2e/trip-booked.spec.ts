import { test, expect } from '@playwright/test';
import { settled } from './settled';

/**
 * "Your trip is booked" (D-333, D-336, D-337): the green visit card with how
 * soon and Change appointment, then Policies to sign and Bring a friend as
 * plain rows. Back from Policies to sign returns to this screen, not to a
 * fresh Plan a visit at its first step.
 */
test('booking ends on the green card, and Back from Policies returns to it', async ({ page }) => {
  await page.goto('/trips/new/?place=dummy-place-learning&name=Example%20Learning%20Center&category=education');
  await settled(page);
  await page.getByRole('button', { name: /^(Mon|Tue|Wed|Thu|Fri), / }).first().click();
  await page.getByRole('button', { name: /AM|PM/ }).first().click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Add this trip' }).click();

  await expect(page.getByRole('heading', { name: 'Your trip is booked' })).toBeVisible();
  await expect(page).toHaveURL(/booked=added-/);
  await expect(page.getByRole('link', { name: 'Change appointment' })).toBeVisible();
  await expect(page.getByText(/^(Today|Tomorrow|In \d+ days)$/)).toBeVisible();

  await page.getByRole('link', { name: /^Policies to sign/ }).click();
  await expect(page).toHaveURL(/\/place\/policies\//);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Your trip is booked' })).toBeVisible();
});
