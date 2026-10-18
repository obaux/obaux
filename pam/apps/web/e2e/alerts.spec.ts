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
const SETTINGS = '**/rest/v1/app_settings*';
const PREFS = '**/rest/v1/notification_preferences*';
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';

const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedInAs(page: import('@playwright/test').Page, role: 'provider' | 'admin' | 'member', prefs: Record<string, unknown> | null, textsLive = ALERT_TEXTS_LIVE ? 'on' : 'off') {
  await page.route(SETTINGS, (route) => route.fulfill(json({ value: textsLive })));
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
  await page.route(USER, (route) => route.fulfill(json({ id: ME, phone: '12155550191' })));
  await page.route(POINTS, (route) => route.fulfill(json(250)));
  await page.route(PROFILES, (route) =>
    route.fulfill(
      json({ id: ME, role, first_name: 'Will', access_status: 'active', region_id: '0195b1c0-0000-4000-8000-000000000001', regions: { name: 'Philadelphia' } }),
    ),
  );
  const writes: Record<string, unknown>[] = [];
  let current: Record<string, unknown> | null = prefs;
  await page.route(PREFS, async (route) => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill(json(current));
    const body = JSON.parse(request.postData() ?? '{}');
    writes.push(body);
    // What was written is what the next read says, as the database would.
    current = { sms_stopped_at: null, alert_message: false, alert_booked: false, alert_changed: false, alert_trip: false, ...(current ?? {}), ...body };
    return route.fulfill({ status: 201, body: '' });
  });
  return writes;
}

