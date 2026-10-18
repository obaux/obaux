import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * Message Pam, the team's side (card a100, D-605; Dot's x6, b5, b6): in a person's Pam conversation the team has Saved replies
 * (a pick fills the box, only Send sends it) and its own ⋯ (Close or Reopen, and what was shared; no Report, no Block). Pam
 * writes first to a person from Everyone, or to each lead of a program; a program with nobody running it says so and offers no
 * composer. Pam's hours are set on their own screen, with the out-of-hours reply as people get it. Supabase is stubbed.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const ASKER = 'a0000000-0000-4000-8000-0000000000c1';
const PAM_C = 'c0c0c0c0-0000-4000-8000-00000000a002';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

interface World {
  readonly status?: 'open' | 'closed';
  readonly hasLead?: boolean;
  readonly existing?: boolean;
  readonly locale?: string;
  /** Pam writing first fails once: a network failure, or a refusal the database gives by name. */
  readonly failStart?: 'error' | 'NOT_ALLOWED' | 'PAM_OFF';
}

async function team(page: Page, { status = 'open', hasLead = true, existing = false, locale, failStart }: World = {}) {
  const calls: { fn: string; args: unknown }[] = [];
  const posts: unknown[] = [];
  let threadStatus = status;
  await page.addInitScript(([userId, code]) => {
    const session = { access_token: 't', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: userId, aud: 'authenticated', role: 'authenticated' } };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
    if (code) window.localStorage.setItem('pam.locale', code);
  }, [ME, locale ?? null] as const);
  await page.route('**/rest/v1/**', (route) => route.fulfill(json([])));
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(json({ id: ME, role: 'super_admin', first_name: 'Will', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', preferred_language: locale ?? null })),
  );
  await page.route('**/rest/v1/rpc/pam_status*', (route) =>
    route.fulfill(json([{ live: true, hours_tz: 'America/New_York', hours_days: [1, 2, 3, 4, 5], hours_open: '09:00:00', hours_close: '17:00:00', open_now: true, next_open: null }])),
  );
  await page.route('**/rest/v1/rpc/pam_inbox*', (route) =>
    route.fulfill(
      json(
        existing || page.url().includes('/messages/thread') || page.url().includes('/pam/thread')
          ? [{ conversation_id: PAM_C, asker_id: ASKER, first_name: 'Aaliyah', role: 'member', region_name: 'Philadelphia', program_name: null, status: threadStatus, last_message_at: new Date().toISOString(), last_from: 'asker', waiting_since: new Date().toISOString(), preview: 'How do I change my city?' }]
          : [],
      ),
    ),
  );
  // The team is not a member of the person's conversation: the one member it sees is the person.
  await page.route('**/rest/v1/conversation_members*', (route) => {
    if (route.request().method() === 'PATCH') return route.fulfill(json([]));
    if (route.request().url().includes('conversation_id=eq.')) return route.fulfill(json([{ profile_id: ASKER, conversations: { kind: 'support' } }]));
    return route.fulfill(json([]));
  });
  await page.route('**/rest/v1/messages*', (route) => {
    if (route.request().method() === 'POST') {
      posts.push(route.request().postDataJSON());
      return route.fulfill(json({}));
    }
    return route.fulfill(
      json([
        // Pam's welcome, from no person (system_key), then the person's question.
        { id: 'w', conversation_id: PAM_C, sender_id: null, system_key: 'pam.welcome', system_vars: null, body: '', attachment_url: null, attachment_kind: null, created_at: new Date(Date.now() - 60_000).toISOString() },
        { id: 'q', conversation_id: PAM_C, sender_id: ASKER, system_key: null, system_vars: null, body: 'How do I change my city?', attachment_url: null, attachment_kind: null, created_at: new Date().toISOString() },
      ]),
    );
  });
  const rpc = (fn: string, answer: () => unknown) =>
    page.route(`**/rest/v1/rpc/${fn}*`, (route) => {
      calls.push({ fn, args: route.request().postDataJSON() });
      return route.fulfill(json(answer()));
    });
  await rpc('pam_set_thread_status', () => {
    threadStatus = threadStatus === 'open' ? 'closed' : 'open';
    return null;
  });
  await rpc('pam_program_has_lead', () => hasLead);
  let startFailed = false;
  await page.route('**/rest/v1/rpc/pam_start_conversation*', (route) => {
    calls.push({ fn: 'pam_start_conversation', args: route.request().postDataJSON() });
    if (failStart && !startFailed) {
      startFailed = true;
      return failStart === 'error'
        ? route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
        : route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'P0001', message: failStart }) });
    }
    return route.fulfill(json(PAM_C));
  });
  await rpc('pam_start_program_conversation', () => 2);
  await rpc('pam_set_hours', () => null);
  return { calls, posts };
}

