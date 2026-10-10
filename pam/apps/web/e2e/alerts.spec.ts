import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';
import { ALERT_TEXTS_LIVE } from '../src/lib/alertTextsLive';

/**
 * Text alerts, one switch per kind (D-256, D-478). Each switch is its own yes,
 * kept on the account; turning one on records the yes to texts, and turning the
 * last one off withdraws it for a program or case manager. A member's yes also
 * covers their reminders, so an alert going off never withdraws it. Supabase is
 * stubbed at the network, as in messages.spec.ts.
 */
const USER = '**/auth/v1/user*';
const PROFILES = '**/rest/v1/profiles*';
const POINTS = '**/rest/v1/rpc/member_points*';
const CONTROLS = '**/rest/v1/access_controls*';
const NOTIFICATIONS = '**/rest/v1/notifications*';
const PREFS = '**/rest/v1/notification_preferences*';
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';

const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedInAs(page: import('@playwright/test').Page, role: 'provider' | 'admin' | 'member', prefs: Record<string, unknown> | null) {
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
  const writes: Record<string, unknown>[] = [];
  await page.route(PREFS, async (route) => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill(json(prefs));
    writes.push(JSON.parse(request.postData() ?? '{}'));
    return route.fulfill({ status: 201, body: '' });
  });
  return writes;
}

test.describe('Text alerts, held until the day (D-478)', () => {
  test.skip(ALERT_TEXTS_LIVE, 'the alerts are live: the held-state checks do not apply');

  test('while held, each of the four switches says "Coming soon", cannot be turned on, and writes nothing', async ({ page }) => {
    const writes = await signedInAs(page, 'provider', null);
    await page.goto('/alerts/');
    await settled(page);
    for (const name of ['Someone books a visit', 'Someone changes a booking', 'Someone messages you']) {
      const toggle = page.getByRole('switch', { name });
      await expect(toggle).not.toBeChecked();
      await expect(toggle).toBeDisabled();
    }
    await expect(page.getByText('Coming soon. Pam does not send this text yet.')).toHaveCount(3);
    expect(writes).toHaveLength(0);
  });

  test('...even for a case manager and a member', async ({ page }) => {
    const writes = await signedInAs(page, 'admin', null);
    await page.goto('/alerts/');
    await settled(page);
    await expect(page.getByRole('switch', { name: 'Someone plans a trip' })).toBeDisabled();
    await expect(page.getByRole('switch', { name: 'Someone messages you' })).toBeDisabled();
    expect(writes).toHaveLength(0);
  });
});

test.describe('Text alerts', () => {
  test.skip(!ALERT_TEXTS_LIVE, 'held until the day: ALERT_TEXTS_LIVE is false (apps/web/src/lib/alertTextsLive.ts)');

  test('a program turns on "someone books a visit": that switch, and the yes to texts', async ({ page }) => {
    const writes = await signedInAs(page, 'provider', null);
    await page.goto('/alerts/');
    await settled(page);

    const booked = page.getByRole('switch', { name: 'Someone books a visit' });
    await expect(booked).not.toBeChecked();
    await expect(page.getByRole('switch', { name: 'Someone changes a booking' })).not.toBeChecked();
    await booked.click();
    await expect(booked).toBeChecked();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({ member_id: ME, alert_booked: true, sms_enabled: true });
    // The other switches are untouched: each is its own yes.
    expect(writes[0]).not.toHaveProperty('alert_changed');
    await expect(page.getByRole('switch', { name: 'Someone changes a booking' })).not.toBeChecked();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('turning the last one off withdraws the yes to texts, for a program', async ({ page }) => {
    const writes = await signedInAs(page, 'provider', { sms_enabled: true, sms_stopped_at: null, alert_booked: true, alert_message: false, alert_changed: false, alert_trip: false });
    await page.goto('/alerts/');
    await settled(page);
    const booked = page.getByRole('switch', { name: 'Someone books a visit' });
    await expect(booked).toBeChecked();
    await booked.click();
    await expect(booked).not.toBeChecked();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({ alert_booked: false, sms_enabled: false });
  });

  test('turning one off while another is on leaves the yes alone', async ({ page }) => {
    const writes = await signedInAs(page, 'provider', { sms_enabled: true, sms_stopped_at: null, alert_booked: true, alert_message: true, alert_changed: false, alert_trip: false });
    await page.goto('/alerts/');
    await settled(page);
    await page.getByRole('switch', { name: 'Someone books a visit' }).click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({ alert_booked: false });
    expect(writes[0]).not.toHaveProperty('sms_enabled');
  });

  test('a member turning their message alert off keeps the yes their reminders rely on', async ({ page }) => {
    const writes = await signedInAs(page, 'member', { sms_enabled: true, sms_stopped_at: null, alert_message: true, alert_booked: false, alert_changed: false, alert_trip: false });
    await page.goto('/alerts/');
    await settled(page);
    const message = page.getByRole('switch', { name: 'Someone messages you' });
    await expect(message).toBeChecked();
    await message.click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({ alert_message: false });
    expect(writes[0]).not.toHaveProperty('sms_enabled');
  });

  test('after a STOP every switch is off and cannot be turned on', async ({ page }) => {
    const writes = await signedInAs(page, 'provider', { sms_enabled: true, sms_stopped_at: '2026-10-08T15:00:00Z', alert_booked: true, alert_message: true, alert_changed: true, alert_trip: false });
    await page.goto('/alerts/');
    await settled(page);
    for (const name of ['Someone books a visit', 'Someone changes a booking', 'Someone messages you']) {
      const toggle = page.getByRole('switch', { name });
      await expect(toggle).not.toBeChecked();
      await expect(toggle).toBeDisabled();
    }
    expect(writes).toHaveLength(0);
  });

  test('a kind with no text yet still says so', async ({ page }) => {
    await signedInAs(page, 'member', null);
    await page.goto('/alerts/');
    await settled(page);
    await expect(page.getByRole('switch', { name: 'Someone wants to connect' })).toBeDisabled();
    await expect(page.getByText('Coming soon. Pam does not send this text yet.').first()).toBeVisible();
  });
});