test.describe('Text alerts say little (D-608, Will 18 October: "we don\'t need an introduction paragraph")', () => {
  test('a label over the list, rows that are their names, and "Coming soon" as the switch\'s description', async ({ page }) => {
    await signedInAs(page, 'member', null, 'off');
    await page.goto('/alerts/');
    await settled(page);
    // No introduction, no second line under a row, no sentence about what Pam does not send yet.
    await expect(page.getByText('Choose what Pam texts you about')).toHaveCount(0);
    await expect(page.getByText('So you do not go to the wrong door.')).toHaveCount(0);
    await expect(page.getByText('Only that a message is waiting')).toHaveCount(0);
    await expect(page.getByText('Pam does not send this text yet')).toHaveCount(0);
    // The badge is the switch's description: a screen reader hears "{row}, switch, off, Coming soon".
    const toggle = page.getByRole('switch', { name: 'Someone messages you' });
    await expect(toggle).toHaveAccessibleDescription('Coming soon');
  });

  // Sage signed the line (f0279243) and alerts.kinds carries it; this pins the whole sentence so a reworded value shows up here.
  test('the line over the list is the one Will asked for', async ({ page }) => {
    await signedInAs(page, 'member', null, 'off');
    await page.goto('/alerts/');
    await settled(page);
    await expect(page.getByText(/^Please choose when you.d like to get a text\.$/)).toBeVisible();
  });

  async function openAlerts(page: import('@playwright/test').Page) {
    await signedInAs(page, 'member', null, 'off');
    await page.goto('/alerts/');
    await settled(page);
    await expect(page.getByRole('switch', { name: 'Someone messages you' })).toBeVisible();
  }

  test('no card around the list: each kind is its own row, divided by a thin line (D-615, Will, 18 October)', async ({ page }) => {
    await openAlerts(page);
    await expect(page.locator('.astryx-card')).toHaveCount(0);
    const kinds = await page.getByRole('switch').count();
    await expect(page.getByRole('separator')).toHaveCount(kinds - 1);
  });

  test('no instructions repeated: the STOP, HELP and rates line was seen when texts were agreed to', async ({ page }) => {
    await openAlerts(page);
    await expect(page.getByText(/Reply STOP/)).toHaveCount(0);
    await expect(page.getByText(/data rates/i)).toHaveCount(0);
  });

  test('no Privacy link on the task: it is in Profile', async ({ page }) => {
    await openAlerts(page);
    await expect(page.getByRole('main').getByRole('link', { name: /Privacy/ })).toHaveCount(0);
  });

  test('"Coming soon" rows go to the bottom: what is on comes first (Will, 18 October)', async ({ page }) => {
    await signedInAs(page, 'member', null, 'on');
    await page.goto('/alerts/');
    await settled(page);
    const names = await page.getByRole('switch').evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? el.closest('label')?.textContent ?? ''));
    const live = page.getByRole('switch', { name: 'A saved place closes or moves' });
    const soon = page.getByRole('switch', { name: 'Someone messages you' });
    const liveY = (await live.boundingBox())!.y;
    const soonY = (await soon.boundingBox())!.y;
    expect(names.length).toBe(4);
    expect(liveY).toBeLessThan(soonY);
    // And every badged row sits below every row without one.
    const badges = await page.locator('.astryx-badge').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().y));
    expect(Math.min(...badges)).toBeGreaterThan(liveY);
  });

  test('an (i) beside a name does not make its line taller: every row has the same name-to-badge gap and switch place', async ({ page }) => {
    // A case manager's second row, "Someone plans a trip", carries the glossary's (i), a 48px target.
    await signedInAs(page, 'admin', null, 'off');
    await page.goto('/alerts/');
    await settled(page);
    const measure = async (name: string) => {
      const toggle = page.getByRole('switch', { name });
      // The nearest ancestor holding both this switch and a badge is this row (a row has one of each).
      const row = toggle.locator('xpath=ancestor::*[.//*[contains(@class,"astryx-badge")]][1]');
      const label = row.getByText(name, { exact: true }).first();
      const badge = row.locator('.astryx-badge').first();
      const [l, b, w, r] = await Promise.all([label.boundingBox(), badge.boundingBox(), toggle.boundingBox(), row.boundingBox()]);
      return { gap: b!.y - l!.y, switchFromTop: w!.y + w!.height / 2 - r!.y };
    };
    const plain = await measure('Someone messages you');
    const withInfo = await measure('Someone plans a trip');
    expect(Math.abs(withInfo.gap - plain.gap)).toBeLessThanOrEqual(1);
    // The rows are the same height, so the switch is level with the name in both.
    expect(Math.abs(withInfo.switchFromTop - plain.switchFromTop)).toBeLessThanOrEqual(1);
  });

  test('the badge sits under the name, not beside it', async ({ page }) => {
    await signedInAs(page, 'member', null, 'off');
    await page.goto('/alerts/');
    await settled(page);
    const name = page.getByText('Someone messages you', { exact: true }).first();
    const row = name.locator('xpath=ancestor::*[.//*[@role="switch"]][1]');
    const badge = row.locator('.astryx-badge').first();
    const n = (await name.boundingBox())!;
    const b = (await badge.boundingBox())!;
    expect(b.y).toBeGreaterThanOrEqual(n.y + n.height - 1);
    // Starts where the name starts.
    expect(Math.abs(b.x - n.x)).toBeLessThan(2);
  });
});

