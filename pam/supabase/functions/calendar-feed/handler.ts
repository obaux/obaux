// calendar-feed: a member's Pam visits as a calendar file, at a secret address (D-538, D-604).
//
// GET /functions/v1/calendar-feed/<token>.ics, public (deploy with JWT verification OFF): the
// address is the key. Two kinds of token. A LEGACY one is 43 characters of base64url (256 bits); the
// database holds only its SHA-256, so this hashes what it was given and asks `calendar_feed_read`,
// which only the service role may call. A LINK (D-604) is 65: the member's id, then an HMAC of it
// and the link's version under a key only the database holds, so this hands the whole token to
// `calendar_feed_read_link`, which checks it and answers. Everything that decides what is in the
// file is in ics.ts and the function.
//
// Rules:
//   1. A wrong, malformed or turned-off address gets the same bare 404, so nothing tells them apart.
//   2. Nothing is recorded about the request: no token, no caller, no read time. Errors log a
//      status, never a value.
//   3. No CORS: a calendar app is not a web page, and no page should read it.

import { buildCalendar, type Feed } from './ics.ts';

export interface Deps {
  readonly get: (name: string) => string | undefined;
  readonly fetch: typeof fetch;
  readonly now?: () => Date;
}

const LEGACY = /^[A-Za-z0-9_-]{43}$/;
const LINK = /^[A-Za-z0-9_-]{65}$/;

export const NOT_FOUND = (): Response =>
  new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

async function sha256(text: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** The token in the address, or null: the last part of the path, which must end in .ics. */
export function tokenOf(url: string): string | null {
  const last = new URL(url).pathname.split('/').filter(Boolean).pop() ?? '';
  if (!last.endsWith('.ics')) return null;
  const token = last.slice(0, -4);
  return LEGACY.test(token) || LINK.test(token) ? token : null;
}

export async function handle(request: Request, deps: Deps): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('GET only', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const token = tokenOf(request.url);
  if (!token) return NOT_FOUND();

  const base = deps.get('SUPABASE_URL');
  const key = deps.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!base || !key) throw new Error('the function has no database credentials');

  const isLink = LINK.test(token);
  const response = await deps.fetch(`${base}/rest/v1/rpc/${isLink ? 'calendar_feed_read_link' : 'calendar_feed_read'}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(isLink ? { p_token: token } : { p_token_hash: await sha256(token) }),
  });
  if (!response.ok) throw new Error(`${isLink ? 'calendar_feed_read_link' : 'calendar_feed_read'}: ${response.status}`);
  const feed = (await response.json()) as Feed | null;
  if (!feed) return NOT_FOUND();

  const body = buildCalendar(feed, deps.now?.() ?? new Date());
  return new Response(request.method === 'HEAD' ? null : body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="pam-visits.ics"',
      'Cache-Control': 'private, max-age=300',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
