import { test, expect, type Page } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';

/**
 * A program's page, for the Pam team (card a100, D-605; Piper, 16:41). While Message Pam is on, the super admin's message
 * row is "Message this program": Pam writes to each of the program's active leads. With it off, the row is D-349's as it
 * was ("Message {lead}", to coordinate with the lead). Supabase is stubbed.
 */
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const PLACE = 'dummy-place-learning';

async function pamSwitch(page: Page, live: boolean) {
  await page.addInitScript(() => window.sessionStorage.setItem('pam.examples', '1'));
  await page.route('**/rest/v1/rpc/pam_status*', (route) =>
    route.fulfill(json([{ live, hours_tz: 'America/New_York', hours_days: [1, 2, 3, 4, 5], hours_open: '09:00:00', hours_close: '17:00:00', open_now: true, next_open: null }])),
  );
}

test.describe("A program's page, for the Pam team (card a100)", () => {
  test('with Message Pam on, the row is "Message this program" and opens Pam writing to it', async ({ page }) => {
    await asMember(page, 'super_admin');
    await pamSwitch(page, true);
    await page.goto(`/place/?id=${PLACE}`);
    await settled(page);
    const row = page.getByRole('link', { name: /^Message this program/ });
    await expect(row).toHaveAttribute('href', new RegExp(`^/pam/start/\\?service=${PLACE}&name=`));
    await expect(page.getByRole('link', { name: /^Message (?!this program)/ })).toHaveCount(0);
  });

  test("with Message Pam off, the row stays D-349's: the lead by name, in an ordinary conversation", async ({ page }) => {
    await asMember(page, 'super_admin');
    await pamSwitch(page, false);
    await page.goto(`/place/?id=${PLACE}`);
    await settled(page);
    await expect(page.getByRole('link', { name: /^Message this program/ })).toHaveCount(0);
    const row = page.getByRole('link', { name: /^Message \S+/ }).first();
    await expect(row).toHaveAttribute('href', /^\/messages\/thread\/\?id=/);
  });

  test('a member never sees it, whatever the switch says', async ({ page }) => {
    await asMember(page);
    await pamSwitch(page, true);
    await page.goto(`/place/?id=${PLACE}`);
    await settled(page);
    await expect(page.getByRole('link', { name: /^Message this program/ })).toHaveCount(0);
  });
});