test.describe('The agree screen is the only opt-in (D-615, Lena, 18 October)', () => {
  const CLOSED = 'A saved place closes or moves';

  test('no yes on file: the switch records nothing and opens the agree screen; "Agree" brings the person back with it on', async ({ page }) => {
    const writes = await signedInAs(page, 'member', null, 'on');
    await page.goto('/alerts/');
    await settled(page);
    await page.getByRole('switch', { name: CLOSED }).click();
    await expect(page).toHaveURL(/\/reminders\/\?next=alerts&kind=closed/);
    expect(writes).toHaveLength(0);
    await page.getByRole('button', { name: 'Agree to receive texts' }).click();
    await expect(page).toHaveURL(/\/alerts\/$/);
    await settled(page);
    await expect(page.getByRole('switch', { name: CLOSED })).toBeChecked();
    expect(writes[0]).toMatchObject({ member_id: ME, sms_enabled: true });
  });

  test('"Not now" brings the person back with the switch off', async ({ page }) => {
    const writes = await signedInAs(page, 'member', null, 'on');
    await page.goto('/alerts/');
    await settled(page);
    await page.getByRole('switch', { name: CLOSED }).click();
    await expect(page).toHaveURL(/\/reminders\//);
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(page).toHaveURL(/\/alerts\/$/);
    await settled(page);
    await expect(page.getByRole('switch', { name: CLOSED })).not.toBeChecked();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ sms_enabled: false });
  });

  test('a yes that was withdrawn counts as no yes: the same route', async ({ page }) => {
    const writes = await signedInAs(page, 'member', { sms_enabled: false, sms_stopped_at: null, alert_message: false, alert_booked: false, alert_changed: false, alert_trip: false }, 'on');
    await page.goto('/alerts/');
    await settled(page);
    await page.getByRole('switch', { name: CLOSED }).click();
    await expect(page).toHaveURL(/\/reminders\/\?next=alerts&kind=closed/);
    expect(writes).toHaveLength(0);
  });

  test('a yes on file: the saved-place switch shows on, and turning it off withdraws the yes right here, as before', async ({ page }) => {
    const writes = await signedInAs(page, 'member', { sms_enabled: true, sms_stopped_at: null, alert_message: false, alert_booked: false, alert_changed: false, alert_trip: false }, 'on');
    await page.goto('/alerts/');
    await settled(page);
    const toggle = page.getByRole('switch', { name: CLOSED });
    await expect(toggle).toBeChecked();
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    await expect(page).toHaveURL(/\/alerts\/$/);
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({ sms_enabled: false });
  });

  test('after a STOP the switches stay off and cannot be turned on from here', async ({ page }) => {
    const writes = await signedInAs(page, 'member', { sms_enabled: true, sms_stopped_at: '2026-10-08T15:00:00Z', alert_message: true, alert_booked: false, alert_changed: false, alert_trip: false }, 'on');
    await page.goto('/alerts/');
    await settled(page);
    await expect(page.getByRole('switch', { name: CLOSED })).toBeDisabled();
    await expect(page.getByRole('switch', { name: CLOSED })).not.toBeChecked();
    expect(writes).toHaveLength(0);
  });
});

