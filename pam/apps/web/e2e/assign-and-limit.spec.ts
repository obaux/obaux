import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * Assigning a guide, handing a member over, and limiting or pausing (D-446).
 *
 * Who may do each is the database's to refuse, and is proved there
 * (`packages/db/test/23_assign_and_limit_test.sql`). What a browser can prove
 * is the screen around it: that each one asks the database the right
 * question, that nothing happens before the person confirms, that a limit
 * cannot be saved without a reason, and that every screen is accessible.
 * Supabase is unreachable here, so the session and the calls are stubbed.
 */

const WILL = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

const PEOPLE = [
  { id: 'p1', first_name: 'Marcus', role: 'member', region_name: 'Philadelphia', access_status: 'active', last_active_at: null, is_demo: false },
  { id: 'p2', first_name: 'Tanya', role: 'member', region_name: 'Philadelphia', access_status: 'active', last_active_at: null, is_demo: false },
  { id: 'p3', first_name: 'Dana', role: 'admin', region_name: 'Philadelphia', access_status: 'active', last_active_at: null, is_demo: false },
];
const GUIDES = [{ member_id: 'p1', guide_id: 'p3', guide_first_name: 'Dana' }];
const CHOICES = [
  { id: 'p3', first_name: 'Dana', region_name: 'Philadelphia' },
  { id: 'p4', first_name: 'Chris', region_name: 'Philadelphia' },
];

type Call = { fn: string; body: Record<string, unknown> };

async function signedInAs(page: import('@playwright/test').Page, role: 'super_admin' | 'admin'): Promise<Call[]> {
  const calls: Call[] = [];
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
  }, WILL);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: WILL })));
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: WILL, role, first_name: 'Will', region_id: null, regions: null })),
  );
  await page.route('**/rest/v1/rpc/**', async (route) => {
    const fn = new URL(route.request().url()).pathname.split('/rpc/')[1] ?? '';
    const body = (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
    calls.push({ fn, body });
    if (fn === 'directory_people') {
      const p = body.p_role as string | null;
      return route.fulfill(json(p ? PEOPLE.filter((x) => x.role === p) : PEOPLE));
    }
    if (fn === 'directory_guides') return route.fulfill(json(GUIDES));
    if (fn === 'guides_i_can_choose') return route.fulfill(json(CHOICES));
    return route.fulfill(json(null));
  });
  return calls;
}

