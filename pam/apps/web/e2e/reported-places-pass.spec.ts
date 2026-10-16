import { expect, test } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';

/**
 * Iris's super admin pass (15 October 2026): W4 (Reported places on Home with a count, the reason and what was written
 * at reading size, what each choice does) and W1 for places (taking a place off the list asks first, and a decision says
 * what was done). Supabase is stubbed.
 */
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const flagged = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `s${i}`, name: `Corner Pantry ${i}`, lookup_name: `CORNER PANTRY ${i}`, category: 'food', address: '1 Main St', phone: null, place_id: null,
    lat: 39.95, lon: -75.16, has_hours: false, description_plain: 'Food.', website: null, audience: null, hours: null,
    flag_id: `f${i}`, reason: 'wrong_info', note: i === 0 ? 'The phone number is the old one' : null, flag_count: 1, flagged_at: '2026-10-14T10:00:00Z',
  }));

async function asSuper(page: import('@playwright/test').Page, n: number) {
  await asMember(page, 'super_admin');
  await page.route('**/rest/v1/rpc/flagged_services*', (route) => route.fulfill(json(flagged(n))));
  await page.route('**/rest/v1/staff_requests*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/program_submissions*', (route) => route.fulfill(json([])));
}

test('Home has a Reported places row with how many are waiting (W4)', async ({ page }) => {
  await asSuper(page, 2);
  await page.goto('/');
  await settled(page);
  const row = page.getByRole('link', { name: /Reported places/ });
  await expect(row).toBeVisible();
  // The count rides in the same row as a plain number (D-586), not a badge: the red badge is for what is new.
  const item = page.getByRole('listitem').filter({ hasText: 'Reported places' });
  await expect(item).toContainText('2');
  await expect(item.getByText('2', { exact: true })).toBeVisible();
  await expect(item.locator('[class*="badge" i], [data-variant="error"]')).toHaveCount(0);
  await row.click();
  await expect(page).toHaveURL(/\/places\/reported\//);
});

test('a report shows what was reported and what they wrote at reading size, and what each choice does (W4)', async ({ page }) => {
  await asSuper(page, 1);
  await page.goto('/places/reported/');
  await settled(page);
  const reason = page.getByText('Something here is wrong, like the address or the phone');
  await expect(reason).toBeVisible();
  expect(await reason.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
  await expect(page.getByText('The phone number is the old one')).toBeVisible();
  await expect(page.getByText('They wrote:')).toBeVisible();
  await expect(page.getByText('The place goes back on the list for members.')).toBeVisible();
  // The same signed words are the confirm's body, in a closed dialog: only the line on the card is on screen.
  await expect(page.getByText("Members won't find it in Pam anymore.").filter({ visible: true })).toBeVisible();
});

test('taking a place off the list asks first, and says what was done (W1)', async ({ page }) => {
  await asSuper(page, 2);
  const asked: unknown[] = [];
  await page.route('**/rest/v1/rpc/resolve_service_flag*', (route) => {
    asked.push(route.request().postDataJSON());
    return route.fulfill(json(null));
  });
  await page.goto('/places/reported/');
  await settled(page);
  await page.getByRole('button', { name: 'Take it off the list' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Take Corner Pantry 0 off the list?');
  // Cancel sends nothing.
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(asked).toHaveLength(0);
  // Confirm sends it, once.
  await page.getByRole('button', { name: 'Take it off the list' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Take it off the list' }).click();
  await expect.poll(() => asked.length).toBe(1);
  expect(asked[0]).toMatchObject({ p_action: 'remove' });
  await expect(page.getByText('Corner Pantry 0 is off the list.')).toBeVisible();
});

test('keeping a place says so, in one tap (W1)', async ({ page }) => {
  await asSuper(page, 1);
  await page.route('**/rest/v1/rpc/resolve_service_flag*', (route) => route.fulfill(json(null)));
  await page.goto('/places/reported/');
  await settled(page);
  await page.getByRole('button', { name: 'Keep it' }).click();
  await expect(page.getByText('Corner Pantry 0 stays on the list.')).toBeVisible();
});