test.describe('Text alerts: what Iris found in b74 (B3, B6)', () => {
  const CLOSED = 'A saved place closes or moves';
  const MALFUNCTION = "That didn't go through. It's not your fault, so try again.";
  const ON = { sms_enabled: true, sms_stopped_at: null, alert_message: false, alert_booked: false, alert_changed: false, alert_trip: false };

  test('B3 (D-616): when a write fails the switch stays put and the small alert is fixed at the bottom, clear of the switch', async ({ page }) => {
    await signedInAs(page, 'member', ON, 'on');
    // Reads work; every write is refused.
    await page.route(PREFS, (route) => (route.request().method() === 'GET' ? route.fulfill(json(ON)) : route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })));
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/alerts/');
    await settled(page);
    const toggle = page.getByRole('switch', { name: CLOSED });
    await expect(toggle).toBeChecked();
    await toggle.click();
    // The switch did not move (it moves only after a save), and the person is told in one small alert, not under the row.
    const alert = page.getByRole('alert').filter({ hasText: MALFUNCTION });
    await expect(alert).toBeVisible();
    // Said once: one alert with words in it (Next's own route announcer is an empty alert).
    await expect(alert).toHaveCount(1);
    await expect(toggle).toBeChecked();
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
    const box = (await alert.boundingBox())!;
    const row = (await toggle.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(568);
    // Fixed to the bottom: it sits in the lower part of the screen, and does not cover the switch that failed.
    expect(box.y).toBeGreaterThan(568 / 2);
    expect(box.y >= row.y + row.height || box.y + box.height <= row.y).toBe(true);
    // A screen you tap into has no tab bar; where there is one, the alert sits above it.
    const bar = (await page.locator('[data-pam-tabbar]').count()) ? await page.locator('[data-pam-tabbar]').boundingBox() : null;
    if (bar) expect(box.y + box.height).toBeLessThanOrEqual(bar.y + 1);
  });

  test('D-616: the switch shows it is saving and moves only when the save succeeds', async ({ page }) => {
    await signedInAs(page, 'member', ON, 'on');
    let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => (release = resolve));
    let current: Record<string, unknown> = ON;
    await page.route(PREFS, async (route) => {
      if (route.request().method() === 'GET') return route.fulfill(json(current));
      await held;
      current = { ...current, ...JSON.parse(route.request().postData() ?? '{}') };
      return route.fulfill({ status: 201, body: '' });
    });
    await page.goto('/alerts/');
    await settled(page);
    const toggle = page.getByRole('switch', { name: CLOSED });
    await expect(toggle).toBeChecked();
    await toggle.click();
    // Saving: still where it was, and the alert is not up.
    await expect(toggle).toBeChecked();
    await expect(page.getByRole('alert').filter({ hasText: MALFUNCTION })).toHaveCount(0);
    release!();
    await expect(toggle).not.toBeChecked();
    await expect(page.getByRole('alert').filter({ hasText: MALFUNCTION })).toHaveCount(0);
  });

  test('A6 (D-616): no answer in 15 s is a failure; a save that lands late is read back and the switch follows it', async ({ page }) => {
    await page.clock.install();
    await signedInAs(page, 'member', ON, 'on');
    let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => (release = resolve));
    let current: Record<string, unknown> = ON;
    await page.route(PREFS, async (route) => {
      if (route.request().method() === 'GET') return route.fulfill(json(current));
      await held;
      current = { ...current, ...JSON.parse(route.request().postData() ?? '{}') };
      return route.fulfill({ status: 201, body: '' });
    });
    await page.goto('/alerts/');
    await page.clock.runFor(500);
    await settled(page);
    const toggle = page.getByRole('switch', { name: CLOSED });
    await expect(toggle).toBeChecked();
    await toggle.click();
    await page.clock.runFor(15_500);
    await expect(page.getByRole('alert').filter({ hasText: MALFUNCTION })).toBeVisible();
    await expect(toggle).toBeChecked();
    // It lands at 45 s: the screen reads the saved value back.
    await page.clock.runFor(29_000);
    release!();
    await page.clock.runFor(1_000);
    await expect(toggle).not.toBeChecked();
  });

  test('D-616: the alert stays until the next tap, and leaving the screen clears it', async ({ page }) => {
    await signedInAs(page, 'member', ON, 'on');
    await page.route(PREFS, (route) => (route.request().method() === 'GET' ? route.fulfill(json(ON)) : route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })));
    await page.goto('/alerts/');
    await settled(page);
    const alert = page.getByRole('alert').filter({ hasText: MALFUNCTION });
    await page.getByRole('switch', { name: CLOSED }).click();
    await expect(alert).toBeVisible();
    // No timer: still there a while later.
    await page.waitForTimeout(3_000);
    await expect(alert).toBeVisible();
    // The next tap (anywhere) takes it away.
    await page.getByRole('heading').first().click();
    await expect(alert).toHaveCount(0);
    await page.getByRole('switch', { name: CLOSED }).click();
    await expect(alert).toBeVisible();
    await page.getByRole('link', { name: /back/i }).first().click();
    await expect(alert).toHaveCount(0);
  });

  test('B6: a tap on the row\'s name works the switch (the name is its label: one control)', async ({ page }) => {
    const writes = await signedInAs(page, 'member', ON, 'on');
    await page.goto('/alerts/');
    await settled(page);
    const toggle = page.getByRole('switch', { name: CLOSED });
    await expect(toggle).toBeChecked();
    await page.getByText(CLOSED, { exact: true }).first().click();
    await expect(toggle).not.toBeChecked();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({ sms_enabled: false });
    // Still one control for a screen reader: the switch, named once.
    await expect(page.getByRole('switch', { name: CLOSED })).toHaveCount(1);
  });
});

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
    await expect(page.getByText('Coming soon', { exact: true })).toHaveCount(3);
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

