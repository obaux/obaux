import { expect, test, type Page } from '@playwright/test';
import en from '@pam/config/locales/en.json';
import ar from '@pam/config/locales/ar.json';
import { settled } from './settled';

/**
 * Three controls were under 48px (Iris's member flow pass, W4; D-500, §2.5): the Trips banner's "Sign" (34px wide,
 * 25 in Arabic), the policy header's "Done" in Arabic (24px) and the signature sheet's "Clear" (40px). A short word
 * was as wide as its letters, and a thumb 20px from the centre missed it. Each is 48 by 48 or more now, in English
 * and in Arabic. Supabase is stubbed at the network.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const PLACE = '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11';
const TRIP = '7a1f0f3c-2b11-4c0f-8b64-000000000002';
const POLICY = 'a1b2c3d4-0000-4000-8000-000000000001';
const LOCALES = { en, ar } as const;
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedInMember(page: Page, locale: keyof typeof LOCALES) {
  await page.addInitScript(
    ([userId, code]: [string, string]) => {
      const session = {
        access_token: 't',
        refresh_token: 'r',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: userId, aud: 'authenticated', role: 'authenticated' },
      };
      for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
      window.localStorage.setItem('pam.locale', code);
    },
    [ME, locale] as [string, string],
  );
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({ id: ME, role: 'member', first_name: 'Marcus', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', preferred_language: locale }),
    ),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trip_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/my_trips*', (route) =>
    route.fulfill(
      json([
        {
          id: TRIP,
          service_id: PLACE,
          place_name: 'Riverside Job Center',
          category: 'workforce',
          address: '1234 Market St',
          lat: 39.95,
          lon: -75.16,
          starts_at: new Date(Date.now() + 6 * 86_400_000).toISOString(),
          note: null,
          status: 'scheduled',
        },
      ]),
    ),
  );
  await page.route('**/rest/v1/program_policies*', (route) =>
    route.fulfill(
      json([
        {
          id: POLICY,
          service_id: PLACE,
          title: 'Confidentiality',
          version: 1,
          replaces_id: null,
          created_at: '2026-10-06T10:00:00Z',
          archived_at: null,
          program_policy_files: [
            { id: `${POLICY}-f`, path: `${PLACE}/${POLICY}.pdf`, name: 'Confidentiality.pdf', content_type: 'application/pdf', size_bytes: 1000, position: 0 },
          ],
        },
      ]),
    ),
  );
  await page.route('**/rest/v1/policy_signatures*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/member_signatures*', (route) => route.fulfill(json(null)));
}

const wholly = async (locator: ReturnType<Page['locator']>, what: string) => {
  const box = (await locator.boundingBox())!;
  expect(box, `${what} has a box`).not.toBeNull();
  expect(box.width, `${what} is at least 48px wide`).toBeGreaterThanOrEqual(47.5);
  expect(box.height, `${what} is at least 48px tall`).toBeGreaterThanOrEqual(47.5);
};

for (const locale of ['en', 'ar'] as const) {
  const words = LOCALES[locale];
  test.describe(`tap targets, ${locale}`, () => {
    test('the Trips banner\'s "Sign" is 48px', async ({ page }) => {
      await signedInMember(page, locale);
      await page.goto('/trips/');
      await settled(page);
      const sign = page.getByRole('link', { name: words['trips.added.policies.action'], exact: true });
      await expect(sign).toBeVisible();
      await wholly(sign, 'the banner\'s Sign');
    });

    test('the policy header\'s "Done" is 48px', async ({ page }) => {
      await signedInMember(page, locale);
      await page.goto(`/place/policies/view/?place=${PLACE}&name=Riverside%20Job%20Center&id=${POLICY}&via=list`);
      await settled(page);
      const done = page.getByRole('button', { name: words['places.area.done'], exact: true });
      await expect(done).toBeVisible();
      await wholly(done, 'the policy\'s Done');
    });

    test('the signature sheet\'s "Clear" is 48px', async ({ page }) => {
      await signedInMember(page, locale);
      await page.goto(`/place/policies/view/?place=${PLACE}&name=Riverside%20Job%20Center&id=${POLICY}&via=list`);
      await settled(page);
      await page.getByRole('button', { name: words['memberPolicy.sign'], exact: true }).click();
      const clear = page.getByRole('dialog').getByRole('button', { name: words['sign.clear'], exact: true });
      await expect(clear).toBeVisible();
      await wholly(clear, 'the signature sheet\'s Clear');
    });
  });
}
