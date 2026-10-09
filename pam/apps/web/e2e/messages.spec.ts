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
    await expect(page.getByRole('link', { name: 'Pam' })).toHaveAttribute('href', '/');
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
    const sheet = page.getByRole('dialog', { name: 'New message' });
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
    const sheet = page.getByRole('dialog', { name: 'New message' });
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
    // Reporting is on the ⋯ page now, not under each message (D-213).
    await expect(page.getByRole('button', { name: 'Report' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'More options' })).toHaveAttribute(
      'href',
      `/messages/thread/options/?id=${CONVO}`,
    );
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

    // The room under the composer is inside the conversation's frosted dock
    // (D-396), not a strip of bare page under it: the scroll region runs to
    // the bottom edge, and the composer's box ends 40px above that edge (32px
    // of its own and the dock's 8px; no home-indicator inset here).
    const layout = await page.locator('.astryx-chat-layout').boundingBox();
    expect(Math.round(layout!.y + layout!.height)).toBe(viewport!.height);
    const field = await page.locator('.astryx-chat-composer > div').first().boundingBox();
    expect(Math.round(viewport!.height - (field!.y + field!.height))).toBe(40);
  });

  test('the composer\'s buttons are quiet: mic, photo and an idle send share one grey (D-396)', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    const colour = (name: string | RegExp) =>
      page.getByRole('button', { name }).locator('svg').evaluate((svg) => getComputedStyle(svg).color);
    const mic = await colour('Speak your message');
    expect(await colour('Add a photo')).toBe(mic);
    expect(await colour(/send/i)).toBe(mic);
    // Quieter than the words around them.
    const heading = await page.getByRole('heading', { name: 'Marcus', level: 1 }).evaluate((h) => getComputedStyle(h).color);
    expect(mic).not.toBe(heading);
  });

  test('speaking a long message: the box grows to 8 lines, then keeps the newest words in view (D-397)', async ({ page }) => {
    // A stand-in for the browser's speech recogniser: the test says the
    // words, as final results, the way a phone's would arrive.
    await page.addInitScript(() => {
      type Handler = ((event?: unknown) => void) | null;
      class FakeRecognition {
        lang = '';
        continuous = true;
        interimResults = true;
        onstart: Handler = null;
        onend: Handler = null;
        onresult: Handler = null;
        onerror: Handler = null;
        onnomatch: Handler = null;
        onspeechstart: Handler = null;
        onspeechend: Handler = null;
        start() {
          (window as unknown as { __speech: FakeRecognition }).__speech = this;
          setTimeout(() => this.onstart?.(), 0);
        }
        stop() {
          setTimeout(() => this.onend?.(), 0);
        }
        abort() {
          this.onend?.();
        }
      }
      const w = window as unknown as Record<string, unknown>;
      w.SpeechRecognition = FakeRecognition;
      w.webkitSpeechRecognition = FakeRecognition;
      w.__say = (text: string, isFinal: boolean) => {
        const result = Object.assign([{ transcript: text }], { isFinal });
        (w.__speech as FakeRecognition).onresult?.({ resultIndex: 0, results: [result] });
      };
    });
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    await page.getByRole('button', { name: 'Speak your message' }).click();
    await expect(page.getByRole('button', { name: 'Stop listening' })).toBeVisible();
    const editable = page.locator('.astryx-chat-composer-input [contenteditable="true"]');
    const say = (text: string, isFinal: boolean) =>
      page.evaluate(([words, final]) => (window as unknown as { __say: (t: string, f: boolean) => void }).__say(words, final), [text, isFinal] as const);

    for (let i = 1; i <= 12; i++) {
      await say(`This is sentence number ${i}, long enough to fill a line of the box.`, true);
    }
    await say('and these are the words still being heard', false);

    const box = await editable.evaluate((el) => ({
      height: el.clientHeight,
      lineHeight: parseFloat(getComputedStyle(el).lineHeight),
      gapBelow: el.scrollHeight - el.scrollTop - el.clientHeight,
      overflowing: el.scrollHeight > el.clientHeight,
    }));
    // Grown past the old 4 lines, stopped at 8 (plus the box's own padding).
    expect(box.overflowing).toBe(true);
    expect(box.height).toBeGreaterThan(7 * box.lineHeight);
    expect(box.height).toBeLessThanOrEqual(8 * box.lineHeight + 8);
    // Scrolled to the newest words, not left on an old line.
    expect(box.gapBelow).toBeLessThanOrEqual(1);
    await expect(page.getByText('and these are the words still being heard')).toBeInViewport();
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

    // The ⋯ button that replaced each message's Report (D-213) clears the floor.
    const more = page.getByRole('link', { name: 'More options' });
    const moreBox = await more.boundingBox();
    expect(moreBox!.height).toBeGreaterThanOrEqual(48);
    expect(moreBox!.width).toBeGreaterThanOrEqual(48);
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

    // ⋯ → Report suspicious activity → a reason → sent (D-213).
    await page.getByRole('link', { name: 'More options' }).click();
    await settled(page);
    await page.getByRole('link', { name: 'Report suspicious activity' }).click();
    await settled(page);
    await expect(page.getByRole('radiogroup', { name: 'Say this message is not safe' })).toBeVisible();
    await page.getByRole('radio', { name: /threatens me/ }).check();
    await page.getByRole('button', { name: 'Send report' }).click();
    await expect(page.getByText('Thank you. Pam will look at it.')).toBeVisible();
    // Never a dead end: the way back to the conversation.
    await expect(page.getByRole('link', { name: 'Back to the conversation' }).first()).toBeVisible();
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
    // Who they are to you sits on the line under the name (D-395, was a tag
    // beside it — D-193, D-187): just below it, starting where it starts.
    const heading = await page.getByRole('heading', { name: 'Teresa', level: 1 }).boundingBox();
    const line = await page
      .getByRole('heading', { name: 'Teresa', level: 1 })
      .locator('xpath=../..')
      .getByText('Case manager', { exact: true })
      .boundingBox();
    expect(line!.y).toBeGreaterThanOrEqual(heading!.y + heading!.height - 2);
    expect(line!.y - (heading!.y + heading!.height)).toBeLessThan(8);
    expect(Math.abs(line!.x - heading!.x)).toBeLessThan(2);
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

test.describe('documents in a conversation (D-399)', () => {
  const FILES = '**/storage/v1/object/message-files/**';
  const PDF = { name: 'Lease 2026.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') };
  const docInput = (page: import('@playwright/test').Page) => page.locator('input[type="file"][accept*=".pdf"]');

  test('a picked document shows its name and size, and goes with the message', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    const uploads: string[] = [];
    await page.route(FILES, (route) => {
      uploads.push(route.request().url());
      return route.fulfill(json({ Key: 'message-files/x.pdf' }));
    });
    let inserted: Record<string, unknown> | null = null;
    await page.route(MESSAGES, (route) => {
      if (route.request().method() === 'POST') {
        inserted = route.request().postDataJSON() as Record<string, unknown>;
        return route.fulfill(
          json({
            id: 'new-file',
            sender_id: ME,
            body: null,
            attachment_url: inserted.attachment_url,
            attachment_kind: 'file',
            attachment_name: inserted.attachment_name,
            attachment_bytes: inserted.attachment_bytes,
            created_at: new Date().toISOString(),
          }),
        );
      }
      return route.fulfill(json([]));
    });
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    await expect(page.getByRole('button', { name: 'Add a document' })).toBeVisible();
    await docInput(page).setInputFiles(PDF);
    // Above the box, before it goes: what it is called and what it is.
    await expect(page.getByText('Lease 2026.pdf')).toBeVisible();
    // What it is, in a word — not its format or size (D-409).
    await expect(page.locator('.astryx-chat-composer').getByText('Document', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Take this document out' })).toBeVisible();

    await page.getByRole('button', { name: /send/i }).click();
    await expect.poll(() => inserted).not.toBeNull();
    expect(uploads).toHaveLength(1);
    expect(uploads[0]).toContain(`/message-files/${CONVO}/`);
    expect(inserted).toMatchObject({
      conversation_id: CONVO,
      body: null,
      attachment_kind: 'file',
      attachment_name: 'Lease 2026.pdf',
      attachment_bytes: PDF.buffer.length,
    });
    expect(String(inserted!.attachment_url)).toMatch(new RegExp(`^${CONVO}/[0-9a-f-]+\\.pdf$`));
    // In the conversation: a card that opens it.
    await expect(page.getByRole('button', { name: 'Open Lease 2026.pdf, document' })).toBeVisible();
  });

  test('a file Pam does not take is refused in words, where it would have gone', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    await docInput(page).setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
    const composer = page.locator('.astryx-chat-composer');
    await expect(composer.getByRole('alert')).toContainText("Pam can't send that file");
    await expect(composer.getByRole('alert')).toContainText('Send a photo, a PDF or a Word file.');

    await docInput(page).setInputFiles({ ...PDF, buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
    await expect(composer.getByRole('alert')).toContainText('That file is too big');
    await expect(composer.getByRole('alert')).toContainText('Send one smaller than 10 MB.');
    // Nothing was picked, so there is nothing to send.
    await expect(page.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  test('a document dropped on the conversation is picked, the same as from the button', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    await page.evaluate(() => {
      const target = document.querySelector('.astryx-chat-layout')!;
      const data = new DataTransfer();
      data.items.add(new File(['%PDF-1.4'], 'Dropped letter.pdf', { type: 'application/pdf' }));
      target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }));
      target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }));
    });
    await expect(page.getByText('Dropped letter.pdf')).toBeVisible();
    await expect(page.getByRole('button', { name: /send/i })).toBeEnabled();
  });

  test('a document someone sent is fetched only when tapped, with your own sign-in', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    const downloads: string[] = [];
    await page.route(FILES, (route) => {
      downloads.push(route.request().url());
      return route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4\n%%EOF' });
    });
    await page.route(MESSAGES, (route) =>
      route.fulfill(
        json([
          {
            id: 'their-file',
            conversation_id: CONVO,
            sender_id: OTHER,
            body: 'My resume',
            attachment_url: `${CONVO}/abc.docx`,
            attachment_kind: 'file',
            attachment_name: 'Resume.docx',
            attachment_bytes: 1_258_291,
            created_at: new Date().toISOString(),
          },
        ]),
      ),
    );
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    const card = page.getByRole('button', { name: 'Open Resume.docx, document' });
    await expect(card).toBeAttached();
    expect(downloads).toHaveLength(0);
    const saved = page.waitForEvent('download');
    // A tap lands on the card itself (its button is for a screen reader and a keyboard).
    await page.getByText('Resume.docx', { exact: true }).click();
    expect((await saved).suggestedFilename()).toBe('Resume.docx');
    expect(downloads).toHaveLength(1);
    expect(downloads[0]).toContain(`/message-files/${CONVO}/abc.docx`);
  });

  test('a Google Docs link is a card that opens it in Google, in a new tab', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.route(MESSAGES, (route) =>
      route.fulfill(
        json([
          {
            id: 'their-link',
            conversation_id: CONVO,
            sender_id: OTHER,
            body: 'The schedule: https://docs.google.com/document/d/abc123/edit',
            created_at: new Date().toISOString(),
          },
        ]),
      ),
    );
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    const link = page.getByRole('link', { name: 'Google Doc: opens in Google, in a new tab' });
    await expect(link).toHaveAttribute('href', 'https://docs.google.com/document/d/abc123/edit');
    await expect(link).toHaveAttribute('target', '_blank');
    // Its page icon is Google-Doc blue (D-401): #1a73e8 light, #8ab4f8 dark.
    const blue = await link
      .locator('xpath=ancestor::*[contains(@class,"astryx-clickable-card")][1]')
      .locator('svg')
      .first()
      .evaluate((svg) => getComputedStyle(svg).color);
    expect(['rgb(26, 115, 232)', 'rgb(138, 180, 248)']).toContain(blue);
    // The words keep the link as it was sent.
    await expect(page.getByText('The schedule: https://docs.google.com/document/d/abc123/edit')).toBeVisible();
  });

  test('a conversation still opens before the live database has the document columns (0080)', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.route(MESSAGES, (route) =>
      route.request().url().includes('attachment_name')
        ? route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ code: '42703', message: 'column messages.attachment_name does not exist' }),
          })
        : route.fulfill(
            json([
              {
                id: MSG_THEIRS,
                conversation_id: CONVO,
                sender_id: OTHER,
                body: 'Is the class still on Tuesday?',
                created_at: new Date().toISOString(),
              },
            ]),
          ),
    );
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);
    await expect(page.getByRole('log').getByText('Is the class still on Tuesday?')).toBeVisible();
  });

  test('a conversation whose last message is a document says so in the list', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.route(MESSAGES, (route) =>
      route.fulfill(
        json([
          {
            conversation_id: CONVO,
            sender_id: OTHER,
            body: null,
            attachment_kind: 'file',
            created_at: new Date().toISOString(),
          },
        ]),
      ),
    );
    await page.goto('/messages/');
    await settled(page);
    await expect(page.getByText('Document', { exact: true })).toBeVisible();
  });
});

