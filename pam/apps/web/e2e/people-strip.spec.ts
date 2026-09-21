import { test, expect } from '@playwright/test';
import { settled } from './settled';

/**
 * Home's people strip, and the ring on an avatar (D-198).
 *
 * A ring means something new from that person: an unread message to the
 * viewer, or a place they saved since the viewer last looked. Lit people come
 * first, newest first; everybody else keeps their order. Tapping somebody
 * with an unread message opens that conversation; anybody else opens their
 * person screen. The data is stubbed at the network — `messageable_people`,
 * `people_activity`, and the conversation list — and what is tested is the
 * rule, the order, the link, and that a tile is big enough to hit.
 */

const USER = '**/auth/v1/user*';
const PROFILES = '**/rest/v1/profiles*';
const POINTS = '**/rest/v1/rpc/member_points*';
const CONTROLS = '**/rest/v1/access_controls*';
const NOTIFICATIONS = '**/rest/v1/notifications*';
const SAVED = '**/rest/v1/rpc/saved_places_mine*';
const MEMBERS = '**/rest/v1/conversation_members*';
const MESSAGES = '**/rest/v1/messages*';
const PARTNERS = '**/rest/v1/rpc/conversation_partners*';
const PEOPLE = '**/rest/v1/rpc/messageable_people*';
const ACTIVITY = '**/rest/v1/rpc/people_activity*';

const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const MARCUS = '7c1f8c1e-1c7e-4a5c-9d6e-0f3a2b4c5d6e';
const KEISHA = '8d2a9d2f-2d8f-4b6d-8e7f-1a4b3c5d6e7f';
const AALIYAH = '9e3b0e30-3e90-4c7e-9f80-2b5c4d6e7f80';
const DEVON = 'af4c1f41-4fa1-4d8f-a091-3c6d5e7f8091';
const CONVO = '2a9d5e1c-3b7f-4d8e-9a1b-6c5d4e3f2a1b';

const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function seedSession(page: import('@playwright/test').Page) {
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
}

async function signedInAs(page: import('@playwright/test').Page, role: 'admin' | 'provider' | 'super_admin') {
  await seedSession(page);
  await page.route(NOTIFICATIONS, (route) => route.fulfill(json([])));
  await page.route(CONTROLS, (route) => route.fulfill(json([])));
  await page.route(SAVED, (route) => route.fulfill(json([])));
  await page.route(USER, (route) => route.fulfill(json({ id: ME, phone: '12673095265' })));
  await page.route(POINTS, (route) => route.fulfill(json(250)));
  await page.route(PROFILES, (route) =>
    route.fulfill(
      json({
        id: ME,
        role,
        first_name: 'Dana',
        region_id: '0195b1c0-0000-4000-8000-000000000001',
        regions: { name: 'Philadelphia' },
      }),
    ),
  );
}

/**
 * Four people, A–Z from the database. Marcus wrote two hours ago and it is
 * unread; Keisha saved a place an hour ago; Aaliyah and Devon did nothing.
 */
async function withPeople(page: import('@playwright/test').Page) {
  await page.route(PEOPLE, (route) =>
    route.fulfill(
      json([
        { profile_id: AALIYAH, first_name: 'Aaliyah', role: 'member' },
        { profile_id: DEVON, first_name: 'Devon', role: 'member' },
        { profile_id: KEISHA, first_name: 'Keisha', role: 'member' },
        { profile_id: MARCUS, first_name: 'Marcus', role: 'member' },
      ]),
    ),
  );
  await page.route(ACTIVITY, (route) =>
    route.fulfill(json([{ profile_id: KEISHA, last_saved_at: hoursAgo(1) }])),
  );
  await page.route(MEMBERS, (route) => route.fulfill(json([{ conversation_id: CONVO, last_read_at: null }])));
  await page.route(PARTNERS, (route) =>
    route.fulfill(json([{ conversation_id: CONVO, profile_id: MARCUS, first_name: 'Marcus', role: 'member' }])),
  );
  await page.route(MESSAGES, (route) =>
    route.fulfill(
      json([
        {
          id: 'm-1',
          conversation_id: CONVO,
          sender_id: MARCUS,
          body: 'Is the class still on Tuesday?',
          created_at: hoursAgo(2),
        },
      ]),
    ),
  );
}

