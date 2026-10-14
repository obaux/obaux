import { generateKeyPairSync, createHmac } from 'node:crypto';
import { describe, expect, it, beforeEach } from 'vitest';
import { ACTIONS, forgetSession, handle, sha256Hex, type Deps } from '../../../supabase/functions/docusign-spike/handler.ts';
import { ALLOWED_HOSTS, guarded, importPrivateKey, pkcs1ToPkcs8 } from '../../../supabase/functions/docusign-spike/docusign.ts';
import { envelopeDefinition, makePdf } from '../../../supabase/functions/docusign-spike/forms.ts';
import { handle as hook, signed } from '../../../supabase/functions/docusign-spike-hook/handler.ts';

/**
 * THROWAWAY (card a88): the DocuSign sandbox spike. The lock, the two hosts, the key, the forms, the webhook check. Fake DocuSign, nothing leaves.
 */
const KEY = 'a'.repeat(64);
const { privateKey: PKCS1 } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs1', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
const { privateKey: PKCS8 } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });

async function world(opts: { env?: Record<string, string | undefined>; now?: number; docusign?: (url: string, init?: RequestInit) => Response } = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const env: Record<string, string | undefined> = {
    DOCUSIGN_SPIKE_KEY_SHA256: await sha256Hex(KEY),
    DOCUSIGN_SPIKE_UNTIL: '2026-10-16T00:00:00Z',
    DOCUSIGN_INTEGRATION_KEY: 'int-key',
    DOCUSIGN_USER_ID: 'user-id',
    DOCUSIGN_ACCOUNT_ID: 'acct-1',
    DOCUSIGN_PRIVATE_KEY: PKCS1,
    SUPABASE_URL: 'https://stub.supabase.co',
    ...opts.env,
  };
  const deps: Deps = {
    get: (name) => env[name],
    now: () => opts.now ?? Date.parse('2026-10-14T12:00:00Z'),
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      if (opts.docusign) return opts.docusign(url, init);
      if (url.endsWith('/oauth/token')) return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 });
      if (url.endsWith('/oauth/userinfo')) return new Response(JSON.stringify({ accounts: [{ account_id: 'acct-1', base_uri: 'https://demo.docusign.net' }] }), { status: 200 });
      if (url.endsWith('/envelopes')) return new Response(JSON.stringify({ envelopeId: '11111111-2222-4333-8444-555555555555', status: 'sent' }), { status: 201 });
      if (url.includes('/views/recipient')) return new Response(JSON.stringify({ url: 'https://demo.docusign.net/signing/one-time' }), { status: 201 });
      return new Response('{}', { status: 200 });
    }) as typeof fetch,
  };
  const ask = (body: unknown, headers: Record<string, string> = { 'x-spike-key': KEY }, method = 'POST') =>
    handle(new Request('https://x.test/docusign-spike', { method, headers, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) }), deps);
  return { ask, calls };
}

beforeEach(() => forgetSession());

describe('the lock', () => {
  it('is not set up without the end date and the key hash', async () => {
    expect((await (await world({ env: { DOCUSIGN_SPIKE_UNTIL: undefined } })).ask({ action: 'whoami' })).status).toBe(503);
    expect((await (await world({ env: { DOCUSIGN_SPIKE_KEY_SHA256: undefined } })).ask({ action: 'whoami' })).status).toBe(503);
  });
  it('answers 410 after the end date, whatever else is right', async () => {
    const { ask, calls } = await world({ now: Date.parse('2026-10-17T00:00:00Z') });
    expect((await ask({ action: 'whoami' })).status).toBe(410);
    expect(calls).toEqual([]);
  });
  it('refuses a missing or wrong key, and never reaches DocuSign', async () => {
    const { ask, calls } = await world();
    expect((await ask({ action: 'whoami' }, {})).status).toBe(401);
    expect((await ask({ action: 'whoami' }, { 'x-spike-key': 'b'.repeat(64) })).status).toBe(401);
    expect(calls).toEqual([]);
  });
  it('takes only POST, JSON and the fixed actions', async () => {
    const { ask } = await world();
    expect((await ask({}, { 'x-spike-key': KEY }, 'GET')).status).toBe(405);
    expect((await ask({ action: 'fetch-this', url: 'https://evil.test' })).status).toBe(400);
    expect(ACTIONS).toEqual(['consent', 'whoami', 'envelope', 'mint', 'status', 'purge', 'template-view']);
  });
});

