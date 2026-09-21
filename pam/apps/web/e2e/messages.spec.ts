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

    // A row, not a card (D-186): the name is the row's link, and the last
    // thing said sits under it with the unread mark at the end.
    await expect(page.getByRole('link', { name: /Marcus/ })).toBeVisible();
    await expect(page.getByText('Is the class still on Tuesday?')).toBeVisible();
    await expect(page.getByText('New', { exact: true })).toBeVisible();
    // A case manager looking at a member: nothing under the name (D-187).
    await expect(page.getByText('Member', { exact: true })).toHaveCount(0);
    // Reported is a section of this screen for a case manager, reached from
    // the title (D-184, D-197): the heading is the switcher.
    await expect(page.getByRole('heading', { level: 1 }).getByRole('button')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New message' })).toBeVisible();
  });

  test('has no help link (A15) — the logo is one tap back to Home, which always has one', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto('/messages/');
    await settled(page);

    await expect(page.getByRole('link', { name: /Help/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'PAM' })).toHaveAttribute('href', '/');
  });

  test('the title switches sections for a case manager, by tap and by keyboard', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.route(REPORTS, (route) => route.fulfill(json([])));
    await page.goto('/messages/');
    await settled(page);

    const title = page.getByRole('heading', { level: 1 }).getByRole('button');
    const box = await title.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
    await title.click();
    await page.getByRole('menuitem', { name: 'Reported' }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Reported/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New message' })).toHaveCount(0);

    // Back by keyboard alone.
    await page.getByRole('heading', { level: 1 }).getByRole('button').focus();
    await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Conversations' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: /Messages/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New message' })).toBeVisible();
  });

  test('"New message" opens a picker with a search box, and picking opens the chat', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.route(PEOPLE, (route) =>
      route.fulfill(
        json([
          { profile_id: OTHER, first_name: 'Marcus', role: 'member' },
          { profile_id: 'a2', first_name: 'Tanya', role: 'member' },
        ]),
      ),
    );
    await page.route('**/rest/v1/rpc/open_direct_conversation*', (route) => route.fulfill(json(CONVO)));
    await page.goto('/messages/');
    await settled(page);

    await page.getByRole('button', { name: 'New message' }).click();
    const sheet = page.getByRole('dialog', { name: 'Who do you want to message?' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('button', { name: /Tanya/ })).toBeVisible();
    await sheet.getByRole('textbox').fill('mar');
    await expect(sheet.getByRole('button', { name: /Tanya/ })).toHaveCount(0);
    await sheet.getByRole('button', { name: /Marcus/ }).click();
    await expect(page).toHaveURL(new RegExp(`/messages/thread/\\?id=${CONVO}`));
  });

  test('a member previewing sees example conversations and who they can message', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('pam.view-as', 'member'));
    await signedInAs(page, 'super_admin');
    await page.goto('/messages/');
    await settled(page);

    await expect(page.getByRole('link', { name: /Teresa/ })).toBeVisible();
    // A member sees who the other person is to them (D-187): the case
    // manager as "Case manager", the program by its name.
    await expect(page.getByRole('link', { name: /Teresa Case manager/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Sandra Example Learning Center/ })).toBeVisible();
    await expect(page.getByText(/Example people/)).toHaveCount(1);
    // No Reported section for a member (D-184): a plain title, no switcher.
    await expect(page.getByRole('heading', { level: 1, name: 'Messages' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 }).getByRole('button')).toHaveCount(0);

    // The picker lists the example cast and a pick opens the example thread.
    await page.getByRole('button', { name: 'New message' }).click();
    const sheet = page.getByRole('dialog', { name: 'Who do you want to message?' });
    await sheet.getByRole('button', { name: /Sandra/ }).click();
    await expect(page).toHaveURL(/dummy-conv-dummy-m1-dummy-p1/);
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
    await expect(page.getByRole('link', { name: 'Back to Messages' })).toBeVisible();
    // No help link on this screen (A14): the way back carries it.
    await expect(page.getByRole('link', { name: /Help/ })).toHaveCount(0);

    // Every control on the thread clears the 48px floor — the send button,
    // the mic and Report are 48px squares now, not a 64px block (A13).
    const controls = page.locator('button:visible, a[href]:visible, input:visible');
    const count = await controls.count();
    for (let i = 0; i < count; i++) {
      const box = await controls.nth(i).boundingBox();
      if (!box) continue;
      const label = (await controls.nth(i).getAttribute('aria-label')) ?? (await controls.nth(i).textContent()) ?? '';
      expect(box.height, `${label.trim()} is ${box.height}px tall`).toBeGreaterThanOrEqual(48);
    }
    const send = await page.getByRole('button', { name: /send/i }).boundingBox();
    expect(send?.width).toBe(48);
    expect(send?.height).toBe(48);
    // The input has no wrapper of its own (A13): what somebody aims at is the
    // composer box, which focuses the editor on a tap anywhere inside it —
    // that box, not the editor's line, is the target that has to clear 48px.
    const composer = await page.locator('.astryx-chat-composer').boundingBox();
    expect(composer?.height).toBeGreaterThanOrEqual(48);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('the header and the composer stay put while the messages scroll', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    // Enough messages to overflow an iPhone SE: the list has to scroll.
    await page.route(MESSAGES, (route) =>
      route.fulfill(
        json(
          Array.from({ length: 30 }, (_, i) => ({
            id: `m-${i}`,
            conversation_id: CONVO,
            sender_id: i % 2 ? ME : OTHER,
            body: `Message number ${i + 1} in a long conversation.`,
            created_at: new Date(Date.now() - (30 - i) * 60_000).toISOString(),
          })),
        ),
      ),
    );
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    const header = page.getByRole('heading', { name: 'Marcus', level: 1 });
    const send = page.getByRole('button', { name: /send/i });
    const before = await header.boundingBox();
    const sendBefore = await send.boundingBox();
    expect(before).not.toBeNull();
    expect(sendBefore).not.toBeNull();

    // The document itself does not scroll; the message area does.
    const last = page.getByRole('log').getByText('Message number 30 in a long conversation.');
    await last.scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 400);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(await header.boundingBox()).toEqual(before);
    expect(await send.boundingBox()).toEqual(sendBefore);

    // The last message sits above the composer, never under it.
    const lastBox = await last.boundingBox();
    expect(lastBox!.y + lastBox!.height).toBeLessThanOrEqual(sendBefore!.y);
  });

  test('the frame reaches the true bottom of the screen — no dead strip under the composer', async ({ page }) => {
    // Will's screenshot, 21 September: the composer sat well above the
    // physical edge, in the space `globals.css` reserves for a HelpBar this
    // screen never draws (A14). `ThreadFrame` is `position: fixed; inset: 0`
    // now, so the frame's own box should exactly match the viewport instead
    // of stopping short.
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    const viewport = page.viewportSize();
    const frame = page.locator('main');
    const box = await frame.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBe(0);
    expect(Math.round(box!.y + box!.height)).toBe(viewport!.height);

    // The composer's own box still ends at or above the frame's bottom edge
    // — it never runs off-screen or under a device's safe area.
    const composer = page.locator('.astryx-chat-composer');
    const composerBox = await composer.boundingBox();
    expect(composerBox).not.toBeNull();
    expect(composerBox!.y + composerBox!.height).toBeLessThanOrEqual(box!.y + box!.height);
  });

  test('the send icon matches the mic icon\'s size (D-192 addendum)', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    const send = page.getByRole('button', { name: /send/i }).locator('svg');
    const mic = page.getByRole('button', { name: 'Speak your message' }).locator('svg');
    const sendBox = await send.boundingBox();
    const micBox = await mic.boundingBox();
    expect(sendBox).not.toBeNull();
    expect(micBox).not.toBeNull();
    // Both are Astryx's 'md' Icon size (20px) — same box, not just close.
    expect(Math.round(sendBox!.width)).toBe(Math.round(micBox!.width));
    expect(Math.round(sendBox!.height)).toBe(Math.round(micBox!.height));
  });

  test('message rows sit close together, and every control still clears 48px', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.route(MESSAGES, (route) =>
      route.fulfill(
        json([
          {
            id: 'm-1',
            conversation_id: CONVO,
            sender_id: OTHER,
            body: 'First message.',
            created_at: new Date(Date.now() - 120_000).toISOString(),
          },
          {
            id: 'm-2',
            conversation_id: CONVO,
            sender_id: ME,
            body: 'Second message.',
            created_at: new Date(Date.now() - 60_000).toISOString(),
          },
        ]),
      ),
    );
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    // `density="compact"` (was `spacious`): Astryx reflects the prop as
    // `data-density` on the log, and the row gap it renders is 8px, not the
    // old 24px. Reading the computed style rather than the bubbles'
    // on-screen distance, which also includes each message's own
    // name/timestamp row and would not isolate the row gap itself.
    const log = page.getByRole('log');
    await expect(log).toHaveAttribute('data-density', 'compact');
    const gap = await log.evaluate((el) => getComputedStyle(el.firstElementChild as Element).gap);
    expect(gap).toBe('8px');

    const first = page.getByText('First message.');
    const second = page.getByText('Second message.');
    const firstBox = await first.boundingBox();
    const secondBox = await second.boundingBox();
    // Still a real, positive gap: two different senders' bubbles never touch.
    expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height);

    // Report — the one 48px control that sits inside a message row — still
    // clears the floor after the tighten.
    const report = page.getByRole('button', { name: 'Report' });
    const reportBox = await report.boundingBox();
    expect(reportBox!.height).toBeGreaterThanOrEqual(48);
    expect(reportBox!.width).toBeGreaterThanOrEqual(48);
  });

  test('tapping into the composer draws no ring; Tab into it does (D-195)', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await expect(editor).toBeFocused();
    const ringOnTap = await editor.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(ringOnTap).toBe('none');
    const frameOnTap = await page.locator('.astryx-chat-composer').evaluate((el) => {
      const body = el.querySelector('[contenteditable="true"]')!.closest('div[class*="astryx"]') as HTMLElement | null;
      return getComputedStyle(body ?? el).outlineStyle;
    });
    expect(frameOnTap).toBe('none');

    // Keyboard focus keeps a visible ring somewhere on the composer (WCAG 2.4.7).
    await page.getByRole('link', { name: 'Back to Messages' }).focus();
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('contenteditable'));
    if (focused === 'true') {
      const ringOnTab = await page.locator('.astryx-chat-composer').evaluate((el) => {
        const all = [el, ...Array.from(el.querySelectorAll('*'))] as HTMLElement[];
        return all.some((node) => getComputedStyle(node).outlineStyle !== 'none' && parseFloat(getComputedStyle(node).outlineWidth) > 0);
      });
      expect(ringOnTab).toBe(true);
    }
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
    await page.goto('/messages/thread/?id=dummy-conv-dummy-m1-dummy-a1');
    await settled(page);

    await expect(page.getByRole('heading', { name: 'Teresa', level: 1 })).toBeVisible();
    // Who they are to you sits beside the name, one row (D-193, D-187).
    const heading = await page.getByRole('heading', { name: 'Teresa', level: 1 }).boundingBox();
    const tag = await page.getByText('Case manager', { exact: true }).last().boundingBox();
    expect(Math.abs(tag!.y + tag!.height / 2 - (heading!.y + heading!.height / 2))).toBeLessThan(12);
    await expect(page.getByRole('log')).toBeVisible();
    // The same thread Teresa's own preview reads, from Jordan's side (D-183).
    await expect(page.getByRole('log').getByText(/room 12/)).toBeVisible();
    // No sentence about it being an example at the top (Will, 21 September);
    // the example-only behaviour is what the rest of this test checks.
    await expect(page.getByText(/example conversation/)).toHaveCount(0);
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

