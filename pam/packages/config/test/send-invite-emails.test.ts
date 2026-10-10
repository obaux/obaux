import { describe, expect, it } from 'vitest';
import { handle, type Deps } from '../../../supabase/functions/send-invite-emails/handler.ts';
import { resendEmailer, type Emailer, type Outgoing } from '../../../supabase/functions/send-invite-emails/provider.ts';
import { renderFreshLink, renderStaffInvite, localeOf, type Bundle } from '../../../supabase/functions/send-invite-emails/render.ts';
import bundleJson from '../../../supabase/functions/send-invite-emails/bundle.json';
import {
  FONT_STACK,
  INVITE_EMAIL,
  INVITE_EMAIL_MORE,
  RIGHT_TO_LEFT,
  STAFF_INVITE_EMAIL,
  renderInviteEmail,
  renderStaffInviteEmail,
} from '../src/invite-email';
import { SUPPORTED_LOCALES, type Locale } from '../src/i18n';

/**
 * The sender (D-450): off until switched on, silent until a person signs the
 * words, never a send button, never a leak. Run against a fake database and a
 * fake email service; nothing leaves the test.
 */
const SIGNED = 'a test reader';
// The bundle the function really ships: Will signed the English on 10 October 2026.
const bundle = (signed: Locale[]): Bundle => {
  const b = structuredClone(bundleJson) as unknown as Bundle;
  for (const l of SUPPORTED_LOCALES) {
    b.locales[l].reviewedBy = signed.includes(l) ? SIGNED : '';
    b.linkLocales[l].reviewedBy = signed.includes(l) ? SIGNED : '';
  }
  return b;
};

const ROW = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'ivy@example.org',
  code: 'ABCD2345',
  role: 'admin' as const,
  locale: 'en',
  inviter_first_name: 'Dana',
};

function world(opts: { rows?: (typeof ROW)[]; linkRows?: (typeof ROW)[]; signed?: Locale[]; sendFails?: boolean; env?: Record<string, string | undefined> } = {}) {
  const sentEmails: Outgoing[] = [];
  const rpcs: { name: string; args: Record<string, unknown> }[] = [];
  const sleeps: number[] = [];
  const env: Record<string, string | undefined> = {
    INVITE_EMAILS: 'on',
    DISPATCH_SECRET: 'shh',
    EMAIL_FROM: 'Pam <hello@mail.pam.example>',
    EMAIL_REPLY_TO: 'help@pam.example',
    APP_URL: 'https://pam.example/',
    SUPABASE_URL: 'https://stub.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    ...opts.env,
  };
  const emailer: Emailer = {
    name: 'fake',
    async send(email) {
      if (opts.sendFails) throw new Error('the email service answered 503');
      sentEmails.push(email);
    },
  };
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const name = String(input).split('/rpc/')[1]!;
    const args = JSON.parse(String(init?.body ?? '{}'));
    rpcs.push({ name, args });
    if (name === 'claim_staff_invite_emails') return new Response(JSON.stringify(opts.rows ?? [ROW]), { status: 200 });
    if (name === 'claim_invite_link_emails') return new Response(JSON.stringify(opts.linkRows ?? []), { status: 200 });
    return new Response('', { status: 200 });
  }) as typeof fetch;
  const deps: Deps = {
    get: (name) => env[name],
    fetch: fetcher,
    emailer,
    bundle: bundle(opts.signed ?? ['en']),
    sleep: async (ms) => void sleeps.push(ms),
  };
  const call = (headers: Record<string, string> = { 'x-dispatch-secret': 'shh' }) =>
    handle(new Request('https://fn.example/send', { method: 'POST', headers }), deps);
  return { deps, call, sentEmails, rpcs, sleeps };
}

const json = async (r: Response) => (await r.json()) as Record<string, unknown>;

describe('the sender is off until it is switched on', () => {
  it('answers disabled and touches neither the database nor the email service', async () => {
    const w = world({ env: { INVITE_EMAILS: undefined } });
    const r = await w.call();
    expect(r.status).toBe(200);
    expect(await json(r)).toEqual({ enabled: false });
    expect(w.rpcs).toEqual([]);
    expect(w.sentEmails).toEqual([]);
  });

  it('anything but "on" is off', async () => {
    for (const value of ['', 'true', '1', 'ON ']) {
      const w = world({ env: { INVITE_EMAILS: value } });
      expect(await json(await w.call())).toEqual({ enabled: false });
      expect(w.rpcs, value).toEqual([]);
    }
  });
});

