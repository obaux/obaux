import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * The Pam team's saves on Dot's rule (D-616, Will, 21:14: "if something breaks, please create an error log so the team can be
 * notified and fix the issue"; Dot's D-617: "the switch shouldn't turn on if the connection is not established"). A switch moves
 * only once its save has succeeded; a save that fails, or has not answered in 15 s, says so in the one small alert at the bottom
 * and is logged with its action key and a code, nothing else. A reason the person can act on stays by the control. Supabase is
 * stubbed.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const ASKER = 'a0000000-0000-4000-8000-0000000000c1';
const PAM_C = 'c0c0c0c0-0000-4000-8000-00000000a002';
const MALFUNCTION = /Something's wrong on our side|That took too long|Still not working|This account can't do that|You're signed out/;
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const refused = { status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'boom' }) };

/** A super admin, Pam live, two people in the directory; returns what was written to the error log. */
async function superAdmin(page: Page) {
  const reports: Record<string, unknown>[] = [];
  await page.addInitScript((userId: string) => {
    const session = { access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: userId, aud: 'authenticated', role: 'authenticated' } };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, ME);
  await page.route('**/rest/v1/**', (route) => route.fulfill(json([])));
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: ME, role: 'super_admin', first_name: 'Will', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
  );
  await page.route('**/rest/v1/rpc/pam_status*', (route) =>
    route.fulfill(json([{ live: true, hours_tz: 'America/New_York', hours_days: [1, 2, 3, 4, 5], hours_open: '09:00:00', hours_close: '17:00:00', open_now: true, next_open: null }])),
  );
  await page.route('**/rest/v1/rpc/report_app_error*', (route) => {
    reports.push(route.request().postDataJSON() as Record<string, unknown>);
    return route.fulfill(json(null));
  });
  return reports;
}

const malfunction = (page: Page) => page.getByRole('alert').filter({ hasText: MALFUNCTION });

test.describe('Demo view in Everyone (D-616)', () => {
  /** Marcus, demo view off. `answer` answers set_demo_view; the directory reads back whatever was last saved. */
  async function directory(page: Page, answer: (route: import('@playwright/test').Route, save: () => void) => Promise<void> | void) {
    const reports = await superAdmin(page);
    let isDemo = false;
    await page.route('**/rest/v1/rpc/directory_people*', (route) =>
      route.fulfill(json([{ id: 'p1', first_name: 'Marcus', role: 'member', region_name: 'Philadelphia', access_status: 'active', last_active_at: null, is_demo: isDemo }])),
    );
    await page.route('**/rest/v1/rpc/set_demo_view*', (route) => answer(route, () => (isDemo = true)));
    return reports;
  }

  test('the switch says it is saving, and moves only when the save succeeds', async ({ page }) => {
    let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => (release = resolve));
    await directory(page, async (route, save) => {
      await held;
      save();
      await route.fulfill(json(null));
    });
    await page.goto('/directory/');
    await settled(page);
    const toggle = page.getByRole('switch', { name: 'Demo view for Marcus' });
    await expect(toggle).not.toBeChecked();
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    release!();
    await expect(toggle).toBeChecked();
    await expect(malfunction(page)).toHaveCount(0);
  });

  test('a failed save leaves it where it was, says so at the bottom, and logs the action and code only', async ({ page }) => {
    const reports = await directory(page, (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: '42501', message: 'nope' }) }));
    await page.goto('/directory/');
    await settled(page);
    const toggle = page.getByRole('switch', { name: 'Demo view for Marcus' });
    await toggle.click();
    await expect(malfunction(page)).toBeVisible();
    await expect(toggle).not.toBeChecked();
    await expect.poll(() => reports.length).toBe(1);
    expect(reports[0]).toMatchObject({ p_action: 'directory.demo-view', p_code: '42501' });
    // Nothing of the person in the log: no id, no name.
    expect(JSON.stringify(reports[0])).not.toMatch(/p1|Marcus/);
  });

  test('no answer in 15 s is a failure; a save that lands late is read back and the switch follows it', async ({ page }) => {
    await page.clock.install();
    let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => (release = resolve));
    const reports = await directory(page, async (route, save) => {
      await held;
      save();
      await route.fulfill(json(null));
    });
    await page.goto('/directory/');
    await page.clock.runFor(500);
    await settled(page);
    const toggle = page.getByRole('switch', { name: 'Demo view for Marcus' });
    await toggle.click();
    await page.clock.runFor(15_500);
    await expect(malfunction(page)).toBeVisible();
    await expect(toggle).not.toBeChecked();
    await expect.poll(() => reports.length).toBe(1);
    expect(reports[0]).toMatchObject({ p_action: 'directory.demo-view', p_code: 'timeout' });
    release!();
    await page.clock.runFor(1_000);
    await expect(toggle).toBeChecked();
  });
});