describe('the two hosts', () => {
  it('lets only account-d.docusign.com and demo.docusign.net through, over https, without following a redirect', async () => {
    const seen: RequestInit[] = [];
    const door = guarded((async (_input: RequestInfo | URL, init?: RequestInit) => (seen.push(init ?? {}), new Response('{}'))) as typeof fetch);
    for (const host of ALLOWED_HOSTS) await door(`https://${host}/x`);
    expect(seen.every((init) => init.redirect === 'manual')).toBe(true);
    for (const url of ['https://example.com/x', 'https://demo.docusign.net.evil.test/x', 'http://demo.docusign.net/x', 'https://www.docusign.net/x', 'https://apps-d.docusign.com/x']) {
      expect(() => door(url), url).toThrow(/blocked/);
    }
  });
  it('refuses a base address from DocuSign that is not on the list, and calls nothing else', async () => {
    const { ask, calls } = await world({
      docusign: (url) =>
        url.endsWith('/oauth/token')
          ? new Response(JSON.stringify({ access_token: 'tok' }))
          : new Response(JSON.stringify({ accounts: [{ account_id: 'acct-1', base_uri: 'https://elsewhere.example.com' }] })),
    });
    expect((await ask({ action: 'whoami' })).status).toBe(502);
    expect(calls.every((c) => new URL(c.url).hostname === 'account-d.docusign.com')).toBe(true);
  });
  it('only ever calls the two hosts for a whole run', async () => {
    const { ask, calls } = await world();
    await ask({ action: 'envelope', which: 'E1' });
    await ask({ action: 'mint', envelopeId: '11111111-2222-4333-8444-555555555555' });
    expect(new Set(calls.map((c) => new URL(c.url).hostname))).toEqual(new Set(['account-d.docusign.com', 'demo.docusign.net']));
  });
});

