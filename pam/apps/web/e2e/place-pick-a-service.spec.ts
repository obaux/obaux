import { test, expect } from '@playwright/test';
import { settled } from './settled';

/**
 * "Plan a trip" waits until a service is picked on a place that has services
 * (D-313). It used to wait in silence; now it says why (Iris's member-flow pass,
 * W3; Will, 11 October 2026: "Pick a service above to plan a trip.").
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const LINE = 'Pick a service above to plan a trip.';

// These walk the example places, which a demo asks for outright; a real account has none (D-509).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('pam.examples', '1'));
});

async function signedInMember(page: import('@playwright/test').Page) {
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
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({ id: ME, role: 'member', first_name: 'Marcus', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' }),
    ),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
}

test('a place with services says why Plan a trip waits, and stops saying it once one is picked', async ({ page }) => {
  await signedInMember(page);
  await page.goto('/place/?id=dummy-place-learning');
  await settled(page);
  await expect(page.getByText(LINE)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Plan a trip' })).toBeDisabled();
  await page.getByText('GED classes', { exact: true }).click();
  await expect(page.getByRole('link', { name: 'Plan a trip' })).toBeVisible();
  await expect(page.getByText(LINE)).toHaveCount(0);
});

test('a place with no services never says it', async ({ page }) => {
  await signedInMember(page);
  await page.goto('/place/?id=dummy-place-food');
  await settled(page);
  await expect(page.getByRole('link', { name: 'Plan a trip' })).toBeVisible();
  await expect(page.getByText(LINE)).toHaveCount(0);
});

test('the note about what the program sees is below the services, so a member reads it after choosing one (a91)', async ({ page }) => {
  await signedInMember(page);
  await page.goto('/place/?id=dummy-place-learning');
  await settled(page);
  const services = (await page.getByText('GED classes', { exact: true }).boundingBox())!;
  const note = (await page.getByText(/will see your visit|only to help you plan/).boundingBox())!;
  expect(note.y).toBeGreaterThan(services.y);
});
