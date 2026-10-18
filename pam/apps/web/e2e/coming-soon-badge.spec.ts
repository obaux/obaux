import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * D-608 (Will, 18 October: "Instead of having 'coming soon' and explaining what we don't do yet, we can
 * simply have a badge saying 'coming soon'"): Profile's offer for texts is its title and a "Coming soon"
 * badge, for a member, a case manager and a program lead. No sentence about what is coming.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedIn(page: Page, role: 'member' | 'admin' | 'provider') {
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 't',
      refresh_token: 'r',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) {
      window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
    }
  }, ME);
  await page.route('**/rest/v1/**', (route) => route.fulfill(json([])));
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({ id: ME, role, first_name: 'Pia', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', org_id: null }),
    ),
  );
}

const OFFERS = [
  ['member', 'Get text reminders'],
  ['admin', 'Get text alerts'],
  ['provider', 'Get text alerts'],
] as const;

for (const [role, title] of OFFERS) {
  test(`${role}: Profile's text offer is its title and a Coming soon badge`, async ({ page }) => {
    await signedIn(page, role);
    await page.goto('/profile/');
    await settled(page);
    // The link's name carries the badge too, so it is read out; the card around it is what is drawn.
    await expect(page.getByRole('link', { name: `${title}. Coming soon` })).toBeVisible();
    const card = page.locator('.astryx-card', { has: page.getByRole('link', { name: title }) });
    await expect(card).toBeVisible();
    await expect(card.getByText('Coming soon', { exact: true })).toBeVisible();
    await expect(card).not.toContainText(/texts about/i);
    // One line of badge, at reading size or above (A27).
    const size = await card.getByText('Coming soon', { exact: true }).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(12);
  });
}