test.describe('The closed-place text follows the server\'s texts_live switch (D-481)', () => {
  test('while texts_live is off, the switch says "Coming soon" and writes nothing', async ({ page }) => {
    const writes = await signedInAs(page, 'member', null, 'off');
    await page.goto('/alerts/');
    await settled(page);
    await expect(page.getByRole('switch', { name: 'A saved place closes or moves' })).toBeDisabled();
    await expect(page.getByText('Coming soon').first()).toBeVisible();
    expect(writes).toHaveLength(0);
  });

  test('once texts_live is on, it works, with no deploy', async ({ page }) => {
    await signedInAs(page, 'member', null, 'on');
    await page.goto('/alerts/');
    await settled(page);
    await expect(page.getByRole('switch', { name: 'A saved place closes or moves' })).toBeEnabled();
  });
});

test.describe('Text alerts', () => {
  test.skip(!ALERT_TEXTS_LIVE, 'held until the day: ALERT_TEXTS_LIVE is false (apps/web/src/lib/alertTextsLive.ts)');

  test('a program with the yes on file turns on "someone books a visit": that switch alone', async ({ page }) => {
    const writes = await signedInAs(page, 'provider', { sms_enabled: true, sms_stopped_at: null, alert_booked: false, alert_message: false, alert_changed: false, alert_trip: false });
    await page.goto('/alerts/');
    await settled(page);

    const booked = page.getByRole('switch', { name: 'Someone books a visit' });
    await expect(booked).not.toBeChecked();
    await expect(page.getByRole('switch', { name: 'Someone changes a booking' })).not.toBeChecked();
    await booked.click();
    await expect(booked).toBeChecked();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({ member_id: ME, alert_booked: true });
    // The other switches are untouched: each is its own yes.
    expect(writes[0]).not.toHaveProperty('alert_changed');
    await expect(page.getByRole('switch', { name: 'Someone changes a booking' })).not.toBeChecked();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('turning the last one off keeps the yes to texts, for a program (Nico 21b053e9: only STOP ends it)', async ({ page }) => {
    const writes = await signedInAs(page, 'provider', { sms_enabled: true, sms_stopped_at: null, alert_booked: true, alert_message: false, alert_changed: false, alert_trip: false });
    await page.goto('/alerts/');
    await settled(page);
    const booked = page.getByRole('switch', { name: 'Someone books a visit' });
    await expect(booked).toBeChecked();
    await booked.click();
    await expect(booked).not.toBeChecked();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({ alert_booked: false });
    // The yes is not withdrawn by the last switch going off: only a STOP ends it.
    expect(writes[0]).not.toHaveProperty('sms_enabled');
  });

  test('a lead turns the last alert off and one back on in the same visit: no agree screen, the yes follows the database (Iris, b74)', async ({ page }) => {
    const writes = await signedInAs(page, 'provider', { sms_enabled: true, sms_stopped_at: null, alert_booked: true, alert_message: false, alert_changed: false, alert_trip: false });
    await page.goto('/alerts/');
    await settled(page);
    const booked = page.getByRole('switch', { name: 'Someone books a visit' });
    await booked.click();
    await expect(booked).not.toBeChecked();
    await expect.poll(() => writes.length).toBe(1);
    // The yes to texts is kept (Nico, 21b053e9), so this is not a first yes: the switch just turns on.
    await page.getByRole('switch', { name: 'Someone messages you' }).click();
    await expect(page).toHaveURL(/\/alerts\/$/);
    await expect(page.getByRole('switch', { name: 'Someone messages you' })).toBeChecked();
    await expect.poll(() => writes.length).toBe(2);
    expect(writes[1]).toMatchObject({ alert_message: true });
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
    await expect(page.getByText('Coming soon').first()).toBeVisible();
  });
});
