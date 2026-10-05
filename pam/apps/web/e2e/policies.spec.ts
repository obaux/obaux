import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * A member reads and signs a program's policies (D-270).
 *
 * The promise being tested: a signature is drawn once, and every policy after
 * that is one tap. Example data, kept for the visit (`useMySignatures`).
 */
const LIST = '/place/policies/?id=dummy-place-learning&name=Example%20Learning%20Center';
const FIRST = '/place/policies/view/?place=dummy-place-learning&name=Example%20Learning%20Center&id=policy-confidentiality';

async function draw(page: Page) {
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.move(box.x + 40, box.y + 110);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) await page.mouse.move(box.x + 40 + i * 10, box.y + 110 - (i % 4) * 8);
  await page.mouse.up();
}

test('the list says what is left to sign, and has no WCAG A/AA violations', async ({ page }) => {
  await page.goto(LIST);
  await settled(page);
  await expect(page.getByRole('heading', { name: 'Policies to sign' })).toBeVisible();
  await expect(page.getByText('0 of 4 signed')).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('draw once, then each policy after is one tap', async ({ page }) => {
  await page.goto(FIRST);
  await expect(page.getByRole('heading', { name: 'Confidentiality and disclosure' })).toBeVisible();

  // First time: Sign opens the sheet, and its Sign waits for a signature.
  await page.getByRole('button', { name: 'Sign', exact: true }).click();
  const sheet = page.getByRole('dialog');
  const sheetSign = sheet.getByRole('button', { name: 'Sign', exact: true });
  await expect(sheetSign).toBeDisabled();
  await draw(page);
  await expect(sheetSign).toBeEnabled();
  await sheetSign.click();

  await expect(page.getByText(/^Signed /)).toBeVisible();
  await page.getByRole('button', { name: 'Next: Liability disclaimer' }).click();

  // Second: the saved signature is shown, and Sign signs straight away.
  await expect(page.getByRole('heading', { name: 'Liability disclaimer' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Your signature' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText(/^Signed /)).toBeVisible();

  await page.goto(LIST);
  await expect(page.getByText('2 of 4 signed')).toBeVisible();
});

test('a name can be typed instead of drawn', async ({ page }) => {
  await page.goto(FIRST);
  await page.getByRole('button', { name: 'Sign', exact: true }).click();
  await page.getByRole('button', { name: 'Type my name instead' }).click();
  await page.getByLabel('Your full name').fill('Marcus Johnson');
  await page.getByRole('dialog').getByRole('button', { name: 'Sign', exact: true }).click();
  await expect(page.getByText(/^Signed /)).toBeVisible();
});
