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
  // Address, then About (D-281); the hours are a row above both (D-309).
  const top = async (name: string) => (await page.getByRole('heading', { name }).boundingBox())!.y;
  // About reads "About service" when the visit is for one (D-313).
  expect(await top('Address')).toBeLessThan(await top('About service'));
  await expect(page.getByRole('button', { name: /^Hours: / })).toBeVisible();
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

test('Cancel this visit asks first, then takes the visit off Trips', async ({ page }) => {
  await page.goto(FROM_TRIP);
  await settled(page);
  await page.getByRole('button', { name: 'Cancel this visit' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Cancel your visit to Example Learning Center?')).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);

  // Keeping it changes nothing.
  await dialog.getByRole('button', { name: 'Keep my visit' }).click();
  await expect(page.getByText('Your next visit')).toBeVisible();

  await page.getByRole('button', { name: 'Cancel this visit' }).click();
  // Watch for the move to Trips before tapping: this example visit belongs to nobody signed in, so
  // Trips' gate sends the page on to Sign in a moment later. Reading the address after the tap
  // raced that redirect and failed under load in CI (10 October); the move itself is what is tested.
  const toTrips = page.waitForURL(/\/trips\/$/, { waitUntil: 'commit' });
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, cancel it' }).click();
  await toTrips;
  await settled(page);
  // The example visit is gone from the list.
  await page.goto(FROM_TRIP);
  await expect(page.getByText('Your next visit')).toHaveCount(0);
});