test.describe('the super admin chooses a member’s guide', () => {
  test('Everyone says who guides each member, and who has no guide', async ({ page }) => {
    await signedInAs(page, 'super_admin');
    await page.goto('/directory/');
    await expect(page.getByText('Guide: Dana')).toBeVisible();
    await expect(page.getByText('No guide', { exact: true })).toBeVisible();
  });

  test('"Members with no guide" asks for members and keeps only the unguided', async ({ page }) => {
    const calls = await signedInAs(page, 'super_admin');
    await page.goto('/directory/');
    await expect(page.getByRole('heading', { name: 'Marcus' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Show' }).click();
    await page.getByRole('option', { name: 'Members with no guide' }).click();
    await expect(page.getByRole('heading', { name: 'Tanya' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Marcus' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Dana' })).toHaveCount(0);
    expect(calls.some((c) => c.fn === 'directory_people' && c.body.p_role === 'member')).toBe(true);
  });

  test('choosing a guide asks first, then calls assign_guide with the member and the guide', async ({ page }) => {
    const calls = await signedInAs(page, 'super_admin');
    await page.goto('/directory/guide/?id=p2&name=Tanya&guide=');
    await expect(page.getByRole('heading', { name: "Tanya's guide" })).toBeVisible();
    const save = page.getByRole('button', { name: 'Save' });
    await expect(save).toBeDisabled();

    await page.getByRole('radio', { name: 'Chris' }).check();
    await save.click();
    const dialog = page.getByRole('dialog', { name: 'Make Chris Tanya\'s guide?' });
    await expect(dialog).toBeVisible();
    expect(calls.some((c) => c.fn === 'assign_guide'), 'nothing is written before the person confirms').toBe(false);

    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Chris is now Tanya\'s guide' })).toBeVisible();
    expect(calls.find((c) => c.fn === 'assign_guide')?.body).toEqual({ p_member: 'p2', p_guide: 'p4' });
  });

  test('"No guide" calls assign_guide with no guide', async ({ page }) => {
    const calls = await signedInAs(page, 'super_admin');
    await page.goto('/directory/guide/?id=p1&name=Marcus&guide=p3');
    await expect(page.getByRole('radio', { name: 'Dana' })).toBeChecked();
    await page.getByRole('radio', { name: 'No guide' }).check();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Marcus has no guide' })).toBeVisible();
    expect(calls.find((c) => c.fn === 'assign_guide')?.body).toEqual({ p_member: 'p1', p_guide: null });
  });

  test('a case manager meets a closed door on the guide screen', async ({ page }) => {
    await signedInAs(page, 'admin');
    await page.goto('/directory/guide/?id=p1&name=Marcus');
    await expect(page.getByRole('heading', { name: 'This screen is for the Pam team' }).first()).toBeVisible();
  });

  test('the guide screen has no accessibility violations', async ({ page }) => {
    await signedInAs(page, 'super_admin');
    await page.goto('/directory/guide/?id=p1&name=Marcus&guide=p3');
    await expect(page.getByRole('radio', { name: 'Dana' })).toBeVisible();
    await settled(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('a case manager limits, pauses or hands over a member', () => {
  // An example member: the page knows them without a caseload, and writes nothing.
  const JORDAN = '/person/access/?id=dummy-m1';

  test('Save waits for a change and a reason', async ({ page }) => {
    await signedInAs(page, 'admin');
    await page.goto(JORDAN);
    const save = page.getByRole('button', { name: 'Save' });
    await expect(page.getByRole('radio', { name: 'Everything' })).toBeChecked();
    await expect(save).toBeDisabled();

    await page.getByRole('radio', { name: 'Limited' }).check();
    await expect(save, 'a limit needs a reason').toBeDisabled();
    await page.getByRole('textbox', { name: 'Why?' }).fill('   ');
    await expect(save, 'spaces are not a reason').toBeDisabled();
    await page.getByRole('textbox', { name: 'Why?' }).fill('Sent unkind messages');
    await expect(save).toBeEnabled();
  });

  test('limiting asks first, says what the member will see, and an example writes nothing', async ({ page }) => {
    const calls = await signedInAs(page, 'admin');
    await page.goto(JORDAN);
    await page.getByRole('radio', { name: 'Limited' }).check();
    await page.getByRole('textbox', { name: 'Why?' }).fill('Sent unkind messages');
    await page.getByRole('button', { name: 'Save' }).click();

    const dialog = page.getByRole('dialog', { name: 'Limit Jordan?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/who to call/)).toBeVisible();
    // D-411: the dialog opens on its question, not on a button.
    await expect(dialog.getByRole('button', { name: 'Limit' })).not.toBeFocused();

    await dialog.getByRole('button', { name: 'Limit' }).click();
    await expect(page.getByRole('heading', { name: 'Jordan is limited' })).toBeVisible();
    await expect(page.getByText('This is an example. Nothing was changed.')).toBeVisible();
    expect(calls.some((c) => c.fn === 'admin_set_access_status')).toBe(false);
  });

  test('"Not now" closes the dialog and changes nothing', async ({ page }) => {
    await signedInAs(page, 'admin');
    await page.goto(JORDAN);
    await page.getByRole('radio', { name: 'Paused' }).check();
    await page.getByRole('textbox', { name: 'Why?' }).fill('Asked to pause');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Jordan is paused' })).toHaveCount(0);
  });

  test('the member’s page has both rows', async ({ page }) => {
    await signedInAs(page, 'admin');
    await page.goto('/person/?id=dummy-m1');
    await expect(page.getByRole('link', { name: /Limit or pause/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Hand over to another case manager/ })).toBeVisible();
  });

  test('hand-over opens with nothing chosen and lists colleagues', async ({ page }) => {
    await signedInAs(page, 'admin');
    await page.goto('/person/handover/?id=dummy-m1');
    await expect(page.getByRole('heading', { name: 'Hand Jordan over' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hand over' })).toBeDisabled();
    for (const radio of await page.getByRole('radio').all()) await expect(radio).not.toBeChecked();
  });

  for (const path of ['/person/access/?id=dummy-m1', '/person/handover/?id=dummy-m1']) {
    test(`${path} has no accessibility violations`, async ({ page }) => {
      await signedInAs(page, 'admin');
      await page.goto(path);
      await expect(page.getByRole('radio').first()).toBeVisible();
      await settled(page);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