const strip = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'Members' });

test.describe('the people strip on Home', () => {
  test('lights the people with something new, newest first, and leaves the rest in order', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withPeople(page);
    await page.goto('/');

    const links = strip(page).getByRole('link');
    await expect(links).toHaveCount(4);
    await expect(links).toHaveText([/Keisha/, /Marcus/, /Aaliyah/, /Devon/]);

    // The ring is a colour; the reason is also read out, so a screen reader
    // hears it and this test can see it.
    await expect(links.nth(0)).toContainText('Saved a new place');
    await expect(links.nth(1)).toContainText('New message');
    await expect(links.nth(2)).not.toContainText(/New message|Saved a new place/);
    await expect(links.nth(3)).not.toContainText(/New message|Saved a new place/);
  });

  test('an unread message opens the conversation; anybody else opens the person', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withPeople(page);
    await page.goto('/');

    const links = strip(page).getByRole('link');
    await expect(links.nth(1)).toHaveAttribute('href', `/messages/thread/?id=${CONVO}`);
    await expect(links.nth(0)).toHaveAttribute('href', `/person/?id=${KEISHA}`);
    await expect(links.nth(2)).toHaveAttribute('href', `/person/?id=${AALIYAH}`);
  });

  test('a save is new until the viewer has looked, and an unread message stays lit', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withPeople(page);
    await page.goto('/');
    await expect(strip(page).getByRole('link').first()).toContainText('Keisha');

    // Looking at the strip records the time. Nothing else changed, so on the
    // next visit Keisha's hour-old save is no longer new — Marcus's message,
    // still unread, still is.
    await page.reload();
    await settled(page);
    const links = strip(page).getByRole('link');
    await expect(links).toHaveText([/Marcus/, /Aaliyah/, /Devon/, /Keisha/]);
    await expect(links.nth(0)).toContainText('New message');
    await expect(links.nth(3)).not.toContainText('Saved a new place');
  });

  test('every tile is big enough to hit (§2.5)', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withPeople(page);
    await page.goto('/');

    const links = strip(page).getByRole('link');
    await expect(links).toHaveCount(4);
    for (let i = 0; i < 4; i += 1) {
      const box = await links.nth(i).boundingBox();
      expect(box, `tile ${i} has no box`).not.toBeNull();
      expect(box!.width, `tile ${i} width`).toBeGreaterThanOrEqual(48);
      expect(box!.height, `tile ${i} height`).toBeGreaterThanOrEqual(48);
    }
  });

  test('the example strip follows the same rule while a super admin previews a case manager', async ({ page }) => {
    // Keisha's example thread ends with her message (unread for Teresa);
    // Aaliyah's example record carries a save two hours ago. Both lit, the
    // newer first; the other four in their written order.
    await page.addInitScript(() => sessionStorage.setItem('pam.view-as', 'admin'));
    await signedInAs(page, 'super_admin');
    await page.goto('/');

    const links = strip(page).getByRole('link');
    await expect(links).toHaveText([/Aaliyah/, /Keisha/, /Jordan/, /Miguel/, /Devon/, /Priya/]);
    await expect(links.nth(0)).toContainText('Saved a new place');
    await expect(links.nth(1)).toContainText('New message');
    await expect(links.nth(1)).toHaveAttribute('href', /\/messages\/thread\/\?id=dummy-conv-dummy-m2-dummy-a1/);
    await expect(page.getByText('Example people, so you can see how this looks.')).toBeVisible();
  });
});