test.describe("Pam's hours, Close and Reopen (D-616)", () => {
  test("Pam's hours: a failed Save says so at the bottom, not by the button, and is logged", async ({ page }) => {
    const reports = await superAdmin(page);
    await page.route('**/rest/v1/rpc/pam_set_hours*', (route) => route.fulfill(refused));
    await page.goto('/pam/hours/');
    await settled(page);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(malfunction(page)).toBeVisible();
    await expect(page.getByText("That didn't go through. Try again.")).toHaveCount(0);
    await expect(page.getByRole('status').filter({ hasText: 'Saved.' })).toHaveCount(0);
    await expect.poll(() => reports.length).toBe(1);
    expect(reports[0]).toMatchObject({ p_action: 'pam.hours.save' });
  });

  test("Pam's hours: what to fix in the fields stays by Save, with no alert and nothing logged", async ({ page }) => {
    const reports = await superAdmin(page);
    await page.goto('/pam/hours/');
    await settled(page);
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) await page.getByRole('checkbox', { name: day }).uncheck();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('alert').filter({ hasText: /day/i })).toBeVisible();
    await expect(malfunction(page)).toHaveCount(0);
    expect(reports).toHaveLength(0);
  });

  test('Close conversation that fails says so at the bottom, keeps the row as it was, and is logged', async ({ page }) => {
    const reports = await superAdmin(page);
    await page.route('**/rest/v1/rpc/pam_inbox*', (route) =>
      route.fulfill(json([{ conversation_id: PAM_C, asker_id: ASKER, first_name: 'Aaliyah', role: 'member', region_name: 'Philadelphia', program_name: null, status: 'open', last_message_at: new Date().toISOString(), last_from: 'asker', waiting_since: new Date().toISOString(), preview: 'Hi' }])),
    );
    await page.route('**/rest/v1/rpc/pam_set_thread_status*', (route) => route.fulfill(refused));
    await page.goto(`/pam/thread/options/?id=${PAM_C}`);
    await settled(page);
    await page.getByRole('button', { name: 'Close conversation' }).click();
    await expect(malfunction(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close conversation' })).toBeVisible();
    await expect(page.getByText("That didn't go through. Try again.")).toHaveCount(0);
    await expect.poll(() => reports.length).toBe(1);
    expect(reports[0]).toMatchObject({ p_action: 'pam.thread.status' });
  });
});

test.describe("The codes that reach the log, and Close/Reopen's busy cue (Iris's b77 re-test: L5, L6, L9)", () => {
  const PAM_ROW = [{ conversation_id: PAM_C, asker_id: ASKER, first_name: 'Aaliyah', role: 'member', region_name: 'Philadelphia', program_name: null, status: 'open', last_message_at: new Date().toISOString(), last_from: 'asker', waiting_since: new Date().toISOString(), preview: 'Hi' }];
  const bare500 = { status: 500, contentType: 'application/json', body: '{}' };
  const internal = { status: 500, contentType: 'application/json', body: JSON.stringify({ code: 'XX000', message: 'internal' }) };

  test('L5: a 500 with no database code on Demo view is logged as 500, not unknown', async ({ page }) => {
    const reports = await superAdmin(page);
    await page.route('**/rest/v1/rpc/directory_people*', (route) =>
      route.fulfill(json([{ id: 'p1', first_name: 'Marcus', role: 'member', region_name: 'Philadelphia', access_status: 'active', last_active_at: null, is_demo: false }])),
    );
    await page.route('**/rest/v1/rpc/set_demo_view*', (route) => route.fulfill(bare500));
    await page.goto('/directory/');
    await settled(page);
    await page.getByRole('switch', { name: 'Demo view for Marcus' }).click();
    await expect(malfunction(page)).toBeVisible();
    await expect.poll(() => reports.length).toBe(1);
    expect(reports[0]).toMatchObject({ p_action: 'directory.demo-view', p_code: '500' });
  });

  test("L6: Pam's hours keeps the database's own code (XX000) for the log", async ({ page }) => {
    const reports = await superAdmin(page);
    await page.route('**/rest/v1/rpc/pam_set_hours*', (route) => route.fulfill(internal));
    await page.goto('/pam/hours/');
    await settled(page);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(malfunction(page)).toBeVisible();
    await expect.poll(() => reports.length).toBe(1);
    expect(reports[0]).toMatchObject({ p_action: 'pam.hours.save', p_code: 'XX000' });
  });

  test('L5, L6: Close conversation keeps its code: XX000 when the database says one, 500 when it says none', async ({ page }) => {
    const reports = await superAdmin(page);
    await page.route('**/rest/v1/rpc/pam_inbox*', (route) => route.fulfill(json(PAM_ROW)));
    let answers = 0;
    await page.route('**/rest/v1/rpc/pam_set_thread_status*', (route) => route.fulfill(++answers === 1 ? internal : bare500));
    await page.goto(`/pam/thread/options/?id=${PAM_C}`);
    await settled(page);
    await page.getByRole('button', { name: 'Close conversation' }).click();
    await expect.poll(() => reports.length).toBe(1);
    await page.getByRole('button', { name: 'Close conversation' }).click();
    await expect.poll(() => reports.length).toBe(2);
    expect(reports.map((r) => r['p_code'])).toEqual(['XX000', '500']);
  });

  test('L9: Close conversation says it is saving while it saves, and stops when it is done', async ({ page }) => {
    await superAdmin(page);
    let status = 'open';
    await page.route('**/rest/v1/rpc/pam_inbox*', (route) => route.fulfill(json([{ ...PAM_ROW[0], status }])));
    let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/rest/v1/rpc/pam_set_thread_status*', async (route) => {
      await held;
      status = 'closed';
      await route.fulfill(json(null));
    });
    await page.goto(`/pam/thread/options/?id=${PAM_C}`);
    await settled(page);
    await page.getByRole('button', { name: 'Close conversation' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Saving...' })).toBeVisible();
    release!();
    await expect(page.getByRole('status').filter({ hasText: 'Closed.' })).toBeVisible();
    await expect(page.getByText('Saving...')).toHaveCount(0);
  });
});
