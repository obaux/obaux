// docusign-spike-hook — THROWAWAY (card a88). Deploy with JWT verification OFF: DocuSign and a browser call it.
//   POST …/connect  the Connect webhook. Until DOCUSIGN_CONNECT_KEY is set it answers 503 "not set up". Then it checks DocuSign's HMAC and
//                   logs the envelope id, the status and the NAMES of the keys in the payload. Only while DOCUSIGN_SPIKE_LOG_PAYLOAD is "1"
//                   (set for the one E1 check of what Connect carries, made-up data, then removed) does it log the whole payload.
//   GET  …/return   where a signer lands. It prints the event name DocuSign adds (only from a fixed list) and nothing else.
// It calls nothing out. After DOCUSIGN_SPIKE_UNTIL it answers 410.

export interface Deps {
  readonly get: (name: string) => string | undefined;
  readonly log: (line: string) => void;
  readonly now?: () => number;
}

export const EVENTS = ['signing_complete', 'cancel', 'decline', 'session_timeout', 'ttl_expired', 'exception', 'fax_pending', 'id_check_failed', 'viewing_complete', 'access_code_failed'] as const;

const text = (status: number, body: string) => new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

function sameText(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let difference = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) difference |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return difference === 0;
}

export async function hmacBase64(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
  return btoa(String.fromCharCode(...signature));
}

/** DocuSign signs with each Connect key in turn: x-docusign-signature-1, -2, and so on. Any one matching is enough. */
export async function signed(request: Request, secret: string, body: string): Promise<boolean> {
  const expected = await hmacBase64(secret, body);
  for (let n = 1; n <= 5; n += 1) {
    const got = request.headers.get(`x-docusign-signature-${n}`);
    if (got && sameText(got, expected)) return true;
  }
  return false;
}

export async function handle(request: Request, deps: Deps): Promise<Response> {
  const until = Date.parse(deps.get('DOCUSIGN_SPIKE_UNTIL') ?? '');
  if (Number.isNaN(until)) return text(503, 'not set up');
  if ((deps.now ?? Date.now)() > until) return text(410, 'the spike has ended');
  const path = new URL(request.url).pathname.replace(/\/+$/, '');

  if (path.endsWith('/return') && request.method === 'GET') {
    const event = new URL(request.url).searchParams.get('event') ?? '';
    return text(200, `event=${(EVENTS as readonly string[]).includes(event) ? event : 'other'}`);
  }

  if (path.endsWith('/connect') && request.method === 'POST') {
    const secret = deps.get('DOCUSIGN_CONNECT_KEY');
    if (!secret) return text(503, 'not set up');
    const body = await request.text();
    if (body.length > 2_000_000) return text(413, 'too large');
    if (!(await signed(request, secret, body))) return text(401, 'no');
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(body) as Record<string, unknown>;
    } catch {
      return text(400, 'not JSON');
    }
    const data = (parsed['data'] ?? {}) as Record<string, unknown>;
    const summary = (data['envelopeSummary'] ?? {}) as Record<string, unknown>;
    deps.log(
      JSON.stringify({
        connect: true,
        event: parsed['event'] ?? null,
        envelopeId: data['envelopeId'] ?? null,
        status: summary['status'] ?? null,
        keys: Object.keys(parsed),
        dataKeys: Object.keys(data),
        summaryKeys: Object.keys(summary),
      }),
    );
    if (deps.get('DOCUSIGN_SPIKE_LOG_PAYLOAD') === '1') deps.log(`payload ${body}`);
    return text(200, 'ok');
  }
  return text(404, 'not found');
}