test.describe('photos and documents, picked or pasted (D-408)', () => {
  // A one-pixel PNG, and the same bytes again under other names.
  const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  ).toString('base64');
  const editable = (page: import('@playwright/test').Page) => page.locator('.astryx-chat-composer-input [contenteditable="true"]');
  const composer = (page: import('@playwright/test').Page) => page.locator('.astryx-chat-composer');

  /** Pastes one file (bytes as base64) into the message box, the way a phone's or computer's paste does. */
  const paste = (page: import('@playwright/test').Page, file: { name: string; type: string; base64: string }) =>
    editable(page).evaluate((el, f) => {
      const bytes = Uint8Array.from(atob(f.base64), (c) => c.charCodeAt(0));
      const data = new DataTransfer();
      data.items.add(new File([bytes], f.name, { type: f.type }));
      el.focus();
      el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }));
    }, file);

  test('the photo button asks for JPEG or PNG — so an iPhone hands its photos over as JPEGs — and the document button for PDF or Word', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    const inputs = page.locator('.astryx-chat-composer input[type="file"]');
    await expect(inputs).toHaveCount(2);
    expect(await inputs.nth(0).getAttribute('accept')).toBe('image/jpeg,image/png');
    const docs = (await inputs.nth(1).getAttribute('accept'))!.split(',');
    expect(docs).toEqual(expect.arrayContaining(['.pdf', '.doc', '.docx', 'application/pdf']));
    expect(docs.some((type) => type.startsWith('image/'))).toBe(false);
  });

  test('a pasted PNG is a photo: seen before it goes, and sent as a JPEG', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    const uploads: string[] = [];
    await page.route('**/storage/v1/object/message-photos/**', (route) => {
      uploads.push(route.request().url());
      return route.fulfill(json({ Key: 'message-photos/x.jpg' }));
    });
    let inserted: Record<string, unknown> | null = null;
    await page.route(MESSAGES, (route) => {
      if (route.request().method() === 'POST') {
        inserted = route.request().postDataJSON() as Record<string, unknown>;
        return route.fulfill(
          json({ id: 'new-photo', sender_id: ME, body: null, attachment_url: inserted.attachment_url, attachment_kind: 'photo', created_at: new Date().toISOString() }),
        );
      }
      return route.fulfill(json([]));
    });
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    await paste(page, { name: 'image.png', type: 'image/png', base64: PNG });
    await expect(composer(page).getByRole('img', { name: 'The photo you picked' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Take this photo out' })).toBeVisible();
    // Nothing went into the box as words.
    await expect(editable(page)).toHaveText('');

    await page.getByRole('button', { name: /send/i }).click();
    await expect.poll(() => inserted).not.toBeNull();
    expect(uploads).toHaveLength(1);
    expect(uploads[0]).toMatch(new RegExp(`/message-photos/${CONVO}/[0-9a-f-]+\\.jpg$`));
    expect(inserted).toMatchObject({ conversation_id: CONVO, attachment_kind: 'photo' });
  });

  test('a pasted PDF or Word file is a document, the same as from the button; pasted words are still words', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    await paste(page, { name: 'Pay stub.pdf', type: 'application/pdf', base64: Buffer.from('%PDF-1.4\n%%EOF').toString('base64') });
    await expect(page.getByText('Pay stub.pdf')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Take this document out' })).toBeVisible();

    await paste(page, {
      name: 'Resume.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      base64: Buffer.from('PK').toString('base64'),
    });
    await expect(page.getByText('Resume.docx')).toBeVisible();
    await expect(page.getByText('Pay stub.pdf')).toHaveCount(0);

    await editable(page).evaluate((el) => {
      const data = new DataTransfer();
      data.setData('text/plain', 'See you at 3');
      el.focus();
      el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }));
    });
    await expect(editable(page)).toHaveText('See you at 3');
    await expect(page.getByText('Resume.docx')).toBeVisible();
  });

  test('anything else is refused in words: a GIF, a WebP, a photo that will not open, an iPhone photo this browser cannot read', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);
    const alert = composer(page).getByRole('alert');
    const says = async (title: string, hint: string) => {
      await expect(alert).toContainText(title);
      await expect(alert).toContainText(hint);
    };

    await paste(page, { name: 'dance.gif', type: 'image/gif', base64: PNG });
    await says("Pam can't send that file", 'Send a photo, a PDF or a Word file.');
    await paste(page, { name: 'photo.webp', type: 'image/webp', base64: PNG });
    await says("Pam can't send that file", 'Send a photo, a PDF or a Word file.');
    await paste(page, { name: 'notes.txt', type: 'text/plain', base64: Buffer.from('hello').toString('base64') });
    await says("Pam can't send that file", 'Send a photo, a PDF or a Word file.');

    await paste(page, { name: 'broken.jpg', type: 'image/jpeg', base64: Buffer.from('not a picture').toString('base64') });
    await says("That photo couldn't be opened", 'Try another one.');

    // Chromium has no HEIC decoder; Safari does, and would take it.
    await paste(page, { name: 'IMG_0412.HEIC', type: 'image/heic', base64: Buffer.from('....ftypheic').toString('base64') });
    await says("This browser can't open that iPhone photo", 'Try sending it from your phone.');

    // Nothing was picked, so there is nothing to send.
    await expect(page.getByRole('button', { name: /send/i })).toBeDisabled();
    // And a good one after a refusal clears the words.
    await paste(page, { name: 'image.png', type: 'image/png', base64: PNG });
    await expect(composer(page).getByRole('img', { name: 'The photo you picked' })).toBeVisible();
    await expect(alert).toHaveCount(0);
  });
});

