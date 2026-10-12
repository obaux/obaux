import { expect, test } from '@playwright/test';
import en from '@pam/config/locales/en.json';
import { settled } from './settled';

/** Data sources on the Legal screen (D-540): the credit CC BY 4.0 asks for — creator, licence link, source link, "changed". */
test('Legal credits the neighborhood list: creator, source, licence, and that it was changed', async ({ page }) => {
  await page.goto('/legal/');
  await settled(page);
  await expect(page.getByRole('heading', { name: en['legal.sources.title'] })).toBeVisible();
  const credit = page.getByText(en['legal.sources.neighborhoods']);
  await expect(credit).toBeVisible();
  await expect(credit).toContainText('Abaca Labs');
  await expect(credit).toContainText('changed');
  await expect(page.getByRole('link', { name: en['legal.sources.link'] })).toHaveAttribute(
    'href',
    /github\.com\/azavea\/geo-data\/tree\/5c4538b5f4d2a26a81b7fab2d0006d327a39e3d0\/philadelphia-neighborhoods/,
  );
  await expect(page.getByRole('link', { name: en['legal.sources.licence'] })).toHaveAttribute(
    'href',
    'https://creativecommons.org/licenses/by/4.0/',
  );
  // It sits under the menu, and the three policies are still there.
  await expect(page.getByRole('link', { name: en['legal.menu.terms'] })).toBeVisible();
});
