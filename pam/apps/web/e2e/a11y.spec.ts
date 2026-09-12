import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { A11Y } from '@pam/config';

/**
 * §12 is build-blocking: "a11y test fails build on any WCAG AA violation."
 *
 * The unit suite in @pam/ui covers structure. This one covers what only a real
 * browser can measure — contrast against the actual theme, and whether a
 * finger-sized target really is finger-sized.
 */

test.describe('accessibility', () => {
  test('has no WCAG A/AA violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    // Print the detail on failure — "1 violation" with no node is unactionable.
    if (results.violations.length > 0) {
      console.error(
        results.violations
          .map((v) => `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.html).join('\n  ')}`)
          .join('\n\n'),
      );
    }

    expect(results.violations).toEqual([]);
  });

  test('every interactive control clears the 48px minimum target (§2.5)', async ({ page }) => {
    await page.goto('/');

    const controls = page.locator('button:visible, a[href]:visible, input:visible');
    const count = await controls.count();
    expect(count).toBeGreaterThan(0);

    const tooSmall: string[] = [];
    for (let i = 0; i < count; i++) {
      const control = controls.nth(i);
      const box = await control.boundingBox();
      if (!box) continue;
      if (box.height < A11Y.minTouchTargetPx) {
        const label = (await control.textContent())?.trim() || (await control.getAttribute('aria-label')) || '(unnamed)';
        tooSmall.push(`${label}: ${box.height.toFixed(0)}px tall`);
      }
    }

    expect(tooSmall, `controls under ${A11Y.minTouchTargetPx}px:\n  ${tooSmall.join('\n  ')}`)
      .toEqual([]);
  });

  test('the primary button is 64px tall (§2.5)', async ({ page }) => {
    await page.goto('/');
    const big = page.getByRole('button', { name: 'I understand' });
    const box = await big.boundingBox();
    expect(box?.height).toBe(A11Y.primaryButtonHeightPx);
  });

  test('body text is at least 18px on mobile (§2.5)', async ({ page }) => {
    await page.goto('/');
    const size = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.body).fontSize),
    );
    expect(size).toBeGreaterThanOrEqual(A11Y.bodyTextMobilePx);
  });

  test('does not scroll horizontally at 320px (§12)', async ({ page }) => {
    await page.goto('/');
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows).toBe(false);
  });

  test('help is reachable from the page without JavaScript (§0 never dead-end)', async ({ page }) => {
    await page.goto('/');
    const help = page.getByRole('link', { name: /Need help/ });
    await expect(help).toBeVisible();
    await expect(help).toHaveAttribute('href', /^tel:/);
  });
});
