import { test, expect } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';
import en from '@pam/config/locales/en.json';

/**
 * "If something here worries you, write to us at hello@joinpam.org." is an email line: its icon is an envelope, not the handset
 * it had before A28 (Pam has no phone line). The handset stays where something dials (988, 911, a place's number).
 */
test('the short version’s write-to-us row has an envelope, not a phone', async ({ page }) => {
  await asMember(page);
  await page.goto('/legal/privacy/');
  await settled(page);
  const row = page.getByRole('listitem').filter({ hasText: en['privacy.s.contact.p1'] });
  await expect(row.locator('svg[data-icon="mail"]')).toHaveCount(1);
});
