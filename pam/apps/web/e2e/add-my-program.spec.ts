import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * A member asks to add a program from Profile (D-525; Will, 11 October 2026:
 * "anyone should be able to create a program"). The questions are the lead's;
 * the send is `request_staff_access`, which Pam's team approves.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function signedInMember(page: Page, request: Record<string, unknown> | null) {
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
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({ id: ME, role: 'member', first_name: 'Ada', region_id: null, regions: { name: 'Philadelphia' }, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' }),
    ),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/staff_requests*', (route) => route.fulfill(request ? json(request) : { status: 200, contentType: 'application/json', body: 'null' }));
}

const REQUEST = {
  wants_role: 'provider', decision: null, program_name: 'Ada’s Atelier', program_category: 'education',
  program_subcategory: null, program_description: 'Open studio.', program_address: '1 Elm St', program_phone: null, program_website: null,
};

test('a member with no request sees the row, answers the questions, and the request is sent', async ({ page }) => {
  await signedInMember(page, null);
  const asked: Record<string, unknown>[] = [];
  await page.route('**/rest/v1/rpc/request_staff_access*', (route) => {
    asked.push(route.request().postDataJSON() as Record<string, unknown>);
    return route.fulfill(json(null));
  });
  await page.goto('/profile/');
  await settled(page);
  await page.getByRole('link', { name: /Add my program/ }).click();
  await expect(page).toHaveURL(/\/profile\/add-program\/$/);
  await page.getByRole('textbox', { name: 'Program name' }).fill('Ada’s Atelier');
  // Through the questions to the last one, whose button is "Add program".
  // Next is one button at the foot whose label changes on the last step, and a tap re-renders a beat later,
  // so each tap waits for the question to change before the next one, and only Next or Skip is pressed here.
  const add = page.getByRole('button', { name: /^Add program/ });
  const next = page.getByRole('button', { name: /^(Next|Skip for now)/ }).first();
  const review = page.getByRole('heading', { name: 'Review details', level: 1 });
  const question = async () =>
    `${await page.getByRole('heading', { level: 1 }).first().innerText()}|${await page
      .getByRole('heading', { level: 2 })
      .first()
      .innerText({ timeout: 500 })
      .catch(() => '')}`;
  for (let i = 0; i < 10 && !(await review.isVisible()); i++) {
    const before = await question();
    await next.click();
    await expect.poll(question).not.toBe(before);
  }
  await expect(add).toBeVisible();
  await page.getByRole('button', { name: /^Add program/ }).click();
  await expect(page.getByRole('heading', { name: 'Sent to Pam' })).toBeVisible();
  expect(asked).toHaveLength(1);
  expect(asked[0]).toMatchObject({ p_wants_role: 'provider', p_program_name: 'Ada’s Atelier', p_first_name: 'Ada', p_city: 'Philadelphia' });
  await expect(page.getByText(/We will text you when we have checked it/)).toBeVisible();
});

test('a request being checked shows on Profile and is a status, not the questions', async ({ page }) => {
  await signedInMember(page, REQUEST);
  await page.goto('/profile/');
  await settled(page);
  await expect(page.getByText('Being checked')).toBeVisible();
  await page.getByRole('link', { name: /Add my program/ }).click();
  await expect(page.getByRole('heading', { name: 'Being checked', level: 1 })).toBeVisible();
  await expect(page.getByText('Ada’s Atelier')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Program name' })).toHaveCount(0);
});

test('a request that was turned down can be changed and asked again, with what was sent kept', async ({ page }) => {
  await signedInMember(page, { ...REQUEST, decision: 'denied' });
  await page.goto('/profile/add-program/');
  await settled(page);
  await expect(page.getByRole('heading', { name: 'Not approved this time', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Change it and ask again' }).click();
  await expect(page.getByRole('textbox', { name: 'Program name' })).toHaveValue('Ada’s Atelier');
});
