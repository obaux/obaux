import type { Page } from '@playwright/test';

/**
 * Signed in as a member, with nothing else said about them: for the specs that open Explore (`/`), which is behind the tab gate
 * (a signed-out visitor is sent to Sign in). The old Places list they used to open was public and is retired (13 October 2026).
 * A spec that needs the profile, the saved list or the notifications to say something specific routes its own over these.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

export async function asMember(
  page: Page,
  role: 'member' | 'admin' | 'provider' | 'super_admin' = 'member',
  // A signed-in person's own language wins over the phone's stored one (LocaleSync), so a spec that wants another says so here.
  language: string | null = null,
): Promise<void> {
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, ME);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: ME, role, first_name: 'Pia', region_id: null, regions: { name: 'Philadelphia' }, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', org_id: null, preferred_language: language })),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
}
