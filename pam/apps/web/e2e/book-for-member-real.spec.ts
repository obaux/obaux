import { expect, test } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';

/**
 * S1 (Iris's program lead pass, 15 October 2026): a real program lead's "Book a visit for a member" lists the
 * members who have written to her program, from her own conversations (D-541 part 2). Since D-509 the list was
 * always empty for a real account. Only a first name and the last message come with it (D-542). Supabase is stubbed.
 */
const CONVO = '2a9d5e1c-3b7f-4d8e-9a1b-6c5d4e3f2a1b';
const CONVO_STAFF = '2a9d5e1c-3b7f-4d8e-9a1b-6c5d4e3f2a1c';
const JORDAN = '7c1f8c1e-1c7e-4a5c-9d6e-0f3a2b4c5d6e';
const TANYA = '7c1f8c1e-1c7e-4a5c-9d6e-0f3a2b4c5d6f';
const ORG = '22222222-0000-0000-0000-0000000000aa';
const PROGRAM = '4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

/** A lead who has a program on Pam (D-447), or one who has none yet. */
async function leadWith(page: import('@playwright/test').Page, people: boolean, hasProgram = true) {
  await asMember(page, 'provider');
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b', org_id: ORG, role: 'provider', first_name: 'Lou', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z' })),
  );
  await page.route('**/rest/v1/program_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/program_submissions*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/services*', (route) =>
    route.fulfill(json(hasProgram ? [{ id: PROGRAM, name: 'Fresh Start Kitchen', category: 'workforce', subcategory: null, description_plain: 'Words.', address: '1 Main St', phone: null, website: null, needs_review: false, is_active: true, created_at: '2026-10-06T10:00:00Z' }] : [])),
  );
  await page.route('**/rest/v1/conversation_members*', (route) =>
    route.fulfill(json(people ? [{ conversation_id: CONVO, last_read_at: null }, { conversation_id: CONVO_STAFF, last_read_at: null }] : [])),
  );
  await page.route('**/rest/v1/rpc/conversation_partners*', (route) =>
    route.fulfill(
      json([
        { conversation_id: CONVO, profile_id: JORDAN, first_name: 'Jordan', role: 'member', program_name: null },
        { conversation_id: CONVO_STAFF, profile_id: TANYA, first_name: 'Tanya', role: 'admin', program_name: null },
      ]),
    ),
  );
  await page.route('**/rest/v1/messages*', (route) =>
    route.fulfill(
      json([
        { conversation_id: CONVO, sender_id: JORDAN, body: 'Can I come on Thursday?', attachment_kind: null, created_at: new Date().toISOString() },
        { conversation_id: CONVO_STAFF, sender_id: TANYA, body: 'Staff chatter', attachment_kind: null, created_at: new Date().toISOString() },
      ]),
    ),
  );
}

test('a real lead sees the members who wrote to her program, and picking one opens New trip for them', async ({ page }) => {
  await leadWith(page, true);
  await page.goto('/program/book/');
  await settled(page);
  const jordan = page.getByRole('link', { name: /Jordan/ });
  await expect(jordan).toBeVisible();
  await expect(page.getByText('Can I come on Thursday?')).toBeVisible();
  // Staff are not people to book for.
  await expect(page.getByText('Tanya')).toHaveCount(0);
  await expect(page.getByText('Nobody has written to your program yet.')).toHaveCount(0);
  await jordan.click();
  await expect(page).toHaveURL(new RegExp(`for=${JORDAN}`));
});

test('a member in two conversations is one row, not two with the same key', async ({ page }) => {
  await leadWith(page, true);
  await page.route('**/rest/v1/rpc/conversation_partners*', (route) =>
    route.fulfill(
      json([
        { conversation_id: CONVO, profile_id: JORDAN, first_name: 'Jordan', role: 'member', program_name: null },
        { conversation_id: CONVO_STAFF, profile_id: JORDAN, first_name: 'Jordan', role: 'member', program_name: null },
      ]),
    ),
  );
  await page.goto('/program/book/');
  await settled(page);
  await expect(page.getByRole('link', { name: /Jordan/ })).toHaveCount(1);
});

test('a real lead nobody has written to is told so', async ({ page }) => {
  await leadWith(page, false);
  await page.goto('/program/book/');
  await settled(page);
  await expect(page.getByText(/Nobody has written to your program yet/)).toBeVisible();
});

test('a real lead whose program is not on Pam has no rows and no link to the example place (a55)', async ({ page }) => {
  await leadWith(page, true, false);
  await page.goto('/program/book/');
  await settled(page);
  await expect(page.getByRole('link', { name: /Jordan/ })).toHaveCount(0);
  const hrefs = await page.getByRole('link').evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
  expect(hrefs.filter((h) => h.includes('dummy-place'))).toEqual([]);
});

test('a real lead\'s row books into her own program, never the example one', async ({ page }) => {
  await leadWith(page, true);
  await page.goto('/program/book/');
  await settled(page);
  await page.getByRole('link', { name: /Jordan/ }).click();
  await expect(page).toHaveURL(new RegExp(`place=${PROGRAM}`));
  await expect(page).not.toHaveURL(/dummy-place/);
});