test.describe('a file Pam cannot take: the alert banner shakes (D-409)', () => {
  const composer = (page: import('@playwright/test').Page) => page.locator('.astryx-chat-composer');
  const pasteGif = (page: import('@playwright/test').Page, name = 'dance.gif') =>
    page.locator('.astryx-chat-composer-input [contenteditable="true"]').evaluate((el, n) => {
      const data = new DataTransfer();
      data.items.add(new File(['GIF89a'], n, { type: 'image/gif' }));
      el.focus();
      el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }));
    }, name);
  const motion = (page: import('@playwright/test').Page) =>
    page.locator('[data-refusal]').evaluate((el) => {
      const s = getComputedStyle(el);
      return { name: s.animationName, ms: parseFloat(s.animationDuration) * 1000 };
    });

  test('it is the warning banner, in the box, with a 48px way to close it', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    await pasteGif(page);
    const banner = composer(page).locator('.astryx-banner');
    await expect(banner).toHaveAttribute('data-status', 'warning');
    // Announced as an alert, and only once: the banner is the alert.
    await expect(composer(page).getByRole('alert')).toHaveCount(1);
    await expect(composer(page).getByRole('alert')).toContainText("Pam can't send that file");
    const close = composer(page).getByRole('button', { name: 'Close this message' });
    const box = (await close.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(48);
    // It fits the box: nothing sticks out at the sides.
    const frame = (await composer(page).boundingBox())!;
    const b = (await banner.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(frame.x - 1);
    expect(b.x + b.width).toBeLessThanOrEqual(frame.x + frame.width + 1);

    await close.click();
    await expect(composer(page).getByRole('alert')).toHaveCount(0);
  });

  test.describe('with motion allowed', () => {
    test.use({ reducedMotion: 'no-preference' });

    test('it shakes once, quickly — and again for the next wrong file', async ({ page }) => {
      await signedInAs(page, 'admin');
      await withOneConversation(page);
      await page.goto(`/messages/thread/?id=${CONVO}`);
      await settled(page);

      await pasteGif(page);
      const first = await motion(page);
      expect(first.name).not.toBe('none');
      expect(first.ms).toBeGreaterThan(0);
      expect(first.ms).toBeLessThanOrEqual(500);
      const before = await page.locator('[data-refusal]').elementHandle();

      // A second wrong file is a new banner, so it shakes (and is announced) again.
      await pasteGif(page, 'again.gif');
      await expect.poll(() => before!.evaluate((el) => el.isConnected)).toBe(false);
      expect((await motion(page)).name).not.toBe('none');
    });
  });

  test('with reduced motion it does not shake', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);

    await pasteGif(page);
    await expect(composer(page).getByRole('alert')).toBeVisible();
    expect((await motion(page)).name).toBe('none');
  });
});