test.describe("Message Pam, the team's side (card a100)", () => {
  test('a saved reply fills the box and nothing is sent until Send', async ({ page }) => {
    const server = await team(page);
    await page.goto(`/messages/thread/?id=${PAM_C}&from=pam`);
    await settled(page);
    await expect(page.getByRole('heading', { name: 'Aaliyah', level: 1 })).toBeVisible();
    // Opened from Messages to Pam, Back goes there, not to Messages (Iris P6).
    await expect(page.getByRole('link', { name: 'Back to Messages to Pam' }).or(page.getByRole('link', { name: 'Messages to Pam' }))).toHaveAttribute('href', '/pam/messages/');
    await page.getByRole('button', { name: 'Saved replies' }).click();
    const sheet = page.getByRole('dialog', { name: 'Saved replies' });
    await expect(sheet.getByRole('button')).toHaveCount(3);
    await sheet.getByText('Your guide is the best person for this.', { exact: false }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page.getByRole('textbox')).toHaveText('Your guide is the best person for this. You can write to them in Messages.');
    expect(server.posts).toHaveLength(0);
  });

  // Iris T2 (pass 2): a saved reply replaced what was typed, and focus did not come back to the box.
  test('a saved reply goes in after what was already typed, and the box has focus again', async ({ page }) => {
    const server = await team(page);
    await page.goto(`/messages/thread/?id=${PAM_C}&from=pam`);
    await settled(page);
    const box = page.getByRole('textbox');
    await box.click();
    await page.keyboard.type('Hi Aaliyah,');
    await page.getByRole('button', { name: 'Saved replies' }).click();
    await page.getByRole('dialog', { name: 'Saved replies' }).getByText('Your guide is the best person for this.', { exact: false }).click();
    await expect(box).toHaveText('Hi Aaliyah, Your guide is the best person for this. You can write to them in Messages.');
    await expect(box).toBeFocused();
    expect(server.posts).toHaveLength(0);
  });

  // Iris W6 (pass 1): Pam's welcome showed as the team's own message, "You", in the green bubble on the right.
  test("Pam's welcome reads as Pam's, on the person's side, never as the team's own", async ({ page }) => {
    await team(page);
    await page.goto(`/messages/thread/?id=${PAM_C}&from=pam`);
    await settled(page);
    const welcome = page.getByRole('article').filter({ hasText: 'If you need help with anything, reply here.' });
    await expect(welcome).toHaveCount(1);
    await expect(welcome).toHaveAccessibleName(/^Pam, /);
    await expect(page.getByRole('article', { name: /^You, / })).toHaveCount(0);
  });

  test("the team replies as Pam, with photos only: no document button", async ({ page }) => {
    await team(page);
    await page.goto(`/messages/thread/?id=${PAM_C}&from=pam`);
    await settled(page);
    await expect(page.getByRole('textbox')).toHaveAccessibleName('Reply as Pam');
    await expect(page.getByRole('button', { name: 'Add a photo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add a document' })).toHaveCount(0);
  });

  // Iris W5 (pass 1, on 647dd0d3): the team's ⋯ opened the ordinary Options, with Report and Block. Settled: neither, on a Pam conversation.
  test("the team's ⋯ is its own: Close, then Reopen, and Files; no Report, no Block (W5)", async ({ page }) => {
    const server = await team(page);
    await page.goto(`/messages/thread/?id=${PAM_C}&from=pam`);
    await settled(page);
    const more = page.getByRole('link', { name: 'More options' });
    await expect(more).toHaveAttribute('href', `/pam/thread/options/?id=${PAM_C}`);
    await more.click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Stuff shared' })).toHaveAttribute('href', `/messages/thread/files/?id=${PAM_C}`);
    await expect(page.getByText(/Report/)).toHaveCount(0);
    await expect(page.getByText(/Block/)).toHaveCount(0);
    await page.getByRole('button', { name: 'Close conversation' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Closed.' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reopen conversation' })).toBeVisible();
    expect(server.calls[0]).toEqual({ fn: 'pam_set_thread_status', args: { p_conversation: PAM_C, p_status: 'closed' } });
    await page.getByRole('button', { name: 'Reopen conversation' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Reopened.' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to the conversation' })).toHaveAttribute(
      'href',
      `/messages/thread/?id=${PAM_C}&from=pam`,
    );
  });

  test('Pam writes first to a person: the empty conversation, then the thread it started', async ({ page }) => {
    const server = await team(page);
    await page.goto(`/pam/start/?profile=${ASKER}&name=Aaliyah`);
    await settled(page);
    await expect(page.getByRole('heading', { name: 'Aaliyah', level: 1 })).toBeVisible();
    // Words only before there is a conversation.
    await expect(page.getByRole('textbox')).toHaveAccessibleName('Write as Pam');
    await expect(page.getByRole('button', { name: 'Add a photo' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Add a document' })).toHaveCount(0);
    await page.getByRole('textbox').fill('Hi Aaliyah, your city is fixed.');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page).toHaveURL(new RegExp(`/messages/thread/\\?id=${PAM_C}&from=pam`));
    expect(server.calls.find((c) => c.fn === 'pam_start_conversation')?.args).toEqual({ p_profile: ASKER, p_body: 'Hi Aaliyah, your city is fixed.' });
  });

  // Iris T1 and T6 (pass 2, on 1b67f588): a failure emptied the box and said so in small grey text.
  test('when Pam writing first fails, the words stay as "Not sent" with Try again, under an error card, and Try again sends them', async ({ page }) => {
    const server = await team(page, { failStart: 'error' });
    await page.goto(`/pam/start/?profile=${ASKER}&name=Aaliyah`);
    await settled(page);
    await page.getByRole('textbox').fill('Hi Aaliyah, your city is fixed.');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByText('Hi Aaliyah, your city is fixed.')).toBeVisible();
    await expect(page.getByText('Not sent', { exact: true })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'Something went wrong' })).toBeVisible();
    await page.getByRole('button', { name: 'Not sent. Try again.' }).click();
    await expect(page).toHaveURL(new RegExp(`/messages/thread/\\?id=${PAM_C}&from=pam`));
    expect(server.calls.filter((c) => c.fn === 'pam_start_conversation')).toHaveLength(2);
  });

  // Iris T3: a refusal by name is said calmly, without "Try again" in the words.
  for (const [code, line] of [['NOT_ALLOWED', "You can't message the Pam team as Pam."], ['PAM_OFF', 'Message Pam is off.']] as const) {
    test(`a ${code} refusal says so in one calm line: no error card, no Try again`, async ({ page }) => {
      await team(page, { failStart: code });
      await page.goto(`/pam/start/?profile=${ASKER}&name=Sam`);
      await settled(page);
      await page.getByRole('textbox').fill('Hello');
      await page.getByRole('button', { name: /send/i }).click();
      await expect(page.getByText(line)).toBeVisible();
      await expect(page.getByRole('alert').filter({ hasText: 'Something went wrong' })).toHaveCount(0);
      // Nothing more can go from here: no Try again, no box.
      await expect(page.getByRole('button', { name: /Try again/ })).toHaveCount(0);
      await expect(page.getByRole('textbox')).toHaveCount(0);
    });
  }

  test('a person who already has a Pam conversation is taken to it, not to a second one', async ({ page }) => {
    await team(page, { existing: true });
    await page.goto(`/pam/start/?profile=${ASKER}&name=Aaliyah`);
    await expect(page).toHaveURL(new RegExp(`/messages/thread/\\?id=${PAM_C}&from=pam`));
  });

  test("Pam writes to a program's leads, and the inbox says how many it went to", async ({ page }) => {
    const server = await team(page);
    await page.goto('/pam/start/?service=svc-1&name=Fresh%20Start%20Kitchen');
    await settled(page);
    await expect(page.getByText("Goes to each of the program's leads.")).toBeVisible();
    await page.getByRole('textbox').fill('Your hours look out of date.');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page).toHaveURL(/\/pam\/messages\/\?sent=2/);
    await expect(page.getByText('Sent to 2 leads.')).toBeVisible();
    expect(server.calls.find((c) => c.fn === 'pam_start_program_conversation')?.args).toEqual({ p_service: 'svc-1', p_body: 'Your hours look out of date.' });
  });

  test('a program nobody runs says so in one line and offers no composer', async ({ page }) => {
    await team(page, { hasLead: false });
    await page.goto('/pam/start/?service=svc-2&name=Northside%20Library');
    await expect(page.getByText('Nobody runs this program in Pam right now.')).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);
  });

  test("Pam's hours: the reply people get changes with the fields, and Save sends the hours", async ({ page }) => {
    const server = await team(page);
    await page.goto('/pam/hours/');
    await settled(page);
    await expect(page.getByRole('heading', { name: "Pam's hours", level: 1 })).toBeVisible();
    await expect(page.getByText(/Monday to Friday, 9\sAM to 5\sPM Eastern time/)).toBeVisible();
    await page.getByRole('checkbox', { name: 'Saturday' }).check();
    await expect(page.getByText(/Monday to Saturday, 9\sAM to 5\sPM Eastern time/)).toBeVisible();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible();
    expect(server.calls.find((c) => c.fn === 'pam_set_hours')?.args).toEqual({ p_tz: 'America/New_York', p_days: [1, 2, 3, 4, 5, 6], p_open: '09:00', p_close: '17:00' });
  });

  test("Pam's hours with no day ticked says so and sends nothing", async ({ page }) => {
    const server = await team(page);
    await page.goto('/pam/hours/');
    await settled(page);
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) await page.getByRole('checkbox', { name: day }).uncheck();
    // With no day there is no reply to show, and the screen stays up.
    await expect(page.getByText(/Thanks for writing/)).toHaveCount(0);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Pick at least one day.' })).toBeVisible();
    expect(server.calls.filter((c) => c.fn === 'pam_set_hours')).toHaveLength(0);
  });

  test('Everyone offers "Message … as Pam" on a person while Pam is live', async ({ page }) => {
    await team(page);
    await page.route('**/rest/v1/rpc/directory_people*', (route) =>
      route.fulfill(json([{ id: ASKER, first_name: 'Aaliyah', role: 'member', region_name: 'Philadelphia', access_status: 'active', last_active_at: null, is_demo: false }])),
    );
    await page.goto('/directory/');
    await settled(page);
    await page.getByRole('button', { name: 'Message Aaliyah as Pam' }).click();
    await expect(page).toHaveURL(new RegExp(`/pam/start/\\?profile=${ASKER}&name=Aaliyah`));
  });

  test('Everyone offers no "as Pam" button on a super admin, whom the database refuses (Iris T3)', async ({ page }) => {
    await team(page);
    await page.route('**/rest/v1/rpc/directory_people*', (route) =>
      route.fulfill(
        json([
          { id: ASKER, first_name: 'Aaliyah', role: 'member', region_name: 'Philadelphia', access_status: 'active', last_active_at: null, is_demo: false },
          { id: 'a0000000-0000-4000-8000-0000000000d1', first_name: 'Sam', role: 'super_admin', region_name: null, access_status: 'active', last_active_at: null, is_demo: false },
        ]),
      ),
    );
    await page.goto('/directory/');
    await settled(page);
    await expect(page.getByRole('button', { name: 'Message Aaliyah as Pam' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Message Sam as Pam' })).toHaveCount(0);
  });

  test("Pam's hours: closing before opening hides the reply rather than show hours that cannot be (Iris T4)", async ({ page }) => {
    const server = await team(page);
    await page.goto('/pam/hours/');
    await settled(page);
    await expect(page.getByText(/Thanks for writing/)).toBeVisible();
    const closes = page.getByRole('textbox', { name: 'Closes' });
    await closes.fill('8:00 AM');
    await closes.press('Enter');
    await closes.blur();
    await expect(page.getByText(/Thanks for writing/)).toHaveCount(0);
    await expect(page.getByText(/5\sPM to 9\sAM|8\sAM/)).toHaveCount(0);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Pick a closing time after the opening time.' })).toBeVisible();
    expect(server.calls.filter((c) => c.fn === 'pam_set_hours')).toHaveLength(0);
  });

  test("Pam's hours: the time fields are 48px tall and the clock is a picture, not a 16px button (Iris T5)", async ({ page }) => {
    await team(page);
    await page.goto('/pam/hours/');
    await settled(page);
    for (const name of ['Opens', 'Closes']) {
      const box = (await page.getByRole('textbox', { name }).boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(48);
    }
    await expect(page.getByRole('button', { name: /^Open (Opens|Closes)/ })).toHaveCount(0);
  });

  for (const path of ['/pam/hours/', `/pam/thread/options/?id=${PAM_C}`, '/pam/start/?service=svc-1&name=Fresh%20Start%20Kitchen']) {
    test(`${path.split('?')[0]} has no WCAG A/AA violations`, async ({ page }) => {
      await team(page);
      await page.goto(path);
      await settled(page);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
