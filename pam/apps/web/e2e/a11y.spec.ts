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

/**
 * The design system is actually applied.
 *
 * The first build imported all three Astryx stylesheets correctly and still
 * rendered every component unstyled, in browser-default serif, because Astryx
 * is applied by the `<Theme>` provider and not by the CSS alone. Nothing caught
 * it: the build passed, axe passed, and the unit tests passed on accessible
 * names. Only a screenshot showed it.
 *
 * These assertions are cheap and would have failed loudly.
 */
test.describe('Astryx theme', () => {
  test('resolves theme typography rather than browser defaults', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const fonts = await page.evaluate(() => {
      const of = (sel: string) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).fontFamily : '';
      };
      return { heading: of('h1'), text: of('.astryx-text'), button: of('button') };
    });

    // A serif computed value means no Astryx rule matched the element.
    for (const [where, family] of Object.entries(fonts)) {
      expect(family, `${where} fell back to a browser default font`).not.toMatch(
        /^"?(Times|Times New Roman|serif)"?$/i,
      );
      expect(family, `${where} is not on the theme font stack`).toContain('Figtree');
    }
  });

  test('defines its theme tokens on the document', async ({ page }) => {
    await page.goto('/');
    // Next splits the three Astryx stylesheets across separate chunks, and the
    // theme sheet is the last to land. Until it does, `--font-family-body`
    // resolves to the base stack without the theme face. Assert the settled
    // state — the transient one is harmless here because both stacks are sans
    // fallbacks and the webfont loads with `display: swap` regardless.
    await page.waitForLoadState('networkidle');

    const tokens = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        body: root.getPropertyValue('--font-family-body').trim(),
        textPrimary: root.getPropertyValue('--color-text-primary').trim(),
        radius: root.getPropertyValue('--radius-element').trim(),
      };
    });

    expect(tokens.body, 'theme font token missing').toContain('Figtree');
    expect(tokens.textPrimary, 'theme colour token missing').not.toBe('');
    expect(tokens.radius, 'theme radius token missing').not.toBe('');
  });

  test('loads the self-hosted theme font', async ({ page }) => {
    const responses: number[] = [];
    page.on('response', (r) => {
      if (r.url().endsWith('.woff2')) responses.push(r.status());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(responses.length, 'no webfont was requested').toBeGreaterThan(0);
    expect(responses.every((s) => s === 200), `font responses: ${responses}`).toBe(true);
  });
});
