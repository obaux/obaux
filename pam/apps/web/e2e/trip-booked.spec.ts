import { test, expect } from '@playwright/test';
import { settled } from './settled';

/**
 * "Your trip is booked" (D-333, D-336, D-337): the green visit card with how
 * soon and Change appointment, then Policies to sign and Bring a friend as
 * plain rows. Back from Policies to sign returns to this screen, not to a
 * fresh Plan a visit at its first step.
 */
// These walk the example places, services and policies, which a demo asks for outright; a real account has none (D-509).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('pam.examples', '1'));
});

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

test('Bring a friend: the picture touches the drawer’s top edge, with a round X over it in the top-right corner (Will, a97)', async ({ page }) => {
  await page.goto('/trips/new/?place=dummy-place-learning&name=Example%20Learning%20Center&category=education');
  await settled(page);
  await page.getByRole('button', { name: /^(Mon|Tue|Wed|Thu|Fri), / }).first().click();
  await page.getByRole('button', { name: /AM|PM/ }).first().click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Add this trip' }).click();
  await expect(page.getByRole('heading', { name: 'Your trip is booked' })).toBeVisible();

  await page.getByRole('button', { name: /Bring a friend/ }).first().click();
  const panel = page.locator('dialog[open] .astryx-bottom-sheet');
  await expect(panel).toBeVisible();
  await page.waitForTimeout(600);
  const box = (await panel.boundingBox())!;
  const picture = (await page.locator('dialog[open] img').first().boundingBox())!;
  expect(Math.abs(picture.y - box.y)).toBeLessThan(2);
  expect(picture.width).toBeGreaterThanOrEqual(box.width - 2);
  // An X (something is done in here: the link is copied), named Close, round, 48px, in the top-right corner.
  const close = page.locator('dialog[open]').getByRole('button', { name: 'Close' });
  const b = (await close.boundingBox())!;
  expect(b.width).toBeGreaterThanOrEqual(48);
  expect(box.x + box.width - (b.x + b.width)).toBeLessThan(24);
  expect(b.y - box.y).toBeLessThan(16);
  expect(await close.evaluate((el) => el.querySelector('svg path')?.getAttribute('d') ?? '')).not.toBe('M5 13l4 4L19 7');
  await close.click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});
