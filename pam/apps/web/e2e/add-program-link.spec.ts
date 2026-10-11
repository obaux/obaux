import { test, expect } from '@playwright/test';
import { settled } from './settled';

/**
 * The link in the text that approves a program lead (D-496): /programs/new/.
 * It is opened from a cold link, often signed out. These check that it carries
 * its own preview picture and that a signed-out visitor goes to Sign in, not to
 * a form that saves nothing.
 */
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

test('the page carries its own preview: title, description and the picture, absolute', async ({ page }) => {
  await page.route('**/rest/v1/**', (route) => route.fulfill(json([])));
  await page.route('**/auth/v1/**', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }));
  await page.goto('/programs/new/');
  await expect(page).toHaveTitle('Add your program to Pam');
  const og = (name: string) => page.locator(`meta[property="og:${name}"]`).getAttribute('content');
  expect(await og('image')).toMatch(/^https:\/\/.+\/og\/add-program\.jpg$/);
  expect(await og('title')).toBe('Add your program to Pam');
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', /\/og\/add-program\.jpg$/);
});

test('a signed-out visitor from a cold link is taken to Sign in, not shown the form', async ({ page }) => {
  await page.route('**/rest/v1/**', (route) => route.fulfill(json([])));
  await page.route('**/auth/v1/**', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }));
  await page.goto('/programs/new/');
  await settled(page);
  await expect(page).toHaveURL(/\/signin\/$/);
  await expect(page.getByRole('textbox', { name: "What's your program called?" })).toHaveCount(0);
});
