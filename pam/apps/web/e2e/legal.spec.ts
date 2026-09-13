import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';
import { expect, test } from '@playwright/test';
import en from '@pam/config/locales/en.json';


/**
 * The privacy notice and the terms.
 *
 * These are read by somebody deciding whether to trust PAM with a phone number,
 * often looking for one specific answer. So the tests are about finding things:
 * that the contents list exists, that it goes where it says, and that the page
 * tells you where you are as you read.
 */
for (const [name, path] of [
  ['privacy', '/privacy/'],
  ['terms', '/terms/'],
] as const) {
  test.describe(name, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
      await settled(page);
    });

    test('has a contents list, one entry per section', async ({ page }) => {
      const toc = page.getByRole('navigation', { name: en['legal.toc'] });
      await expect(toc).toBeVisible();
      const links = toc.getByRole('link');
      await expect(links).toHaveCount(8);
    });

    test('every entry lands on a heading that exists', async ({ page }) => {
      const hrefs = await page
        .getByRole('navigation', { name: en['legal.toc'] })
        .getByRole('link')
        .evaluateAll((links) => links.map((l) => (l as HTMLAnchorElement).getAttribute('href')));

      for (const href of hrefs) {
        expect(href).toMatch(/^#/);
        await expect(page.locator(href!)).toHaveCount(1);
      }
    });

    test('says where you are as you read', async ({ page }) => {
      const toc = page.getByRole('navigation', { name: en['legal.toc'] });
      const first = toc.getByRole('link').first();
      const last = toc.getByRole('link').last();

      await expect(first).toHaveAttribute('aria-current', 'true');

      // Reading to the bottom moves the mark with you. aria-current is what a
      // screen reader announces, so asserting it covers both the highlight and
      // the thing that makes the highlight mean something without sight.
      const lastHref = await last.getAttribute('href');
      await page.locator(lastHref!).scrollIntoViewIfNeeded();
      await expect(last).toHaveAttribute('aria-current', 'true', { timeout: 5000 });
      await expect(first).not.toHaveAttribute('aria-current', 'true');
    });

    test('never dead-ends: the other document and a way to a person', async ({ page }) => {
      const other = name === 'privacy' ? en['legal.terms'] : en['legal.privacy'];
      await expect(page.getByRole('link', { name: other })).toBeVisible();
      await expect(page.getByRole('link', { name: en['help.title'] })).toBeVisible();
    });

    test('has no WCAG A/AA violations', async ({ page }) => {
      await settled(page);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

test.describe('the way in points at them', () => {
  test('sign-in links to both documents', async ({ page }) => {
    await page.goto('/signin/');
    await expect(page.getByRole('link', { name: en['legal.privacy'] })).toBeVisible();
    await expect(page.getByRole('link', { name: en['legal.terms'] })).toBeVisible();
  });
});
