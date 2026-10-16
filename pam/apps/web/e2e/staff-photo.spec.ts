import { expect, test, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * A staff member changes their photo (D-345), and the old file goes (Lena's privacy guard, D-587): once the new one
 * is saved, every other file in their folder is removed. Supabase is stubbed at the network.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const OLD = `${ME}/1760000000000.webp`;
const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
// A 1x1 PNG, enough for the phone-side shrink to make a WebP of.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

async function caseManager(page: Page, options: { saveFails?: boolean } = {}) {
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 't',
      refresh_token: 'r',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, ME);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/access_controls*', (route) => route.fulfill(json([])));
  const uploaded: string[] = [];
  const removed: string[][] = [];
  await page.route('**/rest/v1/profiles*', (route) => {
    if (route.request().method() === 'PATCH') return options.saveFails ? route.fulfill(json({ message: 'nope' }, 500)) : route.fulfill({ status: 204 });
    return route.fulfill(
      json({
        id: ME,
        role: 'admin',
        first_name: 'Dana',
        photo_url: `https://stub.supabase.co/storage/v1/object/public/staff-photos/${OLD}`,
        region_id: 'r1',
        regions: { name: 'Philadelphia' },
        access_status: 'active',
        onboarded_at: '2026-09-14T00:00:00Z',
      }),
    );
  });
  await page.route('**/storage/v1/object/**', (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.includes('/object/list/staff-photos')) {
      // The folder: the old photo and whatever was just uploaded.
      return route.fulfill(json([{ name: OLD.split('/')[1] }, ...uploaded.map((p) => ({ name: p.split('/')[1] }))]));
    }
    if (request.method() === 'DELETE') {
      removed.push((request.postDataJSON() as { prefixes: string[] }).prefixes);
      return route.fulfill(json([]));
    }
    if (request.method() === 'POST' && url.pathname.includes('/object/staff-photos/')) {
      uploaded.push(decodeURIComponent(url.pathname.split('/object/staff-photos/')[1]!));
      return route.fulfill(json({ Key: `staff-photos/${uploaded.at(-1)}` }));
    }
    return route.fulfill(json({}));
  });
  return { uploaded, removed };
}

test.describe('a staff photo', () => {
  test('changing it removes the old file, and only the old file (D-587)', async ({ page }) => {
    const { uploaded, removed } = await caseManager(page);
    await page.goto('/profile/');
    await settled(page);
    await expect(page.getByRole('button', { name: 'Change your photo' })).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG });
    await expect.poll(() => removed.length).toBe(1);
    expect(uploaded).toHaveLength(1);
    expect(removed[0]).toEqual([OLD]);
    expect(removed[0]).not.toContain(uploaded[0]);
  });

  test('when the new photo is not saved, nothing is removed: the old photo stays', async ({ page }) => {
    const { uploaded, removed } = await caseManager(page, { saveFails: true });
    await page.goto('/profile/');
    await settled(page);
    await page.locator('input[type="file"]').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG });
    await expect(page.getByText("Your photo didn't upload.", { exact: false })).toBeVisible();
    expect(uploaded).toHaveLength(1);
    expect(removed).toEqual([]);
  });
});
