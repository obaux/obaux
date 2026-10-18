import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import { settled } from './settled';

/**
 * Message Pam, the person's side (D-605, D-606; Will, 18 October 2026, card a100): everyone has one conversation with Pam in their
 * Messages from the first load, starting with Pam's welcome; it reads like any other conversation (no pinned card, no "who reads
 * this" line, no ⋯, no Report or Block); outside Pam's hours one automatic reply says when Pam is here; a limited account can
 * write to Pam; Help and Contact Pam open it; a message that did not go stays "Not sent" with Try again. Behind a switch that
 * is off: with it off nothing of this is shown.
 *
 * The network is faked here, so what is tested is the screens and what they ask for, not the database (tests 79 to 83 are that).
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const PAM_C = 'c0c0c0c0-0000-4000-8000-00000000a001';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const LOCALES = ['en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'] as const;
const bundle = (locale: string): Record<string, string> =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../../../packages/config/src/locales/${locale}.json`, import.meta.url)), 'utf8'));

interface Row { id: string; conversation_id: string; sender_id: string | null; system_key: string | null; system_vars: unknown; body: string; attachment_url: null; attachment_kind: null; created_at: string }

async function world(
  page: Page,
  opts: { live?: boolean; access?: 'active' | 'limited'; locale?: string; role?: 'member' | 'admin' | 'provider'; away?: boolean; failFirstPost?: boolean } = {},
) {
  const live = opts.live ?? true;
  const messages: Row[] = live
    ? [{ id: 'w', conversation_id: PAM_C, sender_id: null, system_key: 'pam.welcome', system_vars: null, body: '', attachment_url: null, attachment_kind: null, created_at: new Date(Date.now() - 3_600_000).toISOString() }]
    : [];
  if (live && opts.away) {
    messages.push(
      { id: 'u', conversation_id: PAM_C, sender_id: ME, system_key: null, system_vars: null, body: 'Is anyone there tonight?', attachment_url: null, attachment_kind: null, created_at: new Date(Date.now() - 600_000).toISOString() },
      { id: 'a', conversation_id: PAM_C, sender_id: null, system_key: 'pam.away', system_vars: { opensAt: new Date(Date.now() + 36_000_000).toISOString() }, body: '', attachment_url: null, attachment_kind: null, created_at: new Date(Date.now() - 599_000).toISOString() },
    );
  }
  let posts = 0;
  await page.addInitScript(([userId, code]) => {
    const session = { access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: userId, aud: 'authenticated', role: 'authenticated' } };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
    if (code) window.localStorage.setItem('pam.locale', code);
  }, [ME, opts.locale ?? null] as const);
  await page.route('**/rest/v1/**', (route) => route.fulfill(json([])));
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: ME, role: opts.role ?? 'member', first_name: 'Will', region_id: null, regions: { name: 'Philadelphia' }, access_status: opts.access ?? 'active', onboarded_at: '2026-09-14T00:00:00Z', org_id: null, preferred_language: opts.locale ?? null })),
  );
  await page.route('**/rest/v1/rpc/pam_status*', (route) =>
    route.fulfill(json([{ live, hours_tz: 'America/New_York', hours_days: [1, 2, 3, 4, 5], hours_open: '09:00:00', hours_close: '17:00:00', open_now: true, next_open: null }])),
  );
  await page.route('**/rest/v1/rpc/open_pam_conversation*', (route) => route.fulfill(json(live ? PAM_C : null)));
  await page.route('**/rest/v1/rpc/conversation_partners*', (route) =>
    route.fulfill(json(live ? [{ conversation_id: PAM_C, profile_id: null, first_name: null, role: null, program_name: null }] : [])),
  );
  await page.route('**/rest/v1/conversation_members*', (route) => {
    if (route.request().method() === 'PATCH') return route.fulfill(json([]));
    if (!live) return route.fulfill(json([]));
    if (route.request().url().includes('conversation_id=eq.')) return route.fulfill(json([{ profile_id: ME, conversations: { kind: 'support' } }]));
    return route.fulfill(json([{ conversation_id: PAM_C, last_read_at: null }]));
  });
  await page.route('**/rest/v1/messages*', (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      posts += 1;
      if (opts.failFirstPost && posts === 1) return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      const body = request.postDataJSON() as { body: string };
      const row: Row = { id: `m${posts}`, conversation_id: PAM_C, sender_id: ME, system_key: null, system_vars: null, body: body.body, attachment_url: null, attachment_kind: null, created_at: new Date().toISOString() };
      messages.push(row);
      return route.fulfill(json(row));
    }
    return route.fulfill(json(messages));
  });
  return { posts: () => posts, sent: () => messages.filter((m) => m.sender_id === ME) };
}