test.describe('the conversation, drawn closer (D-400, D-401)', () => {
  // A one-pixel PNG: what a stored photo downloads as here.
  const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );
  const withAPhoto = async (page: import('@playwright/test').Page) => {
    await page.route('**/storage/v1/object/message-photos/**', (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: PNG }),
    );
    await page.route(MESSAGES, (route) =>
      route.fulfill(
        json([
          {
            id: 'their-photo',
            conversation_id: CONVO,
            sender_id: OTHER,
            body: 'Is this the one?',
            attachment_url: `${CONVO}/stop.jpg`,
            attachment_kind: 'photo',
            created_at: new Date().toISOString(),
          },
        ]),
      ),
    );
  };

  test('who they are stays on one line under the name, however long the program', async ({ page }) => {
    await signedInAs(page, 'member');
    await withOneConversation(page);
    await page.route(PARTNERS, (route) =>
      route.fulfill(
        json([
          {
            conversation_id: CONVO,
            profile_id: OTHER,
            first_name: 'Renee',
            role: 'provider',
            program_name: 'Example Food Pantry of North Philadelphia and the Neighborhoods Around It',
          },
        ]),
      ),
    );
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);
    const line = page.getByText(/^Program lead at Example Food Pantry/);
    const box = await line.boundingBox();
    expect(box!.height).toBeLessThan(24);
    expect(await line.evaluate((el) => getComputedStyle(el).textOverflow)).toBe('ellipsis');
  });

  test('messages blur and fade under the header instead of meeting it at a line', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);
    const fade = await page.evaluate(() => {
      const heading = document.querySelector('main h1')!;
      const top = heading.closest('main')!.firstElementChild as HTMLElement;
      const layer = [...top.children].at(-1) as HTMLElement;
      const style = getComputedStyle(layer);
      return {
        hidden: layer.getAttribute('aria-hidden'),
        blur: style.backdropFilter,
        mask: style.maskImage || style.webkitMaskImage,
        startsAtHeaderEnd: Math.abs(layer.getBoundingClientRect().top - top.getBoundingClientRect().bottom) < 1,
        overConversation:
          layer.getBoundingClientRect().bottom > document.querySelector('.astryx-chat-layout')!.getBoundingClientRect().top,
      };
    });
    expect(fade).toMatchObject({ hidden: 'true', blur: 'blur(12px)', startsAtHeaderEnd: true, overConversation: true });
    expect(fade.mask).toContain('linear-gradient');
  });

  test('the send button hugs the box\'s rounder bottom corner; the mic sits nearer its own', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);
    const box = page.locator('.astryx-chat-composer > div').first();
    const shell = (await box.boundingBox())!;
    const send = (await page.getByRole('button', { name: /send/i }).boundingBox())!;
    const mic = (await page.getByRole('button', { name: 'Speak your message' }).boundingBox())!;
    // 8px in from the box's outer edge, border included, on both sides.
    expect(Math.round(shell.x + shell.width - (send.x + send.width))).toBe(8);
    expect(Math.round(shell.y + shell.height - (send.y + send.height))).toBe(8);
    expect(Math.round(mic.x - shell.x)).toBe(8);
    expect(Math.round(shell.y + shell.height - (mic.y + mic.height))).toBe(8);
    expect(await box.evaluate((el) => getComputedStyle(el).borderBottomRightRadius)).toBe('32px');
    expect(await box.evaluate((el) => getComputedStyle(el).borderTopRightRadius)).not.toBe('32px');
  });

  test('a photo sits in an even rim, with room before the words under it', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await withAPhoto(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);
    const photo = page.getByRole('button', { name: 'A photo from Marcus' });
    await expect(photo).toBeVisible();
    const p = (await photo.boundingBox())!;
    const bubble = (await photo.locator('xpath=ancestor::*[contains(@class,"astryx-chat-message-bubble")][1]').boundingBox())!;
    const words = (await page.getByText('Is this the one?').boundingBox())!;
    expect(Math.round(p.y - bubble.y)).toBe(Math.round(p.x - bubble.x));
    expect(Math.round(p.x - bubble.x)).toBe(8);
    expect(Math.round(words.y - (p.y + p.height))).toBeGreaterThanOrEqual(12);
  });

  test('a photo opens on near-black, with a round close button you can see', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await withAPhoto(page);
    await page.goto(`/messages/thread/?id=${CONVO}`);
    await settled(page);
    await page.getByRole('button', { name: 'A photo from Marcus' }).click();
    const dialog = page.locator('dialog.astryx-lightbox');
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0.9)');
    const close = dialog.locator('.astryx-button').first();
    const look = await close.evaluate((el) => {
      const style = getComputedStyle(el);
      const svg = el.querySelector('svg')!;
      return {
        width: el.getBoundingClientRect().width,
        radius: style.borderRadius,
        border: style.borderTopWidth,
        background: style.backgroundColor,
        icon: svg.getBoundingClientRect().width,
        iconColor: getComputedStyle(svg).color,
      };
    });
    expect(look).toMatchObject({ width: 48, radius: '50%', border: '1px', background: 'rgb(43, 43, 43)', icon: 24 });
    expect(look.iconColor).toBe('rgb(255, 255, 255)');
  });
});

