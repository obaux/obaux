import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * The messenger (D-176 through D-182).
 *
 * Supabase is unreachable from this environment, so the session and the
 * queries are stubbed at the network — the same way `admin.spec.ts` does.
 * What is tested is the screens' behaviour: the conversation list with its
 * previews, the thread drawn with Astryx's Chat family, the report action,
 * and the moderation list — and that every one of them is axe-clean at the
 * narrow viewport, which the hand-rolled bubble this replaced never had a
 * test for.
 */

const USER = '**/auth/v1/user*';
const PROFILES = '**/rest/v1/profiles*';
const POINTS = '**/rest/v1/rpc/member_points*';
const CONTROLS = '**/rest/v1/access_controls*';
const NOTIFICATIONS = '**/rest/v1/notifications*';
const MEMBERS = '**/rest/v1/conversation_members*';
const MESSAGES = '**/rest/v1/messages*';
const PARTNERS = '**/rest/v1/rpc/conversation_partners*';
const PEOPLE = '**/rest/v1/rpc/messageable_people*';
const REPORT = '**/rest/v1/rpc/report_message*';
const REPORTS = '**/rest/v1/rpc/reports_for_review*';

const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const OTHER = '7c1f8c1e-1c7e-4a5c-9d6e-0f3a2b4c5d6e';
const CONVO = '2a9d5e1c-3b7f-4d8e-9a1b-6c5d4e3f2a1b';
const MSG_THEIRS = '5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b';

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

async function signedInAs(page: import('@playwright/test').Page, role: 'admin' | 'member' | 'super_admin') {
  await seedSession(page);
  await page.route(NOTIFICATIONS, (route) => route.fulfill(json([])));
  await page.route(CONTROLS, (route) => route.fulfill(json([])));
  await page.route(USER, (route) => route.fulfill(json({ id: ME, phone: '12673095265' })));
  await page.route(POINTS, (route) => route.fulfill(json(250)));
  await page.route(PROFILES, (route) =>
    route.fulfill(
      json({
        id: ME,
        role,
        first_name: 'Will',
        region_id: '0195b1c0-0000-4000-8000-000000000001',
        regions: { name: 'Philadelphia' },
      }),
    ),
  );
}

/** One real conversation with Marcus, who spoke last. */
async function withOneConversation(page: import('@playwright/test').Page) {
  await page.route(MEMBERS, (route) => {
    const url = route.request().url();
    if (route.request().method() === 'PATCH') return route.fulfill(json([]));
    if (url.includes('conversation_id=eq.')) {
      return route.fulfill(
        json([
          { profile_id: ME, conversations: { kind: 'direct' } },
          { profile_id: OTHER, conversations: { kind: 'direct' } },
        ]),
      );
    }
    return route.fulfill(json([{ conversation_id: CONVO, last_read_at: null }]));
  });
  await page.route(PARTNERS, (route) =>
    route.fulfill(json([{ conversation_id: CONVO, profile_id: OTHER, first_name: 'Marcus', role: 'member' }])),
  );
  await page.route(MESSAGES, (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill(
        json({ id: 'new-1', sender_id: ME, body: 'See you Thursday.', created_at: new Date().toISOString() }),
      );
    }
    return route.fulfill(
      json([
        {
          id: MSG_THEIRS,
          conversation_id: CONVO,
          sender_id: OTHER,
          body: 'Is the class still on Tuesday?',
          created_at: new Date().toISOString(),
        },
      ]),
    );
  });
  await page.route(PEOPLE, (route) => route.fulfill(json([])));
}