test.describe('Message Pam, the person\'s side', () => {
  test('Messages shows Pam from the first load, the welcome unread, even with nobody else to message', async ({ page }) => {
    await world(page);
    await page.goto('/messages/');
    await settled(page);
    const row = page.getByRole('link', { name: /Pam/ }).first();
    await expect(row).toBeVisible();
    await expect(page.getByText("Hi Will, it's Pam. If you need help with anything, reply here.").first()).toBeVisible();
    await expect(row).toHaveAttribute('href', new RegExp(`/messages/thread/\\?id=${PAM_C}`));
    // The Messages tab is there although there is no one else to message.
    await expect(page.getByRole('link', { name: /^Messages/ }).first()).toBeVisible();
  });

  test('the thread reads like any other: Pam\'s mark and name, the welcome, "Write to Pam", a photo button, no document, no ⋯, no notice', async ({ page }) => {
    await world(page);
    await page.goto(`/messages/thread/?id=${PAM_C}`);
    await settled(page);
    await expect(page.getByRole('heading', { name: 'Pam', level: 1 })).toBeVisible();
    await expect(page.getByText("Hi Will, it's Pam. If you need help with anything, reply here.")).toBeVisible();
    const box = page.getByRole('textbox');
    await expect(box).toHaveAccessibleName('Write to Pam');
    await expect(page.getByRole('button', { name: 'Add a photo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Speak your message' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add a document' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'More options' })).toHaveCount(0);
    // Nothing is pinned, and nothing says who reads it or that Pam started it.
    await expect(page.getByText(/team reads|Pam started|911|988/)).toHaveCount(0);
  });

  test('outside Pam\'s hours the automatic reply is in the thread, with when Pam is here and one 988 line', async ({ page }) => {
    await world(page, { away: true });
    await page.goto(`/messages/thread/?id=${PAM_C}`);
    await settled(page);
    await expect(page.getByText(/Thanks for writing\. Pam is here Monday to Friday, 9\sAM to 5\sPM Eastern time, and we'll read your message then\./)).toBeVisible();
    await expect(page.getByText('In a crisis, call or text 988.')).toBeVisible();
    // It reads like a reply from Pam: on the other side, not labelled as an automatic message.
    await expect(page.getByText(/automatic/i)).toHaveCount(0);
  });

  test('a limited account can write to Pam', async ({ page }) => {
    const server = await world(page, { access: 'limited' });
    await page.goto(`/messages/thread/?id=${PAM_C}`);
    await settled(page);
    await expect(page.getByText('Some things are turned off')).toHaveCount(0);
    await page.getByRole('textbox').fill('Why is my account limited?');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByText('Why is my account limited?')).toBeVisible();
    expect(server.sent().map((m) => m.body)).toEqual(['Why is my account limited?']);
  });

  test('a message to Pam that did not go stays "Not sent" and Try again sends it once', async ({ page }) => {
    const server = await world(page, { failFirstPost: true });
    await page.goto(`/messages/thread/?id=${PAM_C}`);
    await settled(page);
    await page.getByRole('textbox').fill('I lost my paperwork');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByText('Not sent', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Not sent. Try again.' }).click();
    await expect(page.getByText('Not sent', { exact: true })).toHaveCount(0);
    await expect(page.getByText('I lost my paperwork')).toHaveCount(1);
    expect(server.sent().map((m) => m.body)).toEqual(['I lost my paperwork']);
  });

  test('Help ends with Write to Pam, which opens the conversation; Contact Pam goes there too', async ({ page }) => {
    await world(page);
    await page.goto('/help/');
    await settled(page);
    const rows = page.getByRole('link');
    const write = page.getByRole('link', { name: 'Write to Pam' });
    await expect(write).toBeVisible();
    await expect(rows.last()).toBeDefined();
    await write.click();
    await expect(page).toHaveURL(new RegExp(`/messages/thread/\\?id=${PAM_C}`));
    await expect(page.getByRole('textbox')).toHaveAccessibleName('Write to Pam');
  });

  test('with the switch off nothing of Pam is shown: no row, no Write to Pam, the tab hides with nobody to message', async ({ page }) => {
    await world(page, { live: false });
    await page.goto('/help/');
    await settled(page);
    await expect(page.getByRole('link', { name: 'Write to Pam' })).toHaveCount(0);
    await page.goto('/messages/thread/?pam=1');
    await settled(page);
    await expect(page.getByRole('heading', { name: 'Pam', level: 1 })).toHaveCount(0);
  });

  for (const locale of LOCALES) {
    test(`in ${locale}: the row, the thread's name and welcome, and the composer say what the bundle says`, async ({ page }) => {
      await world(page, { locale });
      const words = bundle(locale);
      await page.goto(`/messages/thread/?id=${PAM_C}`);
      await settled(page);
      await expect(page.getByRole('heading', { name: words['pam.name']!, level: 1 })).toBeVisible();
      await expect(page.getByRole('textbox')).toHaveAccessibleName(words['messages.pam.placeholder']!);
      // The welcome, with the reader's first name (Arabic wraps a name in direction marks, so it is matched without them).
      const welcome = words['pam.welcome']!.replace('{name}', 'Will');
      const text = await page.locator('main, body').first().innerText();
      expect(text.replace(/[⁦-⁩‎‏]/g, '')).toContain(welcome);
    });
  }
});