test.describe('stuff shared, in one list (D-402, D-407)', () => {
  const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );
  const at = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString();
  const LONG = 'Marcus Johnson resume for the warehouse job at the North Philadelphia distribution center.docx';

  async function picturesServed(page: import('@playwright/test').Page) {
    for (const bucket of ['message-photos', 'link-previews']) {
      await page.route(`**/storage/v1/object/${bucket}/**`, (route) =>
        route.fulfill({ status: 200, contentType: 'image/png', body: PNG }),
      );
    }
  }

  test('the ⋯ page leads to Stuff shared: one flat list, newest first, who and when at the end', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await picturesServed(page);
    await page.route('**/rest/v1/message_link_previews*', (route) =>
      route.fulfill(
        json([{ message_id: 'l1', title: 'Free resume workshop', site: 'Example Library', image_path: `${CONVO}/l1.png` }]),
      ),
    );
    let asked = 0;
    await page.route('**/functions/v1/link-preview', (route) => {
      asked += 1;
      return route.fulfill(json({ made: 0 }));
    });
    await page.route(MESSAGES, (route) =>
      route.fulfill(
        json([
          { id: 'p1', conversation_id: CONVO, sender_id: OTHER, body: null, attachment_url: `${CONVO}/a.jpg`, attachment_kind: 'photo', created_at: at(50) },
          { id: 't1', conversation_id: CONVO, sender_id: ME, body: 'Thanks', created_at: at(40) },
          { id: 'f1', conversation_id: CONVO, sender_id: ME, body: null, attachment_url: `${CONVO}/b.pdf`, attachment_kind: 'file', attachment_name: 'Lease.pdf', attachment_bytes: 245_760, created_at: at(30) },
          { id: 'g1', conversation_id: CONVO, sender_id: OTHER, body: 'https://docs.google.com/document/d/x/edit', created_at: at(20) },
          { id: 'l1', conversation_id: CONVO, sender_id: OTHER, body: 'Saturday: https://example-library.org/workshop', created_at: at(15) },
          { id: 'p2', conversation_id: CONVO, sender_id: ME, body: 'Mine', attachment_url: `${CONVO}/c.jpg`, attachment_kind: 'photo', created_at: at(10) },
        ]),
      ),
    );
    await page.goto(`/messages/thread/options/?id=${CONVO}`);
    await settled(page);
    await page.getByRole('link', { name: 'Stuff shared' }).click();
    await expect(page).toHaveURL(new RegExp(`/messages/thread/files/\\?id=${CONVO}`));
    await expect(page.getByRole('heading', { name: 'Stuff shared', level: 1 })).toBeVisible();

    // One list — no sections, no carousel — newest first.
    const list = page.getByRole('list', { name: 'Stuff shared' });
    const rows = list.getByRole('listitem');
    await expect(rows).toHaveCount(5);
    await expect(page.getByRole('region')).toHaveCount(0);
    await expect(rows.nth(0)).toContainText('Mine');
    await expect(rows.nth(1)).toContainText('Free resume workshop');
    await expect(rows.nth(2)).toContainText('Google Doc');
    await expect(rows.nth(3)).toContainText('Lease.pdf');
    await expect(rows.nth(4)).toContainText('Photo');

    // Who over when, at the end of the row where a chevron would be.
    await expect(rows.nth(0)).toContainText('You');
    await expect(rows.nth(1)).toContainText('Marcus');
    const name = (await rows.nth(3).getByText('Lease.pdf').boundingBox())!;
    const who = (await rows.nth(3).getByText('You', { exact: true }).boundingBox())!;
    expect(who.x).toBeGreaterThan(name.x + name.width);

    // Each row says it all to a screen reader, who and when included.
    await expect(page.getByRole('button', { name: /^Mine Photo, Sent by You, / })).toBeVisible();
    // What each thing is, in a word: Photo, Document or Link (D-409).
    const link = page.getByRole('link', { name: /^Free resume workshop Link, Sent by Marcus, / });
    await expect(link).toHaveAttribute('href', 'https://example-library.org/workshop');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(page.getByRole('link', { name: /^Google Doc Document, Sent by Marcus, / })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Lease\.pdf Document, Sent by You, / })).toBeVisible();
    await expect(page.getByText(/kB|PDF ·|Example Library/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Photo Sent by Marcus, / })).toBeVisible();

    // The link's picture came from Pam's storage; nothing was asked of the server.
    await expect(rows.nth(1).locator('img')).toHaveCount(1);
    expect(asked).toBe(0);

    await page.getByRole('button', { name: /Mine.*Photo/ }).click();
    await expect(page.locator('dialog.astryx-lightbox')).toBeVisible();
  });

  test('an older link with no preview asks Pam\'s server once, then shows it', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await picturesServed(page);
    let made = false;
    const bodies: unknown[] = [];
    await page.route('**/rest/v1/message_link_previews*', (route) =>
      route.fulfill(json(made ? [{ message_id: 'l1', title: 'Route 47 bus times', site: 'Example Transit', image_path: null }] : [])),
    );
    await page.route('**/functions/v1/link-preview', (route) => {
      bodies.push(route.request().postDataJSON());
      made = true;
      return route.fulfill(json({ made: 1 }));
    });
    await page.route(MESSAGES, (route) =>
      route.fulfill(json([{ id: 'l1', conversation_id: CONVO, sender_id: ME, body: 'https://example-transit.org/route-47', created_at: at(5) }])),
    );
    await page.goto(`/messages/thread/files/?id=${CONVO}`);
    await settled(page);
    await expect(page.getByText('Route 47 bus times')).toBeVisible();
    expect(bodies).toEqual([{ message_ids: ['l1'] }]);
  });

  test.describe('with motion allowed', () => {
    // The rest of the suite runs with reduced motion (playwright.config).
    test.use({ reducedMotion: 'no-preference' });
    test('a name too long for one line slides to show its end, once; a short one stays still', async ({ page }) => {
      await signedInAs(page, 'admin');
      await withOneConversation(page);
      await page.route(MESSAGES, (route) =>
        route.fulfill(
          json([
            { id: 'f1', conversation_id: CONVO, sender_id: ME, body: null, attachment_url: `${CONVO}/r.docx`, attachment_kind: 'file', attachment_name: LONG, attachment_bytes: 48_128, created_at: at(30) },
            { id: 'f2', conversation_id: CONVO, sender_id: ME, body: null, attachment_url: `${CONVO}/b.pdf`, attachment_kind: 'file', attachment_name: 'Lease.pdf', attachment_bytes: 1000, created_at: at(20) },
          ]),
        ),
      );
      await page.goto(`/messages/thread/files/?id=${CONVO}`);
      await settled(page);
      const long = page.locator('[data-marquee]', { hasText: LONG });
      const short = page.locator('[data-marquee]', { hasText: 'Lease.pdf' });
      // One line, whatever the length.
      const box = (await long.locator('xpath=..').boundingBox())!;
      expect(box.height).toBeLessThan(30);
      await expect(short).toHaveAttribute('data-marquee', 'fits');
      await expect(long).toHaveAttribute('data-marquee', 'moving');
      const animation = await long.evaluate((el) => {
        const s = getComputedStyle(el);
        return { name: s.animationName, ms: parseFloat(s.animationDuration) * 1000, shift: s.getPropertyValue('--pam-marquee-shift') };
      });
      expect(animation.name).not.toBe('none');
      expect(animation.ms).toBeLessThanOrEqual(5000);
      expect(parseFloat(animation.shift)).toBeLessThan(0);
      // It plays once and stops, cut off again (WCAG 2.2.2: under five seconds, no loop).
      await expect(long).toHaveAttribute('data-marquee', 'cut', { timeout: 8000 });
    });
  });

  test('with reduced motion, a long name never moves', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.route(MESSAGES, (route) =>
      route.fulfill(
        json([{ id: 'f1', conversation_id: CONVO, sender_id: ME, body: null, attachment_url: `${CONVO}/r.docx`, attachment_kind: 'file', attachment_name: LONG, attachment_bytes: 48_128, created_at: at(30) }]),
      ),
    );
    await page.goto(`/messages/thread/files/?id=${CONVO}`);
    await settled(page);
    const long = page.locator('[data-marquee]', { hasText: LONG });
    await expect(long).toHaveAttribute('data-marquee', 'cut');
    await page.waitForTimeout(1500);
    await expect(long).toHaveAttribute('data-marquee', 'cut');
  });

  test('a conversation with nothing shared says so', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
    await page.goto(`/messages/thread/files/?id=${CONVO}`);
    await settled(page);
    await expect(page.getByText(/^Nothing yet\. Photos, documents and links sent in this conversation will be here/)).toBeVisible();
  });
});


