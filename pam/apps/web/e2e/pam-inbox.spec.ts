import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * Messages to Pam (card a100, D-605; Dot's x4 and x5): the Pam team's inbox. Home's first row counts the conversations
 * waiting for a reply (a plain number, D-586); the inbox puts the longest wait first and says how long, then Answered,
 * with Closed folded under one row. A row says only what `pam_inbox()` returns. Nothing shows while the switch is off.
 * Supabase is stubbed at the network.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

// The columns `pam_inbox()` returns (Nico, D-606).
const row = (id: string, first_name: string | null, role: string, extra: Record<string, unknown>) => ({
  conversation_id: id,
  asker_id: `a-${id}`,
  first_name,
  role,
  region_name: 'Philadelphia',
  program_name: null,
  status: 'open',
  last_message_at: ago(60),
  last_from: 'asker',
  waiting_since: null,
  preview: '…',
  ...extra,
});

const INBOX = [
  // Aaliyah wrote last, but Marcus has waited longest: he comes first.
  row('c2', 'Aaliyah', 'member', { waiting_since: ago(3 * 60), last_message_at: ago(3 * 60), preview: 'How do I change my city?' }),
  row('c1', 'Marcus', 'member', { waiting_since: ago(2 * 24 * 60 + 5), last_message_at: ago(10), preview: "I can't get my code." }),
  row('c3', 'Lou', 'provider', { region_name: null, program_name: 'Fresh Start Kitchen', waiting_since: ago(20), last_message_at: ago(20), preview: 'Our hours are wrong.' }),
  row('c4', 'Dana', 'admin', { last_from: 'team', last_message_at: ago(5 * 24 * 60), preview: 'We have fixed your city.' }),
  row('c5', 'Renee', 'member', { status: 'closed', last_from: 'team', last_message_at: ago(9 * 24 * 60), preview: 'Glad it works now.' }),
  // Pam's welcome and nothing else, as every account has: not in the inbox.
  row('c6', 'Kofi', 'member', { last_from: null, last_message_at: null, preview: null }),
];

interface Setup {
  readonly role?: 'super_admin' | 'member' | 'admin';
  readonly live?: boolean;
  readonly inbox?: unknown[];
  readonly locale?: string;
  readonly failFirst?: boolean;
}

async function signedIn(page: Page, { role = 'super_admin', live = true, inbox = INBOX, locale, failFirst = false }: Setup = {}) {
  const asked: string[] = [];
  await page.addInitScript(([userId, code]) => {
    const session = {
      access_token: 't',
      refresh_token: 'r',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
    if (code) window.localStorage.setItem('pam.locale', code);
  }, [ME, locale ?? null] as const);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: ME, role, first_name: 'Will', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', preferred_language: locale ?? null })),
  );
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/access_controls*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/staff_requests*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/programs_to_check*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/flagged_services*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/waiting_city_counts*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/pam_status*', (route) =>
    route.fulfill(
      json([{ live, hours_tz: 'America/New_York', hours_days: [1, 2, 3, 4, 5], hours_open: '09:00', hours_close: '17:00', open_now: true, next_open: null }]),
    ),
  );
  await page.route('**/rest/v1/rpc/pam_inbox*', (route) => {
    asked.push('pam_inbox');
    if (failFirst && asked.length === 1) return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    return route.fulfill(json(inbox));
  });
  return asked;
}

