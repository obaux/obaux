import { test, expect } from '@playwright/test';
import { settled } from './settled';

/**
 * A program lead answers "Pam asked for changes" (D-386, part 5b): Edit and send
 * again sends the SAME submission back to review (`resend_program_submission`),
 * not a second send (`submit_program` refuses while the first is open), and it
 * opens on what the database holds, not on what this tab remembers.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const ORG = '22222222-0000-0000-0000-0000000000aa';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

test('Edit and send again resends the same submission, from what the database holds', async ({ page }) => {
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, ME);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: ME, org_id: ORG, role: 'provider', first_name: 'Lou', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/services*', (route) =>
    route.fulfill(
      json([
        {
          id: '4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a', name: 'Fresh Start Kitchen', category: 'workforce', subcategory: null,
          description_plain: 'Cooking classes.', address: null, phone: null, website: null, needs_review: true, is_active: true,
          created_at: '2026-10-06T10:00:00Z',
        },
      ]),
    ),
  );
  await page.route('**/rest/v1/program_submissions*', (route) =>
    route.fulfill(
      json([{ id: 'sub-1', kind: 'new', status: 'changes_asked', details: {}, sent_at: '2026-10-06T10:00:00Z', changes_note: 'Add the street address.' }]),
    ),
  );
  const resent: unknown[] = [];
  await page.route('**/rest/v1/rpc/resend_program_submission*', (route) => {
    resent.push(route.request().postDataJSON());
    return route.fulfill(json({ id: 'sub-1', status: 'in_review' }));
  });
  let submitted = 0;
  await page.route('**/rest/v1/rpc/submit_program*', (route) => {
    submitted += 1;
    return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'PROGRAM_ALREADY_IN_REVIEW' }) });
  });

  await page.goto('/programs/new/?edit=1');
  await settled(page);
  // The review step, filled from the database.
  await expect(page.getByText('Fresh Start Kitchen')).toBeVisible();
  await page.getByRole('button', { name: 'Add program' }).click();
  await expect.poll(() => resent.length).toBe(1);
  expect(resent[0]).toMatchObject({ p_id: 'sub-1', p_name: 'Fresh Start Kitchen', p_category: 'workforce' });
  expect(submitted).toBe(0);
});
