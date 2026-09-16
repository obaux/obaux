import { test, expect } from '@playwright/test';

/**
 * What a screen shows while it works out who is signed in.
 *
 * Moving between tabs is a full page load in a static export, so this state is
 * on screen every time somebody changes screen. It used to say "Finding places
 * nearby..." — on the account screen, on the saved list, on the case manager's
 * caseload (Will, 16 September).
 *
 * The session request is left hanging here rather than answered slowly: it is
 * the only way to hold the state still long enough to measure, and measuring is
 * the point — "centred" is a claim about pixels.
 */

const USER = '**/auth/v1/user*';
const PROFILES = '**/rest/v1/profiles*';

/** Signed in as far as the sign-in system is concerned; the profile never lands. */
async function stuckLoading(page: import('@playwright/test').Page) {
  const userId = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
  await page.addInitScript((id: string) => {
    const session = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) {
      window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
    }
  }, userId);

  await page.route(USER, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: userId }),
    }),
  );
  // Answered by nobody, ever: the screen stays on its loading state.
  await page.route(PROFILES, () => {});
}

test.describe('waiting for a screen', () => {
  test('shows one spinner, named, and no sentence about places', async ({ page }) => {
    await stuckLoading(page);
    await page.goto('/account/');

    // By name, not by role alone: Astryx puts an empty `role="status"` live
    // region inside the help link, which is not a spinner and never says
    // anything on this screen.
    const spinner = page.getByRole('status', { name: 'Loading' });
    await expect(spinner).toBeVisible();
    // One per view: two spinners for one wait is two things to interpret.
    await expect(spinner).toHaveCount(1);

    const text = (await page.locator('main').innerText()).trim();
    expect(text, 'the loading screen still prints copy').toBe('');
  });

  test('sits in the middle of the screen, not under the header', async ({ page }) => {
    await stuckLoading(page);
    await page.goto('/');

    const box = await page.getByRole('status', { name: 'Loading' }).boundingBox();
    const viewport = page.viewportSize();
    expect(box, 'the spinner has no box').not.toBeNull();
    expect(viewport, 'no viewport').not.toBeNull();

    const centreX = box!.x + box!.width / 2;
    const centreY = box!.y + box!.height / 2;

    expect(Math.abs(centreX - viewport!.width / 2), 'not horizontally centred').toBeLessThan(8);
    // Down the page rather than tucked under the mark, and above the fold.
    expect(centreY).toBeGreaterThan(viewport!.height * 0.25);
    expect(centreY).toBeLessThan(viewport!.height * 0.75);
  });

  test('is on every screen somebody can land on', async ({ page }) => {
    await stuckLoading(page);
    for (const path of ['/', '/account/', '/saved/', '/admin/', '/directory/', '/join/']) {
      await page.goto(path);
      await expect(
        page.getByRole('status', { name: 'Loading' }),
        `${path} has no spinner`,
      ).toBeVisible();
    }
  });

  test('the way to get help is still on the home screen while it waits', async ({ page }) => {
    // §0: a screen with nothing on it but a spinner is the dead end the help
    // bar exists to prevent, and this state is what a dying connection shows.
    await stuckLoading(page);
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Help/ })).toBeVisible();
  });
});