test.describe('Messages to Pam (card a100)', () => {
  test("Home's first row counts the conversations waiting for a reply, as a plain number (D-586)", async ({ page }) => {
    await signedIn(page);
    await page.goto('/');
    const link = page.getByRole('link', { name: /Messages to Pam/ });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/pam/messages/?from=home');
    // The whole row: the link is its name, and the count sits at its end.
    const row = page.getByRole('listitem').filter({ has: link });
    await expect(row).toContainText('3');
    // First, above Programs to check: someone is waiting on Pam.
    await expect(page.getByRole('link', { name: /Programs to check/ })).toBeVisible();
    const top = async (name: RegExp) => (await page.getByRole('link', { name }).boundingBox())!.y;
    expect(await top(/Messages to Pam/)).toBeLessThan(await top(/Programs to check/));
    // A count, never the red badge.
    await expect(row.locator('.astryx-badge')).toHaveCount(0);
  });

  test('with the switch off there is no row, and the inbox shows nothing and reads nothing', async ({ page }) => {
    const asked = await signedIn(page, { live: false });
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Programs to check/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Messages to Pam/ })).toHaveCount(0);
    await page.goto('/pam/messages/');
    await expect(page.getByText('Marcus')).toHaveCount(0);
    await expect(page.getByText('Waiting for Pam')).toHaveCount(0);
    expect(asked).toHaveLength(0);
    // The Pam team is told the switch is off, not that its account does not open this (Iris P4).
    await expect(page.getByText('Message Pam is off.')).toBeVisible();
    await expect(page.getByText(/does not open this/)).toHaveCount(0);
  });

  test('when the inbox cannot be read, Try again reads it again (Iris P5)', async ({ page }) => {
    const asked = await signedIn(page, { failFirst: true });
    await page.goto('/pam/messages/');
    await expect(page.getByText('Marcus')).toHaveCount(0);
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('list', { name: 'Waiting for Pam' }).getByText('Marcus')).toBeVisible();
    expect(asked).toHaveLength(2);
  });

  test('waiting longest first with how long, then answered, then closed folded at the foot', async ({ page }) => {
    await signedIn(page);
    await page.goto('/pam/messages/?from=home');
    await expect(page.getByRole('heading', { name: 'Messages to Pam', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Home' })).toBeVisible();

    const waiting = page.getByRole('list', { name: 'Waiting for Pam' });
    const items = waiting.getByRole('listitem');
    await expect(items).toHaveCount(3);
    await expect(items.getByRole('link')).toHaveText([/^Marcus/, /^Aaliyah/, /^Lou/]);
    await expect(items.nth(0)).toContainText('Waiting 2 days');
    await expect(items.nth(1)).toContainText('Waiting 3 hours');
    await expect(items.nth(2)).toContainText('Waiting 20 minutes');
    await expect(items.nth(0)).toContainText('Member · Philadelphia');
    await expect(items.nth(2)).toContainText('Program lead at Fresh Start Kitchen');
    await expect(items.nth(0).getByRole('link')).toHaveAttribute('href', /\/messages\/thread\/\?id=c1&from=pam/);

    const answered = page.getByRole('list', { name: 'Answered' });
    await expect(answered.getByRole('listitem')).toHaveCount(1);
    await expect(answered).toContainText('Case manager · Philadelphia');
    await expect(answered).toContainText('You: We have fixed your city.');
    await expect(answered).not.toContainText('Waiting');

    // Closed is one row with its count, not the conversations themselves.
    await expect(page.getByText('Renee')).toHaveCount(0);
    // A conversation with only Pam's welcome in it is nobody's question.
    await expect(page.getByText('Kofi')).toHaveCount(0);
    const closedRow = page.getByRole('link', { name: /Closed conversations/ });
    await expect(page.getByRole('listitem').filter({ has: closedRow })).toContainText('1');
    // No reply-time line in v1 (Dot's review, D-608: fewer words), and back only, no Help (x5).
    await expect(page.getByText(/Last 30 days/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Help' })).toHaveCount(0);

    await closedRow.click();
    await expect(page.getByRole('heading', { name: 'Closed conversations', level: 1 })).toBeVisible();
    await expect(page.getByText('Renee')).toBeVisible();
    await expect(page.getByText('Marcus')).toHaveCount(0);
  });

  test('says only a first name, the role and the region or program: nothing else about the person', async ({ page }) => {
    await signedIn(page, {
      inbox: [row('c9', 'Marcus', 'member', { waiting_since: ago(30), preview: 'Hello', last_name: 'Reeves', phone: '+12155550100', city: 'Camden' })],
    });
    await page.goto('/pam/messages/');
    const list = page.getByRole('list', { name: 'Waiting for Pam' });
    await expect(list).toContainText('Marcus');
    for (const word of ['Reeves', '2155550100', 'Camden']) await expect(page.getByRole('main')).not.toContainText(word);
  });

  test('nobody waiting says so in one line', async ({ page }) => {
    await signedIn(page, { inbox: [] });
    await page.goto('/pam/messages/');
    await expect(page.getByText('Nobody is waiting for Pam.')).toBeVisible();
    await expect(page.getByRole('link', { name: /Closed conversations/ })).toHaveCount(0);
  });

  test('in Arabic at 320, an English message keeps its own order after "أنت:" (D-435)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await signedIn(page, { locale: 'ar' });
    await page.goto('/pam/messages/');
    const answered = page.getByRole('listitem').filter({ hasText: 'Dana' });
    await expect(answered).toContainText('أنت:');
    // The words Pam's team wrote are their own element, laid out in their own direction: the full stop stays at their end.
    const body = answered.locator('[dir="auto"]').filter({ hasText: 'We have fixed your city.' });
    await expect(body).toHaveCount(1);
    expect(await body.evaluate((el) => getComputedStyle(el).direction)).toBe('ltr');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });

  for (const role of ['member', 'admin'] as const) {
    test(`a ${role === 'admin' ? 'case manager' : 'member'} is refused, and the inbox is never asked`, async ({ page }) => {
      const asked = await signedIn(page, { role });
      await page.goto('/pam/messages/');
      await expect(page.getByText('Marcus')).toHaveCount(0);
      await expect(page.getByText('Waiting for Pam')).toHaveCount(0);
      expect(asked).toHaveLength(0);
    });
  }

  test('has no WCAG A/AA violations', async ({ page }) => {
    await signedIn(page);
    await page.goto('/pam/messages/');
    await expect(page.getByRole('list', { name: 'Waiting for Pam' })).toBeVisible();
    await settled(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
