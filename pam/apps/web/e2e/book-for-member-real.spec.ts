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
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function leadWith(page: import('@playwright/test').Page, people: boolean) {
  await asMember(page, 'provider');
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

test('a real lead nobody has written to is told so', async ({ page }) => {
  await leadWith(page, false);
  await page.goto('/program/book/');
  await settled(page);
  await expect(page.getByText(/Nobody has written to your program yet/)).toBeVisible();
});