test.describe('the jump-to-newest button, with motion on (D-398)', () => {
  // The rest of the suite runs with reduced motion; this is where the
  // button's coming and going is seen at all.
  test.use({ reducedMotion: 'no-preference' });

  const LABEL = 'Jump to the newest message';
  // Samples the button every frame for a while: its scale and opacity, or
  // `gone` once it is out of the page.
  const watch = (page: import('@playwright/test').Page, ms: number, tap = false) =>
    page.evaluate(
      async ([label, duration, shouldTap]) => {
        const find = () => document.querySelector<HTMLElement>(`button[aria-label="${label}"]`);
        if (shouldTap) find()!.click();
        const frames: { gone: boolean; scale: number; opacity: number }[] = [];
        const start = performance.now();
        while (performance.now() - start < duration) {
          await new Promise((done) => requestAnimationFrame(done));
          const el = find();
          if (!el) {
            frames.push({ gone: true, scale: 0, opacity: 0 });
            continue;
          }
          const style = getComputedStyle(el);
          const matrix = new DOMMatrix(style.transform === 'none' ? undefined : style.transform);
          frames.push({ gone: false, scale: matrix.a, opacity: Number(style.opacity) });
        }
        return frames;
      },
      [LABEL, ms, tap] as const,
    );

  test('it grows in as you scroll up, and swells then fades when tapped', async ({ page }) => {
    await signedInAs(page, 'admin');
    await withOneConversation(page);
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
    await expect(page.getByRole('button', { name: LABEL })).toHaveCount(0);

    // Scroll up: it arrives smaller and see-through, and settles whole.
    const log = page.getByRole('log');
    await log.hover();
    await page.mouse.wheel(0, -600);
    const arriving = await watch(page, 500);
    const seen = arriving.filter((f) => !f.gone);
    expect(seen.some((f) => f.scale < 0.95 && f.opacity < 1)).toBe(true);
    expect(seen.at(-1)).toMatchObject({ scale: 1, opacity: 1 });

    // Tapped: bigger than itself first, then fading, then gone.
    const leaving = await watch(page, 600, true);
    const before = leaving.filter((f) => !f.gone);
    expect(Math.max(...before.map((f) => f.scale))).toBeGreaterThan(1.05);
    expect(before.some((f) => f.scale > 1 && f.opacity < 0.5)).toBe(true);
    // Once it starts to fade it only fades: it never pops back in while the
    // conversation runs down to the newest message.
    const fading = before.slice(before.findIndex((f) => f.opacity < 1));
    expect(fading.every((f, i) => i === 0 || f.opacity <= fading[i - 1]!.opacity + 0.01)).toBe(true);
    expect(leaving.at(-1)!.gone).toBe(true);

    // And the conversation is at its newest message.
    await expect(log.getByText('Message number 30 in a long conversation.')).toBeInViewport();

    // Scroll up again and it comes back.
    await page.mouse.wheel(0, -600);
    await expect(page.getByRole('button', { name: LABEL })).toBeVisible();
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