describe('the key and the sign-in', () => {
  it('reads a PKCS#1 key (DocuSign’s) and a PKCS#8 one, and a secret pasted on one line', async () => {
    await expect(importPrivateKey(PKCS1)).resolves.toBeTruthy();
    await expect(importPrivateKey(PKCS8)).resolves.toBeTruthy();
    await expect(importPrivateKey(PKCS1.replace(/\n/g, '\\n'))).resolves.toBeTruthy();
    expect(pkcs1ToPkcs8(Uint8Array.from([1, 2, 3]))[0]).toBe(0x30);
  });
  it('asks for consent when DocuSign says it is needed, with the redirect https://joinpam.org', async () => {
    const { ask } = await world({ docusign: () => new Response(JSON.stringify({ error: 'consent_required' }), { status: 400 }) });
    const answer = await (await ask({ action: 'whoami' })).json();
    expect(answer.consent).toBe('required');
    expect(answer.url).toContain('https://account-d.docusign.com/oauth/auth');
    expect(decodeURIComponent(answer.url)).toContain('redirect_uri=https://joinpam.org');
    expect(decodeURIComponent(answer.url)).toContain('scope=signature impersonation');
  });
  it('signs the JWT for the integration key and user, audience account-d.docusign.com', async () => {
    const { ask, calls } = await world();
    await ask({ action: 'whoami' });
    const form = new URLSearchParams(String(calls[0]!.init!.body));
    expect(form.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    const claims = JSON.parse(Buffer.from(form.get('assertion')!.split('.')[1]!, 'base64url').toString());
    expect(claims).toMatchObject({ iss: 'int-key', sub: 'user-id', aud: 'account-d.docusign.com', scope: 'signature impersonation' });
  });
  it('says the account is wrong when the sign-in is for another, and never prints a secret', async () => {
    const { ask } = await world({ env: { DOCUSIGN_ACCOUNT_ID: 'someone-else' } });
    const response = await ask({ action: 'whoami' });
    expect(response.status).toBe(502);
    const text = await response.text();
    for (const secret of ['int-key', 'user-id', 'BEGIN']) expect(text).not.toContain(secret);
  });
});

describe('the envelopes', () => {
  it('E1 is five forms; E100 is a hundred; E-ar sets the signer’s language to Arabic', () => {
    expect(envelopeDefinition('E1').documents).toHaveLength(5);
    expect(envelopeDefinition('E100').documents).toHaveLength(100);
    expect(envelopeDefinition('E1').recipients.signers[0]).not.toHaveProperty('emailNotification');
    expect(envelopeDefinition('Ear').recipients.signers[0]).toMatchObject({ emailNotification: { supportedLanguage: 'ar' } });
  });
  it('has one embedded signer, a made-up non-delivering address, and a tooltip on every tab', () => {
    const signer = envelopeDefinition('E1').recipients.signers[0]!;
    expect(signer).toMatchObject({ name: 'Test Member Ana', clientUserId: '1001' });
    expect(signer.email).toMatch(/\.invalid$/);
    const tabs = Object.values(signer.tabs).flat() as { tooltip?: string; tabLabel?: string }[];
    expect(tabs.length).toBeGreaterThan(5);
    expect(tabs.every((tab) => tab.tooltip && tab.tooltip.length > 3)).toBe(true);
    const labels = tabs.map((tab) => tab.tabLabel);
    for (const label of ['fullName', 'initials', 'dob', 'ssn']) expect(labels).toContain(label);
  });
  it('asks Connect for no documents and no field data', () => {
    const notice = envelopeDefinition('E1', { connectUrl: 'https://stub.supabase.co/functions/v1/docusign-spike-hook/connect' }).eventNotification!;
    expect(notice.includeDocuments).toBe('false');
    expect(notice.includeDocumentFields).toBe('false');
    expect(notice.includeCertificateOfCompletion).toBe('false');
    expect(notice.eventData.includeData).toEqual([]);
    expect(notice.includeHMAC).toBe('true');
  });
  it('makes a real one-page PDF with its anchors in the text', () => {
    const text = new TextDecoder().decode(makePdf('F1 Intake (made up)', [{ label: 'Full name', anchor: '/fullName/' }]));
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('/fullName/');
    expect(text.trim().endsWith('%%EOF')).toBe(true);
  });
  it('mints with the hook’s return page, and asks for a frame only for the focused view', async () => {
    const { ask, calls } = await world();
    const id = '11111111-2222-4333-8444-555555555555';
    expect((await (await ask({ action: 'mint', envelopeId: id })).json()).url).toBe('https://demo.docusign.net/signing/one-time');
    const plain = JSON.parse(String(calls.at(-1)!.init!.body));
    expect(plain.returnUrl).toBe('https://stub.supabase.co/functions/v1/docusign-spike-hook/return');
    expect(plain).not.toHaveProperty('frameAncestors');
    expect((await ask({ action: 'mint', envelopeId: id, display: 'focused', origin: 'http://evil' })).status).toBe(400);
    await ask({ action: 'mint', envelopeId: id, display: 'focused', origin: 'https://test.example' });
    expect(JSON.parse(String(calls.at(-1)!.init!.body))).toMatchObject({ frameAncestors: ['https://test.example'] });
    expect((await ask({ action: 'mint', envelopeId: 'not-an-id' })).status).toBe(400);
  });
});

describe('the hook', () => {
  const log: string[] = [];
  const hookDeps = (env: Record<string, string | undefined>, now = Date.parse('2026-10-14T12:00:00Z')) => ({ get: (name: string) => env[name], log: (line: string) => log.push(line), now: () => now });
  const secret = 'connect-secret';
  const body = JSON.stringify({ event: 'envelope-completed', data: { envelopeId: 'e1', envelopeSummary: { status: 'completed' } } });
  const post = (headers: Record<string, string>, text = body) => new Request('https://x.test/functions/v1/docusign-spike-hook/connect', { method: 'POST', headers, body: text });
  const env = { DOCUSIGN_SPIKE_UNTIL: '2026-10-16T00:00:00Z', DOCUSIGN_CONNECT_KEY: secret };

  it('answers 503 "not set up" at /connect until the Connect key exists', async () => {
    expect((await hook(post({}), hookDeps({ DOCUSIGN_SPIKE_UNTIL: env.DOCUSIGN_SPIKE_UNTIL }))).status).toBe(503);
  });
  it('checks DocuSign’s HMAC (any of its keys), and logs ids, status and key NAMES only', async () => {
    log.length = 0;
    const good = createHmac('sha256', secret).update(body).digest('base64');
    expect((await hook(post({ 'x-docusign-signature-1': 'wrong' }), hookDeps(env))).status).toBe(401);
    expect((await hook(post({}), hookDeps(env))).status).toBe(401);
    expect(await signed(post({ 'x-docusign-signature-2': good }), secret, body)).toBe(true);
    expect((await hook(post({ 'x-docusign-signature-1': good }), hookDeps(env))).status).toBe(200);
    expect(JSON.parse(log[0]!)).toMatchObject({ event: 'envelope-completed', envelopeId: 'e1', status: 'completed', dataKeys: ['envelopeId', 'envelopeSummary'] });
    expect(log).toHaveLength(1);
  });
  it('logs the whole payload only while the one-time switch is on', async () => {
    log.length = 0;
    const good = createHmac('sha256', secret).update(body).digest('base64');
    await hook(post({ 'x-docusign-signature-1': good }), hookDeps({ ...env, DOCUSIGN_SPIKE_LOG_PAYLOAD: '1' }));
    expect(log.some((line) => line.startsWith('payload '))).toBe(true);
  });
  it('/return prints only a known event name', async () => {
    const ask = (query: string) => hook(new Request(`https://x.test/functions/v1/docusign-spike-hook/return${query}`), hookDeps(env));
    expect(await (await ask('?event=signing_complete')).text()).toBe('event=signing_complete');
    expect(await (await ask('?event=decline')).text()).toBe('event=decline');
    expect(await (await ask('?event=<script>alert(1)</script>')).text()).toBe('event=other');
  });
  it('answers 410 after the end date', async () => {
    expect((await hook(post({}), hookDeps(env, Date.parse('2026-10-17T00:00:00Z')))).status).toBe(410);
  });
});

describe('the JWT really verifies', () => {
  it('is signed by the key it was given (RS256)', async () => {
    const { createPublicKey, createVerify } = await import('node:crypto');
    const { signJwt } = await import('../../../supabase/functions/docusign-spike/docusign.ts');
    const key = await importPrivateKey(PKCS1);
    const jwt = await signJwt({ iss: 'x' }, key);
    const [h, p, s] = jwt.split('.');
    const verify = createVerify('RSA-SHA256').update(`${h}.${p}`);
    expect(verify.verify(createPublicKey(PKCS1), Buffer.from(s!, 'base64url'))).toBe(true);
  });
});
