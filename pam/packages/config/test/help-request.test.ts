import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ALLOWED_ORIGINS, LIMITS, TO, handle, type Deps } from '../../../supabase/functions/help-request/handler.ts';
import type { Emailer, Outgoing } from '../../../supabase/functions/help-request/provider.ts';

/**
 * The help desk's "Still stuck?" form, forwarded to Pam's inbox (A28, D-521): off until switched on,
 * only ever to hello@joinpam.org, guarded against abuse, and quiet in its logs. Fake database, fake
 * email service; nothing leaves the test.
 */
const ORIGIN = 'https://joinpam.org';
const GOOD = { message: 'I cannot find my program.', email: 'ana@example.org', page: '/support/posts/x', lang: 'es', role: 'member' };

function world(opts: { env?: Record<string, string | undefined>; allowed?: boolean; sendFails?: boolean } = {}) {
  const sent: Outgoing[] = [];
  const calls: string[] = [];
  const env: Record<string, string | undefined> = {
    HELP_REQUESTS_LIVE: 'on',
    EMAIL_FROM: 'Pam <hello@mail.pam.example>',
    HELP_REQUEST_SALT: 'salty',
    SUPABASE_URL: 'https://stub.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    ...opts.env,
  };
  const emailer: Emailer = {
    name: 'fake',
    async send(email) {
      if (opts.sendFails) throw new Error('the email service answered 503');
      sent.push(email);
    },
  };
  const deps: Deps = {
    get: (name) => env[name],
    emailer,
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(`${String(input)} ${String(init?.body ?? '')}`);
      return new Response(JSON.stringify(opts.allowed ?? true), { status: 200 });
    }) as typeof fetch,
  };
  const post = (body: unknown, headers: Record<string, string> = {}, method = 'POST') =>
    handle(
      new Request('https://stub.supabase.co/functions/v1/help-request', {
        method,
        headers: { origin: ORIGIN, 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9', ...headers },
        ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
      }),
      deps,
    );
  return { post, sent, calls };
}

describe('the help request forward', () => {
  it('is off until switched on: it answers { live: false } and touches nothing', async () => {
    const w = world({ env: { HELP_REQUESTS_LIVE: undefined } });
    const res = await w.post(GOOD);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ live: false });
    expect(w.calls).toHaveLength(0);
    expect(w.sent).toHaveLength(0);
  });

  it('sends one email to hello@joinpam.org only, with the person as reply-to', async () => {
    const w = world();
    const res = await w.post({ ...GOOD, name: 'Ana' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect(w.sent).toHaveLength(1);
    const mail = w.sent[0]!;
    expect(mail.to).toBe('hello@joinpam.org');
    expect(TO).toBe('hello@joinpam.org');
    expect(mail.replyTo).toBe('ana@example.org');
    expect(mail.from).toBe('Pam <hello@mail.pam.example>');
    for (const part of ['I cannot find my program.', 'ana@example.org', '/support/posts/x', 'es', 'member', 'Ana']) {
      expect(mail.text, part).toContain(part);
    }
  });

  it('asks for the limit with a salted hash, never the address', async () => {
    const w = world();
    await w.post(GOOD);
    expect(w.calls[0]).toContain('/rest/v1/rpc/help_request_allowed');
    expect(w.calls[0]).not.toContain('203.0.113.9');
    expect(w.calls[0]).toMatch(/"p_who":"[0-9a-f]{32}"/);
  });

  it('refuses another website, and answers a preflight only for joinpam.org', async () => {
    const w = world();
    expect((await w.post(GOOD, { origin: 'https://evil.example' })).status).toBe(403);
    expect((await w.post(GOOD, { origin: '' })).status).toBe(403);
    const ok = await w.post(null, {}, 'OPTIONS');
    expect(ok.status).toBe(204);
    expect(ok.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    const bad = await w.post(null, { origin: 'https://evil.example' }, 'OPTIONS');
    expect(bad.status).toBe(403);
    expect(bad.headers.get('access-control-allow-origin')).toBeNull();
    expect(w.sent).toHaveLength(0);
    expect(ALLOWED_ORIGINS).toEqual(['https://joinpam.org', 'https://www.joinpam.org']);
  });

  it('a filled honeypot looks like success and sends nothing', async () => {
    const w = world();
    const res = await w.post({ ...GOOD, website: 'http://spam.example' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(w.sent).toHaveLength(0);
    expect(w.calls).toHaveLength(0);
  });

  it('names the field that is missing, wrong or too long', async () => {
    const w = world();
    const cases: [unknown, string][] = [
      [{ ...GOOD, message: '' }, 'message'],
      [{ ...GOOD, message: 'x'.repeat(LIMITS.message + 1) }, 'message'],
      [{ ...GOOD, email: 'not an address' }, 'email'],
      [{ ...GOOD, email: 'a@b.org\nBcc: x@y.org' }, 'email'],
      [{ ...GOOD, name: 'n'.repeat(LIMITS.name + 1) }, 'name'],
      [{ ...GOOD, page: 5 }, 'page'],
      ['not json', 'body'],
    ];
    for (const [body, name] of cases) {
      const res = await w.post(body);
      expect(res.status, name).toBe(400);
      expect(await res.json()).toEqual({ error: 'invalid', field: name });
    }
    expect(w.sent).toHaveLength(0);
  });

  it('refuses a body that is far too big', async () => {
    const w = world();
    const res = await w.post({ ...GOOD, message: 'x'.repeat(LIMITS.body) });
    expect(res.status).toBe(413);
    expect(w.sent).toHaveLength(0);
  });

  it('answers 429 when the database says that caller has had enough', async () => {
    const w = world({ allowed: false });
    const res = await w.post(GOOD);
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('3600');
    expect(await res.json()).toEqual({ error: 'rate_limited' });
    expect(w.sent).toHaveLength(0);
  });

  it('says so when the email service fails, without the words in it', async () => {
    const w = world({ sendFails: true });
    const res = await w.post(GOOD);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'send_failed' });
  });

  it('puts what a person typed into the HTML escaped, and keeps header text out of the subject', async () => {
    const w = world();
    await w.post({ ...GOOD, message: '<script>alert(1)</script>', name: 'A"><b>' });
    const mail = w.sent[0]!;
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
    expect(mail.subject).toBe('Pam help request');
  });

  it('is not set up without its secrets', async () => {
    for (const missing of ['EMAIL_FROM', 'HELP_REQUEST_SALT']) {
      const w = world({ env: { [missing]: undefined } });
      expect((await w.post(GOOD)).status, missing).toBe(503);
      expect(w.sent).toHaveLength(0);
    }
  });

  it('carries the same email sender as the invite function', () => {
    const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
    const copy = read('../../../supabase/functions/help-request/provider.ts').split('\n').slice(2).join('\n');
    expect(copy).toBe(read('../../../supabase/functions/send-invite-emails/provider.ts'));
  });
});
