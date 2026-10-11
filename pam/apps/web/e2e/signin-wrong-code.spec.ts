import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import en from '@pam/config/locales/en.json';

/**
 * A wrong or expired code (Will, 11 October, D-510): "we should subset this component and use a
 * small alert banner. Don't have them call for this issue. Just try again." The person stays on
 * "Enter your code", the boxes are emptied with the cursor in them, a small alert sits under
 * them, "Send again" is still there, and there is no Call button and no trip back to the number.
 *
 * Supabase is stubbed at the network; the first code is refused, the second accepted.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function toTheCodeStep(page: Page, accepts: string) {
  let attempts = 0;
  await page.route('**/auth/v1/otp*', (route) => route.fulfill(json({})));
  await page.route('**/auth/v1/verify*', (route) => {
    attempts += 1;
    const token = (route.request().postDataJSON() as { token?: string }).token;
    if (token !== accepts) {
      return route.fulfill(json({ code: 403, error_code: 'otp_expired', msg: 'Token has expired or is invalid' }, 403));
    }
    return route.fulfill(
      json({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: ME, aud: 'authenticated', role: 'authenticated', phone: '12155550100' },
      }),
    );
  });
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME, phone: '12155550100' })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: ME, role: 'member', first_name: 'Dana', onboarded_at: '2026-09-12T00:00:00Z', access_status: 'active' })),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/notification_preferences*', (route) => route.fulfill(json([{ reminders_consent: true }])));
  await page.route('**/rest/v1/rpc/pending_invite_for_me*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/served_cities*', (route) => route.fulfill(json([{ city: 'Philadelphia' }])));
  await page.route('**/rest/v1/rpc/member_points*', (route) => route.fulfill(json(0)));
  await page.route('**/rest/v1/access_controls*', (route) => route.fulfill(json([])));

  await page.goto('/signin/');
  await page.getByLabel('Your phone number').fill('215 555 0100');
  await page.getByRole('button', { name: en['signin.phone.action'] }).click();
  await expect(page.getByRole('heading', { name: en['signin.code.title'], level: 1 })).toBeVisible();
  return () => attempts;
}

test.describe('a code that did not work', () => {
  test('stays on the code step with a small alert, an empty focused field, no Call button', async ({ page }) => {
    const attempts = await toTheCodeStep(page, '654321');
    const field = page.getByLabel(en['signin.code.label']);
    await field.fill('123456');

    const alert = page.getByRole('alert').filter({ hasText: en['signin.code.wrong'] });
    await expect(alert).toBeVisible();
    expect(attempts()).toBe(1);

    // Still "Enter your code", not the number step; emptied, with the cursor in it.
    await expect(page.getByRole('heading', { name: en['signin.code.title'], level: 1 })).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toHaveCount(0);
    await expect(field).toHaveValue('');
    await expect(field).toBeFocused();

    // The way on is the field and Send again; there is no big Contact Pam button here, and nobody is asked to
    // call (the quiet "Need help? Contact Pam" link is its own test below).
    await expect(page.getByRole('button', { name: /Contact Pam|Call/ })).toHaveCount(0);
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
    await expect(page.getByText(en['signin.failed.send.title'])).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp(en['signin.code.again']) })).toBeVisible();

    // One line, small: well under the full Notice card.
    const box = (await alert.boundingBox())!;
    expect(box.height).toBeLessThan(64);
  });

  test('the same wrong code can be typed again, and a right one signs in', async ({ page }) => {
    const attempts = await toTheCodeStep(page, '654321');
    const field = page.getByLabel(en['signin.code.label']);
    await field.fill('123456');
    await expect(page.getByRole('alert').filter({ hasText: en['signin.code.wrong'] })).toBeVisible();
    // The same six digits again is a new try, not swallowed as already sent.
    await field.fill('123456');
    await expect.poll(attempts).toBe(2);
    await expect(page.getByRole('alert').filter({ hasText: en['signin.code.wrong'] })).toBeVisible();

    await field.fill('654321');
    await expect(page).not.toHaveURL(/\/signin\//);
  });

  test('Sign in waits for all six digits (D-532): a short code is never sent to be called wrong', async ({ page }) => {
    const attempts = await toTheCodeStep(page, '654321');
    const field = page.getByLabel(en['signin.code.label']);
    const signIn = page.getByRole('button', { name: en['signin.code.action'] });
    await expect(signIn).toBeDisabled();
    await field.pressSequentially('1');
    await expect(signIn).toBeDisabled();
    await field.pressSequentially('2345');
    await expect(signIn).toBeDisabled();
    expect(attempts()).toBe(0);
    await field.pressSequentially('6');
    await expect.poll(attempts).toBe(1);
  });

  test('the alert goes as soon as they start typing', async ({ page }) => {
    await toTheCodeStep(page, '654321');
    const field = page.getByLabel(en['signin.code.label']);
    await field.fill('123456');
    const alert = page.getByRole('alert').filter({ hasText: en['signin.code.wrong'] });
    await expect(alert).toBeVisible();
    await field.pressSequentially('6');
    await expect(alert).toHaveCount(0);
  });

  test('the code step with the alert showing has no WCAG A/AA violations', async ({ page }) => {
    await toTheCodeStep(page, '654321');
    await page.getByLabel(en['signin.code.label']).fill('123456');
    await expect(page.getByRole('alert').filter({ hasText: en['signin.code.wrong'] })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test('there is a way to a person on the code step: Need help? Contact Pam, to the help desk post (A26, A28)', async ({ page }) => {
    await toTheCodeStep(page, '654321');
    const field = page.getByLabel(en['signin.code.label']);
    await field.fill('123456');
    await expect(page.getByRole('alert').filter({ hasText: en['signin.code.wrong'] })).toBeVisible();

    // Under Send again, outside the alert, and nothing to call.
    const help = page.getByRole('link', { name: en['help.needHelp'] });
    await expect(help).toBeVisible();
    await expect(help).toHaveAttribute('href', 'https://joinpam.org/support/cant-sign-in/');
    await expect(page.getByRole('alert').getByRole('link')).toHaveCount(0);
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
    const again = (await page.getByRole('button', { name: new RegExp(en['signin.code.again']) }).boundingBox())!;
    const box = (await help.boundingBox())!;
    expect(box.y).toBeGreaterThan(again.y);
    // A finger can hit it (§2.5).
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});

