import { expect, test, type Page } from '@playwright/test';

/**
 * Two flashes Will saw on his phone, 10 October, on the live app:
 *
 * - "Loading screen is still showing the old page behind the new layout": while a
 *   tab screen waited for who is signed in it drew the OLD page — the Pam logo bar and
 *   a full-width Help block — not the new layout's own bar with the round Help button.
 * - "When I click on super admin profile, the member profile flashes behind it for a
 *   second": the Profile mounted after the tab gate had let it through, asked who is
 *   signed in all over again, and until it heard it drew its "nobody yet" default, a
 *   member's profile.
 *
 * Supabase is stubbed at the network.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedInAs(page: Page, role: string, options: { holdProfile?: boolean } = {}) {
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
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME, phone: '12673095265' })));
  await page.route('**/rest/v1/**', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/member_points*', (route) => route.fulfill(json(250)));
  await page.route('**/rest/v1/profiles*', (route) => {
    if (options.holdProfile) return; // never answered: the screen stays on "loading"
    return route.request().url().includes('role=eq.')
      ? route.fulfill(json([]))
      : route.fulfill(
          json({
            id: ME,
            role,
            first_name: 'Dana',
            region_id: '0195b1c0-0000-4000-8000-000000000001',
            regions: { name: 'Philadelphia' },
          }),
        );
  });
}

test.describe('no flash of another screen', () => {
  test('waiting to hear who is signed in shows the new layout, not the old page', async ({ page }) => {
    await signedInAs(page, 'member', { holdProfile: true });
    await page.goto('/saved/');
    await expect(page.getByRole('progressbar').or(page.getByLabel('Loading'))).toBeVisible();

    // The old page's Pam logo bar is not there...
    await expect(page.getByRole('img', { name: 'Pam' })).toHaveCount(0);
    // ...and Help is the round button of the new bar, not a full-width block.
    const help = page.getByRole('link', { name: 'Help' });
    await expect(help).toBeVisible();
    const box = await help.boundingBox();
    expect(box!.width, 'Help is the bar button, not the old full-width block').toBeLessThan(120);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  });

  test("a super admin's Profile never draws a member's first", async ({ page }) => {
    await page.addInitScript(() => {
      // "Your badge" is on a member's profile only. Looked for on every frame.
      (window as unknown as { __memberFrames: number }).__memberFrames = 0;
      const look = () => {
        if (document.body?.innerText.includes('Your badge')) (window as unknown as { __memberFrames: number }).__memberFrames += 1;
        requestAnimationFrame(look);
      };
      requestAnimationFrame(look);
    });
    await signedInAs(page, 'super_admin');
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Requests' })).toBeVisible();

    await page.getByRole('link', { name: /Profile/ }).last().click();
    await expect(page.getByRole('heading', { name: 'Dana' })).toBeVisible();
    await expect(page.getByText('Super admin').first()).toBeVisible();
    // Let it settle, then ask how many frames showed a member's profile.
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => (window as unknown as { __memberFrames: number }).__memberFrames)).toBe(0);
  });
});