describe('it is not a send button', () => {
  it('refuses a caller without the shared secret, and will not run without one set up', async () => {
    const wrong = world();
    expect((await wrong.call({ 'x-dispatch-secret': 'nope' })).status).toBe(401);
    expect((await wrong.call({})).status).toBe(401);
    expect(wrong.rpcs).toEqual([]);
    const unset = world({ env: { DISPATCH_SECRET: undefined } });
    expect((await unset.call({})).status).toBe(503);
    expect(unset.rpcs).toEqual([]);
  });

  it('says what is missing rather than sending half-set-up', async () => {
    for (const env of [{ EMAIL_FROM: undefined }, { APP_URL: undefined }, { APP_URL: 'http://pam.example' }]) {
      const w = world({ env });
      expect((await w.call()).status, JSON.stringify(env)).toBe(503);
      expect(w.rpcs).toEqual([]);
    }
    const noKey = world();
    expect((await handle(new Request('https://fn.example', { method: 'POST', headers: { 'x-dispatch-secret': 'shh' } }), { ...noKey.deps, emailer: null })).status).toBe(503);
  });
});

describe('it sends nothing until a person has signed the words', () => {
  it('waits, and claims nothing, so waiting uses up nobody’s tries', async () => {
    const w = world({ signed: [] });
    const r = await w.call();
    expect(await json(r)).toMatchObject({ enabled: true, sent: 0, waiting: 'the wording is not signed' });
    expect(w.rpcs).toEqual([]);
    expect(w.sentEmails).toEqual([]);
  });

  it('the bundle the function ships carries Will’s sign-off on the English, so it can send', () => {
    const shipped = bundleJson as unknown as Bundle;
    expect(shipped.locales.en.reviewedBy).toBe('Will, 10 October 2026');
    expect(shipped.locales.en.copy.button).toBe('Accept invite');
    // The other six are not signed (D-488): the bundle the function ships sends them the English.
    for (const l of SUPPORTED_LOCALES.filter((x) => x !== 'en')) expect(shipped.locales[l].reviewedBy, l).toBe('');
  });
});

describe('what it sends', () => {
  it('claims a batch, sends each email once with the invite as its idempotency key, and reports it sent', async () => {
    const w = world();
    const r = await w.call();
    expect(await json(r)).toMatchObject({ enabled: true, claimed: 1, sent: 1, failures: [] });
    expect(w.sentEmails).toHaveLength(1);
    const email = w.sentEmails[0]!;
    expect(email.to).toBe('ivy@example.org');
    expect(email.from).toBe('Pam <hello@mail.pam.example>');
    expect(email.replyTo).toBe('help@pam.example');
    expect(email.idempotencyKey).toBe(`staff-invite-${ROW.id}`);
    expect(email.html).toContain('https://pam.example/signin/?invite=ABCD2345&amp;as=case-manager');
    expect(email.html).toContain('src="https://pam.example/email/pam-logo.png"');
    expect(email.html).toContain('Dana would love for you to join Pam as a case manager');
    expect(w.rpcs.map((c) => c.name)).toEqual(['claim_staff_invite_emails', 'mark_staff_invite_email_sent', 'claim_invite_link_emails']);
    expect(w.rpcs[1]!.args).toEqual({ p_id: ROW.id });
  });

  it('links a program lead as a program, and pauses between emails', async () => {
    const other = { ...ROW, id: '22222222-2222-4222-8222-222222222222', role: 'provider' as const, code: 'ZXCV6789' };
    const w = world({ rows: [ROW, other] });
    await w.call();
    expect(w.sentEmails[1]!.html).toContain('invite=ZXCV6789&amp;as=program');
    expect(w.sentEmails[1]!.html).toContain('would love for your program to be part of Pam');
    expect(w.sleeps).toEqual([600]);
  });

  it('writes in the person’s language when it is signed, in English when it is not', async () => {
    const ru = { ...ROW, locale: 'ru' };
    const signed = world({ rows: [ru], signed: ['en', 'ru'] });
    await signed.call();
    expect(signed.sentEmails[0]!.html).toContain('lang="ru"');
    const unsigned = world({ rows: [ru], signed: ['en'] });
    await unsigned.call();
    expect(unsigned.sentEmails[0]!.html).toContain('lang="en"');
    expect(unsigned.sentEmails[0]!.subject).toBe(STAFF_INVITE_EMAIL.en.copy.subject);
    const odd = world({ rows: [{ ...ROW, locale: 'klingon' }] });
    await odd.call();
    expect(odd.sentEmails[0]!.html).toContain('lang="en"');
  });

  it('puts a failure back for another try, with only what went wrong, and goes on', async () => {
    const w = world({ sendFails: true });
    const body = await json(await w.call());
    expect(body).toMatchObject({ claimed: 1, sent: 0 });
    expect(w.rpcs.map((c) => c.name)).toEqual(['claim_staff_invite_emails', 'mark_staff_invite_email_failed', 'claim_invite_link_emails']);
    expect(w.rpcs[1]!.args).toEqual({ p_id: ROW.id, p_reason: 'the email service answered 503' });
  });

  it('never writes an address, a link or a word of an email to its logs', async () => {
    const logged: string[] = [];
    const orig = [console.log, console.warn, console.error];
    console.log = console.warn = console.error = (...a: unknown[]) => void logged.push(a.map(String).join(' '));
    try {
      await world({ rows: [{ ...ROW, locale: 'ru' }], signed: ['en'] }).call();
      await world({ sendFails: true }).call();
    } finally {
      [console.log, console.warn, console.error] = orig as typeof orig;
    }
    const all = logged.join('\n');
    expect(all).not.toContain('ivy@example.org');
    expect(all).not.toContain('ABCD2345');
    expect(all).not.toContain('Dana');
  });
});

