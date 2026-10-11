import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * Privacy and Terms opened from the website's footer go Back to the website
 * page they were opened from (Will, 11 October, D-508).
 *
 * The website links here with `?from=site&return=<its own path>` (its own test is
 * `apps/site/test/legal-links.test.ts`). The website itself is not served in this
 * suite, so a navigation to joinpam.org is answered with a stub page and what is
 * checked is the address Back goes to.
 */

const SITE = 'https://joinpam.org';

async function stubSite(page: Page) {
  await page.route(`${SITE}/**`, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<title>site</title><h1>site</h1>' }),
  );
}

const footerLink = (kind: 'privacy' | 'terms', from: string) =>
  `/${kind}/?from=site&return=${encodeURIComponent(from)}`;

for (const from of ['/', '/support/start-here/']) {
  test(`Back from the footer's Privacy on ${from} lands on the same website page`, async ({ page }) => {
    await stubSite(page);
    await page.goto(footerLink('privacy', from));
    await settled(page);

    const back = page.getByRole('link', { name: 'Back to the website' });
    await expect(back).toHaveAttribute('href', `${SITE}${from}`);
    await back.click();
    await expect(page).toHaveURL(`${SITE}${from}`);
  });
}

test('Terms from the website goes Back the same way', async ({ page }) => {
  await stubSite(page);
  await page.goto(footerLink('terms', '/for-families/'));
  await settled(page);
  await page.getByRole('link', { name: 'Back to the website' }).click();
  await expect(page).toHaveURL(`${SITE}/for-families/`);
});

test('the contents tabs keep the parameters, and the other document carries them on', async ({ page }) => {
  await stubSite(page);
  await page.goto(footerLink('privacy', '/support/start-here/'));
  await settled(page);

  // A tab scrolls in place (D-497): the address does not change, Back is still the website.
  const tabs = page.getByRole('navigation', { name: 'On this page' }).getByRole('link');
  await tabs.nth(1).click();
  await expect(page).toHaveURL(/from=site&return=%2Fsupport%2Fstart-here%2F/);
  await expect(page.getByRole('link', { name: 'Back to the website' })).toHaveAttribute(
    'href',
    `${SITE}/support/start-here/`,
  );

  // Privacy to Terms keeps where the reader came from.
  await page.getByRole('link', { name: 'Terms of service' }).click();
  await expect(page).toHaveURL(/\/terms\/\?from=site&return=%2Fsupport%2Fstart-here%2F/);
  await page.getByRole('link', { name: 'Back to the website' }).click();
  await expect(page).toHaveURL(`${SITE}/support/start-here/`);
});

for (const hostile of [
  '//evil.example/',
  'https://evil.example/',
  '/\\evil.example',
  'javascript:alert(1)',
  '/a//b',
  '',
]) {
  test(`a return value of ${JSON.stringify(hostile)} is ignored`, async ({ page }) => {
    await page.goto(`/privacy/?from=site&return=${encodeURIComponent(hostile)}`);
    await settled(page);

    // Today's behaviour: Back to Legal, inside the app; nothing points off the app.
    const back = page.getByRole('link', { name: 'Back to Legal' });
    await expect(back).toBeVisible();
    await expect(back).toHaveAttribute('href', '/legal/');
    await expect(page.getByRole('link', { name: 'Back to the website' })).toHaveCount(0);
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
    expect(hrefs.filter((h) => /evil|javascript:/.test(h))).toEqual([]);
  });
}

test('no return at all is ignored too', async ({ page }) => {
  await page.goto('/terms/?from=site');
  await settled(page);
  await expect(page.getByRole('link', { name: 'Back to Legal' })).toBeVisible();
});

test('the page opened from the website has no WCAG A/AA violations', async ({ page }) => {
  await page.goto(footerLink('privacy', '/'));
  await settled(page);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
