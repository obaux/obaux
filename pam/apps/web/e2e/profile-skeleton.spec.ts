import { expect, test, type Page } from '@playwright/test';
import { settled } from './settled';
import { arrived } from './arrived';

/**
 * Profile's hero card while it loads (Will, 11 October: "skeleton loaders for the image, stats and labels in profile
 * hero card"; D-518). The photo, name, role and each stat are drawn as pulses sized exactly like the real content, so
 * nothing moves when it arrives (layout shift is measured here), the pulse stops under reduce-motion, and a failed
 * call ends the pulse in the card's real empty state (a 0), not a pulse that never goes. Supabase is stubbed.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const PROFILE = {
  id: ME,
  role: 'member',
  first_name: 'Marcus',
  region_id: null,
  regions: null,
  access_status: 'active',
  onboarded_at: '2026-09-14T00:00:00Z',
};

async function stub(page: Page, options: { profileMs?: number; pointsMs?: number; pointsFails?: boolean } = {}) {
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
    // Layout shift, counted from the start.
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
        if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  }, ME);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/profiles*', async (route) => {
    await sleep(options.profileMs ?? 0);
    await route.fulfill(json(PROFILE));
  });
  await page.route('**/rest/v1/rpc/member_points*', async (route) => {
    await sleep(options.pointsMs ?? 0);
    if (options.pointsFails) return route.fulfill(json({ message: 'nope' }, 500));
    return route.fulfill(json(400));
  });
}

/** The hero card: the card holding the name's heading, or the busy card while nothing is known. */
const hero = (page: Page) =>
  page.locator('.astryx-card').filter({ has: page.locator('[aria-busy="true"], h2') }).first();

const shifts = (page: Page) => page.evaluate(() => (window as unknown as { __cls: number }).__cls);

test.describe("Profile's hero card while it loads", () => {
  test('stats are pulses the size of the numbers, then the numbers, and nothing moves', async ({ page }) => {
    await stub(page, { pointsMs: 1200 });
    await page.goto('/profile/');
    const card = page.getByRole('heading', { name: 'Marcus', level: 2 }).locator('xpath=ancestor::*[contains(@class,"astryx-card")][1]');
    await expect(card).toBeVisible();
    // While the points are on their way, a pulse stands where the number will be.
    await expect(card.locator('.astryx-skeleton').first()).toBeVisible();
    // Both reads are of a card that has finished rising (8px as it arrives): the claim is that nothing MOVES when the numbers land.
    await arrived(card);
    const before = (await card.boundingBox())!;
    await expect(card.getByText('400', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(card.locator('.astryx-skeleton')).toHaveCount(0);
    await arrived(card);
    const after = (await card.boundingBox())!;

    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
    expect(after.y).toBeCloseTo(before.y, 0);
    await settled(page);
    expect(await shifts(page)).toBeLessThan(0.01);
  });

  test('the whole card is pulses until the account is known, the same size as the real card', async ({ page }) => {
    await stub(page, { profileMs: 1200 });
    await page.goto('/account/');
    const busy = page.locator('[aria-busy="true"]');
    await expect(busy).toBeVisible();
    await expect(busy.locator('.astryx-skeleton')).not.toHaveCount(0);
    // It is announced once, politely, and the pulses themselves are hidden from a screen reader.
    await expect(page.getByRole('status').filter({ hasText: 'Loading' })).toHaveCount(1);
    // The pulses arrive with the screen's own rise (8px): the baseline is where it ends, as the real card's will be.
    await arrived(busy);
    const skeletonBox = (await busy.boundingBox())!;

    const card = page.getByRole('heading', { name: 'Marcus', level: 2 }).locator('xpath=ancestor::*[contains(@class,"astryx-card")][1]');
    await expect(card).toBeVisible({ timeout: 5000 });
    await expect(card.getByText('400', { exact: true })).toBeVisible();
    // The real card rises 8px as it arrives: measure it where it ends, not where it starts.
    await arrived(card);
    const realBox = (await card.boundingBox())!;
    expect(Math.abs(realBox.height - skeletonBox.height)).toBeLessThanOrEqual(2);
    expect(realBox.y).toBeCloseTo(skeletonBox.y, 0);
  });

  test('a failed call ends the pulse in a real 0, not a pulse that never goes', async ({ page }) => {
    await stub(page, { pointsFails: true });
    await page.goto('/profile/');
    const card = page.getByRole('heading', { name: 'Marcus', level: 2 }).locator('xpath=ancestor::*[contains(@class,"astryx-card")][1]');
    await expect(card).toBeVisible();
    await expect(card.locator('.astryx-skeleton')).toHaveCount(0, { timeout: 5000 });
    await expect(card.getByText('0', { exact: true }).first()).toBeVisible();
  });

  test('under reduce-motion the pulse stops', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await stub(page, { pointsMs: 1500 });
    await page.goto('/profile/');
    const pulse = page.locator('.astryx-skeleton').first();
    await expect(pulse).toBeVisible();
    const { duration, count } = await pulse.evaluate((el) => {
      const s = getComputedStyle(el);
      return { duration: parseFloat(s.animationDuration), count: s.animationIterationCount };
    });
    expect(duration).toBeLessThanOrEqual(0.001);
    expect(count).toBe('1');
  });
});
