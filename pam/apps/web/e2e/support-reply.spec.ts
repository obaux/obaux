import { test, expect } from '@playwright/test';
import { settled } from './settled';

/**
 * Answering a help request by text (A28, D-524): a super admin opens the link from the request email, types a short
 * answer and Pam queues one text. The server decides whether it may go; this checks the screen. Supabase is stubbed at
 * the network, as in alerts.spec.ts.
 */
const USER = '**/auth/v1/user*';
const PROFILES = '**/rest/v1/profiles*';
const POINTS = '**/rest/v1/rpc/member_points*';
const CONTROLS = '**/rest/v1/access_controls*';
const NOTIFICATIONS = '**/rest/v1/notifications*';
const SEND = '**/rest/v1/rpc/send_support_text*';
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';

const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedInAs(page: import('@playwright/test').Page, role: 'super_admin' | 'member') {
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) {
      window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
    }
  }, ME);
  await page.route(NOTIFICATIONS, (route) => route.fulfill(json([])));
  await page.route(CONTROLS, (route) => route.fulfill(json([])));
  await page.route(USER, (route) => route.fulfill(json({ id: ME, phone: '12673095265' })));
  await page.route(POINTS, (route) => route.fulfill(json(250)));
  await page.route(PROFILES, (route) =>
    route.fulfill(
      json({ id: ME, role, first_name: 'Will', access_status: 'active', region_id: '0195b1c0-0000-4000-8000-000000000001', regions: { name: 'Philadelphia' } }),
    ),
  );
}

test.describe('Answer by text', () => {
  test('a super admin writes an answer and it is queued, once', async ({ page }) => {
    await signedInAs(page, 'super_admin');
    const calls: Record<string, unknown>[] = [];
    await page.route(SEND, (route) => {
      calls.push(JSON.parse(route.request().postData() ?? '{}'));
      return route.fulfill(json('11111111-1111-4111-8111-111111111111'));
    });
    await page.goto('/reply/?to=%2B12675559601');
    await settled(page);
    await expect(page.getByText('To (267) 555-9601')).toBeVisible();
    const send = page.getByRole('button', { name: 'Send text' });
    await expect(send).toBeDisabled();
    await page.getByLabel('Your answer').fill('We can help. Write to hello@joinpam.org.');
    await expect(page.getByText('40 of 120')).toBeVisible();
    await send.click();
    await expect(page.getByText('Queued. It goes out within five minutes.')).toBeVisible();
    expect(calls).toEqual([{ p_phone: '+12675559601', p_words: 'We can help. Write to hello@joinpam.org.' }]);
  });

  test('words the dispatcher would refuse are explained before anything is sent', async ({ page }) => {
    await signedInAs(page, 'super_admin');
    let called = 0;
    await page.route(SEND, (route) => {
      called += 1;
      return route.fulfill(json(null));
    });
    await page.goto('/reply/?to=%2B12675559601');
    await settled(page);
    await page.getByLabel('Your answer').fill('x'.repeat(130));
    await expect(page.getByText('130 of 120')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send text' })).toBeDisabled();
    expect(called).toBe(0);
  });

  test('when the server refuses, its reason is shown as it is', async ({ page }) => {
    await signedInAs(page, 'super_admin');
    await page.route(SEND, (route) =>
      route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: "Pam's texts are not on yet" }) }),
    );
    await page.goto('/reply/?to=%2B12675559601');
    await settled(page);
    await page.getByLabel('Your answer').fill('We can help.');
    await page.getByRole('button', { name: 'Send text' }).click();
    await expect(page.locator('main [role=alert], [role=alert]:not(#__next-route-announcer__)')).toHaveText("Pam's texts are not on yet");
  });

  test('without a number in the link there is nothing to send to', async ({ page }) => {
    await signedInAs(page, 'super_admin');
    await page.goto('/reply/');
    await settled(page);
    await expect(page.getByText('No number to text.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send text' })).toHaveCount(0);
  });

  test('anybody who is not a super admin meets the closed door', async ({ page }) => {
    await signedInAs(page, 'member');
    await page.goto('/reply/?to=%2B12675559601');
    await settled(page);
    await expect(page.getByRole('button', { name: 'Send text' })).toHaveCount(0);
    await expect(page.getByLabel('Your answer')).toHaveCount(0);
  });
});
