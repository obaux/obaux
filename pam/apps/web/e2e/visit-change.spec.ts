import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * A place opened from a trip is about that visit (D-273, D-281): "Your next
 * visit", its day and time, and "Change appointment" — which moves the trip
 * rather than adding a second one, and comes back to the place.
 */
const FROM_TRIP = '/place/?id=dummy-place-learning&from=trips&trip=dummy-trip-1';

test('the visit card says it is the next visit, where comes before what, and no WCAG A/AA violations', async ({ page }) => {
  await page.goto(FROM_TRIP);
  await settled(page);
  await expect(page.getByText('Your next visit')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Change appointment' })).toBeVisible();
  // Address, then hours, then About (D-281).
  const top = async (name: string) => (await page.getByRole('heading', { name }).boundingBox())!.y;
  expect(await top('Address')).toBeLessThan(await top('Opening hours'));
  expect(await top('Opening hours')).toBeLessThan(await top('What this place is'));
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('Change appointment moves the visit and returns to the place', async ({ page }) => {
  await page.goto('/trips/');
  await settled(page);
  await page.goto(FROM_TRIP);
  await settled(page);
  await page.getByRole('link', { name: 'Change appointment' }).click();
  await expect(page.getByRole('heading', { name: 'Change your visit' })).toBeVisible();

  const day = page.getByRole('button', { name: /^Mon, / }).last();
  const picked = (await day.textContent())!.trim();
  await day.click();
  await page.getByRole('button', { name: '3:30 PM' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Save the new time' }).click();

  await expect(page).toHaveURL(/\/place\/\?.*id=dummy-place-learning/);
  await expect(page.getByText('Your next visit')).toBeVisible();
  await expect(page.getByText('3:30 PM')).toBeVisible();
  // "Mon, Oct 19" on the chip, "Monday, October 19" on the card.
  await expect(page.getByText(new RegExp(`Monday, \\w+ ${picked.split(' ').pop()}$`))).toBeVisible();
});