test.describe('an example person', () => {
  test('a case manager preview can message a member from their profile, into an example chat', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('pam.view-as', 'admin'));
    await signedInAs(page, 'super_admin');
    await page.goto('/person/?id=dummy-m4');
    await settled(page);

    await page.getByRole('link', { name: 'Message Aaliyah' }).click();
    await expect(page.getByRole('heading', { name: 'Aaliyah', level: 1 })).toBeVisible();
    // No written thread for this pair: an empty log and a composer.
    await expect(page.getByText('Nothing here yet. Say hello.')).toBeVisible();
    await page.getByRole('textbox').fill('Hi Aaliyah, it is Teresa.');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByRole('log').getByText('Hi Aaliyah, it is Teresa.')).toBeVisible();
  });

  test('the staff side of a conversation is the member side, flipped', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('pam.view-as', 'admin'));
    await signedInAs(page, 'super_admin');
    await page.goto('/messages/');
    await settled(page);
    await expect(page.getByRole('link', { name: /Jordan/ })).toBeVisible();
    await expect(page.getByText('You: One more thing: the class moved to room 12 this week. Same time.')).toBeVisible();
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
    await page.goto('/messages/?show=reported');
    await settled(page);

    // Reported lives inside Messages now (D-184), reached by the bell's row;
    // the title says which section is open (D-197).
    await expect(page.getByRole('heading', { level: 1, name: /Reported/ })).toBeVisible();
    await expect(page.getByText('Come alone or else.')).toBeVisible();
    await expect(page.getByText('Reported by Marcus')).toBeVisible();
    await expect(page.getByRole('heading', { name: /About Sandra/ })).toBeVisible();
    await expect(page.getByText(/threatens me/)).toBeVisible();
    await expect(page.getByText('Waiting for review')).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('a super admin sees Reported and nothing to send, and a preview sees the example set', async ({ page }) => {
    await signedInAs(page, 'super_admin');
    await page.route(REPORTS, (route) => route.fulfill(json([])));
    await page.goto('/messages/');
    await settled(page);

    // D-171: no conversations, no "New message" — Reported only, with the
    // example reports while nothing real has been reported (D-184).
    await expect(page.getByRole('button', { name: 'New message' })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Reported' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 }).getByRole('button')).toHaveCount(0);
    await expect(page.getByText('Can you just give me your home address so I can drop it off.')).toBeVisible();
    await expect(page.getByRole('heading', { name: /About Keisha/ })).toBeVisible();
    await expect(page.getByText(/Example people/)).toBeVisible();
  });

  test('the bell row for a reported message leads to the Reported section', async ({ page }) => {
    await signedInAs(page, 'admin');
    await page.route(NOTIFICATIONS, (route) =>
      route.fulfill(
        json([
          {
            id: 'n2',
            kind: 'message_reported',
            body_key: 'notify.message_reported',
            body_vars: { name: 'Marcus' },
            subject_type: 'report',
            subject_id: 'r1',
            created_at: new Date().toISOString(),
            read_at: null,
          },
        ]),
      ),
    );
    await page.goto('/notifications/');
    await settled(page);
    await expect(page.getByRole('link', { name: 'A message from Marcus was reported' })).toHaveAttribute(
      'href',
      '/messages/?show=reported',
    );
  });
});

test.describe('reported places (D-189)', () => {
  test('a case manager preview sees the example reported places, and a decision clears one', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('pam.view-as', 'admin'));
    await signedInAs(page, 'super_admin');
    await page.route('**/rest/v1/rpc/services_near*', (route) => route.fulfill(json([])));
    await page.route('**/rest/v1/rpc/flagged_services*', (route) => route.fulfill(json([])));
    await page.goto('/places/?filter=reported');
    await settled(page);

    await expect(page.getByRole('button', { name: 'Reported' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: 'Example Workforce Center' })).toBeVisible();
    await expect(page.getByText(/Something here is wrong/)).toBeVisible();
    await page.getByRole('button', { name: 'Keep it' }).first().click();
    await expect(page.getByRole('heading', { name: 'Example Workforce Center' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Example Food Pantry' })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