describe('the Resend emailer', () => {
  it('posts the email with the key, the idempotency key and no address in a failure', async () => {
    const seen: { url: string; headers: Record<string, string>; body: Record<string, unknown> }[] = [];
    const fetcher = (async (url: string, init: RequestInit) => {
      seen.push({ url, headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
      return new Response('{"message":"ivy@example.org is not valid"}', { status: seen.length === 1 ? 200 : 422 });
    }) as unknown as typeof fetch;
    const emailer = resendEmailer('re_test', fetcher);
    const email: Outgoing = { to: 'ivy@example.org', from: 'Pam <a@b.example>', replyTo: null, subject: 'S', html: '<p>h</p>', text: 't', idempotencyKey: 'k1' };
    await emailer.send(email);
    expect(seen[0]!.url).toBe('https://api.resend.com/emails');
    expect(seen[0]!.headers.Authorization).toBe('Bearer re_test');
    expect(seen[0]!.headers['Idempotency-Key']).toBe('k1');
    expect(seen[0]!.body).toMatchObject({ to: ['ivy@example.org'], from: 'Pam <a@b.example>', subject: 'S' });
    expect(seen[0]!.body).not.toHaveProperty('reply_to');
    const error = await emailer.send({ ...email, replyTo: 'r@b.example' }).then(() => null, (e: Error) => e.message);
    expect(error).toBe('the email service answered 422');
    expect(seen[1]!.body).toMatchObject({ reply_to: 'r@b.example' });
  });
});

describe('the sender and the preview say the same thing', () => {
  it('renders byte for byte what packages/config renders, in every language and both roles', () => {
    const signedAll = SUPPORTED_LOCALES.slice();
    const mine = bundle(signedAll);
    // The generated bundle is the config's own tables.
    expect(JSON.parse(JSON.stringify(bundleJson))).toEqual({
      locales: JSON.parse(JSON.stringify(STAFF_INVITE_EMAIL)),
      linkLocales: JSON.parse(
        JSON.stringify(
          Object.fromEntries(
            SUPPORTED_LOCALES.map((l) => [
              l,
              l === 'en' || l === 'es'
                ? { reviewedBy: INVITE_EMAIL.reviewedBy, copy: INVITE_EMAIL[l] }
                : INVITE_EMAIL_MORE[l],
            ]),
          ),
        ),
      ),
      fonts: FONT_STACK,
      rtl: RIGHT_TO_LEFT,
    });
    // Sign everything for the length of the comparison, and put each back as it was.
    const table = STAFF_INVITE_EMAIL as Record<string, { reviewedBy: string }>;
    const before = SUPPORTED_LOCALES.map((l) => table[l]!.reviewedBy);
    SUPPORTED_LOCALES.forEach((l) => (table[l]!.reviewedBy = SIGNED));
    try {
      for (const locale of SUPPORTED_LOCALES) {
        for (const role of ['provider', 'admin'] as const) {
          for (const inviterFirstName of ['Dana', null, '<b>Dana</b> & "Co"']) {
            const input = { link: 'https://pam.example/signin/?invite=A&as=x', role, inviterFirstName, locale, appUrl: 'https://pam.example' };
            const a = renderStaffInvite(mine, input);
            const b = renderStaffInviteEmail(input);
            expect(a, `${locale} ${role} ${inviterFirstName}`).toEqual(b);
          }
        }
      }
    } finally {
      SUPPORTED_LOCALES.forEach((l, i) => (table[l]!.reviewedBy = before[i]!));
    }
  });

  it('renders the fresh-link email byte for byte what packages/config renders, in every language and all three roles', () => {
    const mine = bundle(SUPPORTED_LOCALES.slice());
    for (const locale of SUPPORTED_LOCALES) {
      for (const role of ['member', 'provider', 'admin'] as const) {
        for (const inviterFirstName of ['Dana', null, '<b>Dana</b> & "Co"']) {
          const input = { link: 'https://pam.example/signin/?invite=A&as=x', role, inviterFirstName, locale, appUrl: 'https://pam.example' };
          // `draft` shows the language asked for whatever its sign-off; the sender's bundle above has every language signed.
          expect(renderFreshLink(mine, input), `${locale} ${role} ${inviterFirstName}`).toEqual(
            renderInviteEmail({ ...input, draft: true }),
          );
        }
      }
    }
  });

  it('treats a language it does not know as English', () => {
    expect(localeOf('xx')).toBe('en');
    expect(localeOf(null)).toBe('en');
    expect(localeOf('zh-HK')).toBe('zh-HK');
  });
});

describe('the email with a fresh link (D-476): someone whose link ran out asked for another', () => {
  const LINK_ROW = {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'mem@example.org',
    code: 'NEWC0DE9',
    role: 'member' as const,
    locale: 'en',
    inviter_first_name: 'Dana',
  };

  it('claims from its own queue, sends once with its own idempotency key, and reports it sent', async () => {
    const w = world({ rows: [], linkRows: [LINK_ROW] });
    const body = await json(await w.call());
    expect(body).toMatchObject({ enabled: true, links: { claimed: 1, sent: 1, failures: [] } });
    expect(w.sentEmails).toHaveLength(1);
    const email = w.sentEmails[0]!;
    expect(email.to).toBe('mem@example.org');
    expect(email.idempotencyKey).toBe(`invite-link-${LINK_ROW.id}`);
    expect(email.subject).toBe('Your new Pam link');
    // The new invite's code, as a member's link.
    expect(email.html).toContain('https://pam.example/signin/?invite=NEWC0DE9&amp;as=member');
    expect(email.html).toContain('Dana invited you to join the Pam network. Your last link ran out');
    expect(w.rpcs.map((c) => c.name)).toEqual(['claim_staff_invite_emails', 'claim_invite_link_emails', 'mark_invite_link_email_sent']);
    expect(w.rpcs[2]!.args).toEqual({ p_id: LINK_ROW.id });
  });

  it('names each role the way the sign-in page does', async () => {
    const rows = [
      { ...LINK_ROW, id: 'a', role: 'admin' as const, code: 'CODEADM1' },
      { ...LINK_ROW, id: 'b', role: 'provider' as const, code: 'CODEPRV1' },
    ];
    const w = world({ rows: [], linkRows: rows });
    await w.call();
    expect(w.sentEmails[0]!.html).toContain('invite=CODEADM1&amp;as=case-manager');
    expect(w.sentEmails[0]!.html).toContain('to be a case manager in the Pam network');
    expect(w.sentEmails[1]!.html).toContain('invite=CODEPRV1&amp;as=program');
    expect(w.sentEmails[1]!.html).toContain('to be a program partner in the Pam network');
  });

  it('writes in the language it was asked for in when it is signed, and English when it is not', async () => {
    const es = { ...LINK_ROW, locale: 'es' };
    const signed = world({ rows: [], linkRows: [es], signed: ['en', 'es'] });
    await signed.call();
    expect(signed.sentEmails[0]!.html).toContain('lang="es"');
    expect(signed.sentEmails[0]!.subject).toBe(INVITE_EMAIL.es.subject);
    const ru = world({ rows: [], linkRows: [{ ...LINK_ROW, locale: 'ru' }], signed: ['en', 'es'] });
    await ru.call();
    expect(ru.sentEmails[0]!.html).toContain('lang="en"');
  });

  it('is on and off with the same switch, and needs the same secrets', async () => {
    const off = world({ rows: [], linkRows: [LINK_ROW], env: { INVITE_EMAILS: undefined } });
    expect(await json(await off.call())).toEqual({ enabled: false });
    expect(off.rpcs).toEqual([]);
    const noSecret = world({ rows: [], linkRows: [LINK_ROW] });
    expect((await noSecret.call({})).status).toBe(401);
    expect(noSecret.rpcs).toEqual([]);
    const noFrom = world({ rows: [], linkRows: [LINK_ROW], env: { EMAIL_FROM: undefined } });
    expect((await noFrom.call()).status).toBe(503);
    expect(noFrom.sentEmails).toEqual([]);
  });

  it('sends nothing, and claims nothing, until a person has signed the words', async () => {
    const w = world({ rows: [], linkRows: [LINK_ROW], signed: [] });
    expect(await json(await w.call())).toMatchObject({ enabled: true, sent: 0, waiting: 'the wording is not signed' });
    expect(w.rpcs).toEqual([]);
    expect(w.sentEmails).toEqual([]);
  });

  it('puts a failure back for another try, with only what went wrong', async () => {
    const w = world({ rows: [], linkRows: [LINK_ROW], sendFails: true });
    const body = await json(await w.call());
    expect(body).toMatchObject({ links: { claimed: 1, sent: 0 } });
    expect(w.rpcs.map((c) => c.name)).toEqual(['claim_staff_invite_emails', 'claim_invite_link_emails', 'mark_invite_link_email_failed']);
    expect(w.rpcs[2]!.args).toEqual({ p_id: LINK_ROW.id, p_reason: 'the email service answered 503' });
  });

  it('sends both kinds in one run and pauses between all of them', async () => {
    const w = world({ rows: [ROW], linkRows: [LINK_ROW] });
    const body = await json(await w.call());
    expect(body).toMatchObject({ claimed: 1, sent: 1, links: { claimed: 1, sent: 1 } });
    expect(w.sentEmails.map((e) => e.idempotencyKey)).toEqual([`staff-invite-${ROW.id}`, `invite-link-${LINK_ROW.id}`]);
    expect(w.sleeps).toEqual([600]);
  });

  it('keeps the other kind going when one fails to render', async () => {
    const bad = { ...LINK_ROW, role: 'wizard' as unknown as 'member' };
    const w = world({ rows: [ROW], linkRows: [bad] });
    const body = await json(await w.call());
    expect(body).toMatchObject({ sent: 1, links: { claimed: 1, sent: 0 } });
  });

  it('never writes an address, a link or a word of the email to its logs', async () => {
    const logged: string[] = [];
    const orig = [console.log, console.warn, console.error];
    console.log = console.warn = console.error = (...a: unknown[]) => void logged.push(a.map(String).join(' '));
    try {
      await world({ rows: [], linkRows: [{ ...LINK_ROW, locale: 'ru' }], signed: ['en'] }).call();
      await world({ rows: [], linkRows: [LINK_ROW], sendFails: true }).call();
    } finally {
      [console.log, console.warn, console.error] = orig as typeof orig;
    }
    const all = logged.join('\n');
    expect(all).not.toContain('mem@example.org');
    expect(all).not.toContain('NEWC0DE9');
    expect(all).not.toContain('Dana');
  });

  it('uses the signed wording of 4 October, in the bundle it ships', () => {
    const shipped = bundleJson as unknown as Bundle;
    expect(shipped.linkLocales.en.reviewedBy).toBe('Will (Oba), 4 October 2026');
    expect(shipped.linkLocales.ru.reviewedBy).toContain('approved to learn from');
  });
});
