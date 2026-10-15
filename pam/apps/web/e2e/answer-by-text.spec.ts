import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * Answer by text shows who wrote and what they asked (D-583; Iris's W3): the first name if Pam knows the number,
 * the number as a person reads it, and the words and the time from the link. The words ride after the `#`, which
 * no server sees; nothing is stored. Answering by text itself stays off (D-524, D-547): this is only the screen.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const QUESTION = 'I signed up for the welding class but cannot find where it meets.';

async function signedIn(page: Page, role: 'super_admin' | 'member', lookup: string | null) {
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
      json({ id: ME, role, first_name: 'Sy', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', org_id: null }),
    ),
  );
  await page.route('**/rest/v1/rpc/profile_first_name_for_phone*', (route) => route.fulfill(json(lookup)));
}

function requestsMentioning(page: Page, text: string): string[] {
  const hits: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes(text) || (request.postData() ?? '').includes(text)) hits.push(request.url());
  });
  return hits;
}

test.describe('Answer by text', () => {
  test('a number Pam knows: the name, the number as a person reads it, what they wrote and when', async ({ page }) => {
    await signedIn(page, 'super_admin', 'Ana');
    const leaked = requestsMentioning(page, 'welding');
    const asked: unknown[] = [];
    page.on('request', (r) => {
      if (r.url().includes('profile_first_name_for_phone')) asked.push(r.postDataJSON());
    });
    await page.goto(`/reply/?to=${encodeURIComponent('+12155550142')}#q=${encodeURIComponent(QUESTION)}&at=2026-10-15T14:05:00Z`);
    await settled(page);
    await expect(page.getByText('To Ana, (215) 555-0142')).toBeVisible();
    await expect(page.getByText(QUESTION)).toBeVisible();
    await expect(page.getByText(/^They wrote · /)).toBeVisible();
    await expect(page.getByText(/2026/)).toBeVisible();
    expect(asked).toEqual([{ p_phone: '+12155550142' }]);
    // The words are in the address after the #, so no request carries them.
    expect(leaked).toEqual([]);
  });

  test('a number Pam does not know, and a link with nothing else: just the number and the box', async ({ page }) => {
    await signedIn(page, 'super_admin', null);
    await page.goto(`/reply/?to=${encodeURIComponent('+12155550199')}`);
    await settled(page);
    await expect(page.getByText('To (215) 555-0199')).toBeVisible();
    await expect(page.getByText('They wrote')).toHaveCount(0);
    await expect(page.getByLabel('Your answer')).toBeVisible();
  });

  test('words from the link are shown as text, never as markup', async ({ page }) => {
    await signedIn(page, 'super_admin', null);
    await page.goto(`/reply/?to=${encodeURIComponent('+12155550199')}#q=${encodeURIComponent('<img src=x onerror=alert(1)> hi')}`);
    await settled(page);
    await expect(page.getByText('<img src=x onerror=alert(1)> hi')).toBeVisible();
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
  });

  test('anyone but the super admin gets the notice, asks for no name, and sees no words', async ({ page }) => {
    await signedIn(page, 'member', 'Ana');
    let lookups = 0;
    page.on('request', (r) => {
      if (r.url().includes('profile_first_name_for_phone')) lookups += 1;
    });
    await page.goto(`/reply/?to=${encodeURIComponent('+12155550142')}#q=${encodeURIComponent(QUESTION)}`);
    await settled(page);
    await expect(page.getByText(QUESTION)).toHaveCount(0);
    expect(lookups).toBe(0);
  });
});
