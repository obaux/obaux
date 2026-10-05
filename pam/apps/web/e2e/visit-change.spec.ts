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

test('Change appointment moves the visit, celebrates, then goes home', async ({ page }) => {
  await page.goto(FROM_TRIP);
  await settled(page);
  await page.getByRole('link', { name: 'Change appointment' }).click();
  await expect(page.getByRole('heading', { name: 'Change your visit' })).toBeVisible();

  const day = page.getByRole('button', { name: /^Mon, / }).last();
  const date = (await day.textContent())!.trim().split(' ').pop()!;
  await day.click();
  await page.getByRole('button', { name: '3:30 PM' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Save the new time' }).click();

  // The moment (D-282): the new time, said out loud, and a way home.
  await expect(page.getByRole('heading', { name: 'Your visit is moved!' })).toBeVisible();
  await expect(page.getByText(new RegExp(`Example Learning Center, Monday, \\w+ ${date} at 3:30 PM`))).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go home' })).toBeVisible();
  // …then home on its own.
  await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });

  // The place shows the new time.
  await page.goto(FROM_TRIP);
  await expect(page.getByText('3:30 PM')).toBeVisible();
  await expect(page.getByText(new RegExp(`Monday, \\w+ ${date}$`))).toBeVisible();
});