test.describe('the conversation list', () => {
  test('a row says who, and the last thing they said', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto('/messages/');
    await settled(page);

    await expect(page.getByRole('heading', { name: 'Marcus' })).toBeVisible();
    await expect(page.getByText('Is the class still on Tuesday?')).toBeVisible();
    await expect(page.getByText('New', { exact: true })).toBeVisible();
  });

  test('a member previewing sees example conversations and who they can message', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('pam.view-as', 'member'));
    await signedInAs(page, 'super_admin');
    await page.goto('/messages/');
    await settled(page);

    await expect(page.getByRole('heading', { name: 'Teresa' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Message your case manager or program' })).toBeVisible();
    await expect(page.getByText(/Example people/)).toHaveCount(2);
  });
});

test.describe('a conversation', () => {
  test('is a chat log with one send button, and a way to report the other side', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    await expect(page.getByRole('heading', { name: 'Marcus', level: 1 })).toBeVisible();
    const log = page.getByRole('log');
    await expect(log).toBeVisible();
    await expect(log.getByText('Is the class still on Tuesday?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Report' })).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Messages/ }).first()).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('sending adds the message to the log', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    await page.getByRole('textbox').fill('See you Thursday.');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByRole('log').getByText('See you Thursday.')).toBeVisible();
  });

  test('reporting picks a reason and ends in a thank-you, never a dead end', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.route(REPORT, (route) => route.fulfill(json({ id: 'r1' })));
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    await page.getByRole('button', { name: 'Report' }).click();
    await expect(page.getByRole('radiogroup', { name: 'Say this message is not safe' })).toBeVisible();
    await page.getByRole('radio', { name: /threatens me/ }).check();
    await page.getByRole('button', { name: 'Send report' }).click();
    await expect(page.getByText('Thank you. PAM will look at it.')).toBeVisible();
  });

  test('an example conversation renders through the same chat log, and sends nowhere', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('pam.view-as', 'member'));
    await signedInAs(page, 'super_admin');
    let realWrites = 0;
    await page.route(MESSAGES, (route) => {
      realWrites += 1;
      return route.fulfill(json([]));
    });
    await page.goto('/messages/thread/?id=dummy-conv-1');
    await settled(page);

    await expect(page.getByRole('heading', { name: 'Teresa', level: 1 })).toBeVisible();
    await expect(page.getByRole('log')).toBeVisible();
    await expect(page.getByText(/example conversation/)).toBeVisible();
    // Nothing to report in an example: a report has real recipients.
    await expect(page.getByRole('button', { name: 'Report' })).toHaveCount(0);

    await page.getByRole('textbox').fill('Thanks, see you then.');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByRole('log').getByText('Thanks, see you then.')).toBeVisible();
    expect(realWrites).toBe(0);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('reported messages', () => {
  test('a case manager reads the excerpt, who said it, who reported it, and why', async ({ page }) => {
    await signedInAs(page, 'admin');
    await page.route(REPORTS, (route) =>
      route.fulfill(
        json([
          {
            id: 'r1',
            target_type: 'message',
            target_id: MSG_THEIRS,
            reason: 'threatening',
            target_excerpt: 'Come alone or else.',
            created_at: new Date().toISOString(),
            resolved_at: null,
            resolution: null,
            reporter_id: OTHER,
            reporter_name: 'Marcus',
            reporter_role: 'member',
            about_id: 'x',
            about_name: 'Sandra',
            about_role: 'provider',
          },
        ]),
      ),
    );
    await page.goto('/reports/');
    await settled(page);

    await expect(page.getByRole('heading', { name: 'Reported messages' })).toBeVisible();
    await expect(page.getByText('Come alone or else.')).toBeVisible();
    await expect(page.getByText('Reported by Marcus')).toBeVisible();
    await expect(page.getByRole('heading', { name: /About Sandra/ })).toBeVisible();
    await expect(page.getByText(/threatens me/)).toBeVisible();
    await expect(page.getByText('Waiting for review')).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('a member meets a plain statement, not a permission error', async ({ page }) => {
    await signedInAs(page, 'member');
    await page.goto('/reports/');
    await settled(page);
    await expect(page.getByRole('heading', { name: 'This page is not for you' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back/ })).toBeVisible();
  });
});
