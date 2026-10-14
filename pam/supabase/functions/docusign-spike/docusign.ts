// docusign-spike — THROWAWAY (card a88, 14 October 2026). The DocuSign side: the sign-in (JWT grant), the only two hosts it may
// reach, and the calls. Sandbox only. Never merged: the host guard test would fail on the new host, which is the point.

/** The only hosts this function talks to. Anything else throws before a request is made. */
export const ALLOWED_HOSTS = ['account-d.docusign.com', 'demo.docusign.net'] as const;

export class DocuSignError extends Error {
  constructor(readonly status: number, readonly errorCode: string, message: string) {
    super(message);
  }
}
export class ConsentRequired extends Error {}

type Fetch = typeof fetch;

/** One outbound door: https only, an allowed host, no redirect followed. */
export function guarded(fetchFn: Fetch): Fetch {
  return ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.protocol !== 'https:' || !(ALLOWED_HOSTS as readonly string[]).includes(url.hostname)) {
      throw new Error(`blocked: ${url.hostname} is not an allowed host`);
    }
    return fetchFn(url, { ...init, redirect: 'manual' });
  }) as Fetch;
}

// --- the key -------------------------------------------------------------------------------------------------------------------------

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
export const b64url = (bytes: Uint8Array) => b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

const derLength = (n: number): number[] => (n < 128 ? [n] : n < 256 ? [0x81, n] : n < 65536 ? [0x82, n >> 8, n & 255] : [0x83, n >> 16, (n >> 8) & 255, n & 255]);

/** DocuSign makes RSA keys in PKCS#1 ("BEGIN RSA PRIVATE KEY"); WebCrypto reads PKCS#8. Wrap the same key. */
export function pkcs1ToPkcs8(pkcs1: Uint8Array): Uint8Array {
  const version = [0x02, 0x01, 0x00];
  const algorithm = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
  const octets = [0x04, ...derLength(pkcs1.length), ...pkcs1];
  const body = [...version, ...algorithm, ...octets];
  return Uint8Array.from([0x30, ...derLength(body.length), ...body]);
}

export async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // A secret pasted as one line keeps its line breaks as the two characters \n.
  const text = pem.replace(/\\n/g, '\n');
  const isPkcs1 = /BEGIN RSA PRIVATE KEY/.test(text);
  const body = text.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = fromB64(body);
  return crypto.subtle.importKey('pkcs8', isPkcs1 ? pkcs1ToPkcs8(der) : der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

export async function signJwt(claims: Record<string, unknown>, key: CryptoKey): Promise<string> {
  const text = (value: unknown) => b64url(new TextEncoder().encode(JSON.stringify(value)));
  const signing = `${text({ alg: 'RS256', typ: 'JWT' })}.${text(claims)}`;
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signing)));
  return `${signing}.${b64url(signature)}`;
}

// --- the sign-in and the calls -------------------------------------------------------------------------------------------------------

export interface Config {
  readonly integrationKey: string;
  readonly userId: string;
  readonly accountId: string;
  readonly privateKey: string;
}

export interface Session {
  readonly token: string;
  readonly base: string;
  readonly accountId: string;
  readonly expiresAt: number;
}

export const consentUrl = (integrationKey: string) =>
  `https://account-d.docusign.com/oauth/auth?response_type=code&scope=${encodeURIComponent('signature impersonation')}&client_id=${encodeURIComponent(
    integrationKey,
  )}&redirect_uri=${encodeURIComponent('https://joinpam.org')}`;

export async function signIn(config: Config, doFetch: Fetch, now: number): Promise<Session> {
  const key = await importPrivateKey(config.privateKey);
  const iat = Math.floor(now / 1000);
  const assertion = await signJwt(
    { iss: config.integrationKey, sub: config.userId, aud: 'account-d.docusign.com', iat, exp: iat + 3000, scope: 'signature impersonation' },
    key,
  );
  const tokenResponse = await doFetch('https://account-d.docusign.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString(),
  });
  const tokenBody = (await tokenResponse.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string };
  if (tokenBody.error === 'consent_required') throw new ConsentRequired();
  if (!tokenResponse.ok || !tokenBody.access_token) throw new DocuSignError(tokenResponse.status, tokenBody.error ?? 'token', 'DocuSign did not give a token');

  const info = await doFetch('https://account-d.docusign.com/oauth/userinfo', { headers: { Authorization: `Bearer ${tokenBody.access_token}` } });
  const infoBody = (await info.json().catch(() => ({}))) as { accounts?: { account_id: string; base_uri: string }[] };
  const account = infoBody.accounts?.find((a) => a.account_id === config.accountId);
  if (!account) throw new DocuSignError(403, 'account_mismatch', 'the sign-in is not for the account in DOCUSIGN_ACCOUNT_ID');
  const base = new URL(account.base_uri);
  // DocuSign tells us where its API is. It must be a host on the list, or nothing else is called.
  if (!(ALLOWED_HOSTS as readonly string[]).includes(base.hostname)) throw new DocuSignError(502, 'base_uri', 'DocuSign named a host that is not allowed');
  return { token: tokenBody.access_token, base: base.origin, accountId: account.account_id, expiresAt: now + (tokenBody.expires_in ?? 3600) * 1000 - 60_000 };
}

export async function call(session: Session, doFetch: Fetch, method: string, path: string, body?: unknown): Promise<unknown> {
  const response = await doFetch(`${session.base}/restapi/v2.1/accounts/${session.accountId}${path}`, {
    method,
    headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const parsed = (await response.json().catch(() => ({}))) as { errorCode?: string; message?: string };
  if (!response.ok) throw new DocuSignError(response.status, parsed.errorCode ?? 'error', (parsed.message ?? 'DocuSign said no').slice(0, 300));
  return parsed;
}
