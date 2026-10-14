// docusign-spike — THROWAWAY (card a88, 14 October 2026): a sandbox test of DocuSign embedded signing. See docs/research/2026-10-14-docusign-spike-plan.md.
// Deploy with JWT verification ON (the anon key passes). Never merged; deleted afterwards with its secrets.
//
// The lock (all of it, in this order):
//   1. DOCUSIGN_SPIKE_UNTIL (a date) must be set and not passed: after it, every call is 410.
//   2. DOCUSIGN_SPIKE_KEY_SHA256 must be set; the x-spike-key header is hashed and compared with it in constant time.
//   3. POST, JSON, a fixed list of actions. No action takes a URL or a host from the caller.
//   4. DocuSign is reached through one door (docusign.ts `guarded`): https, account-d.docusign.com or demo.docusign.net, nothing else.
// Made-up data only. Nothing is written to a database; nothing the caller sends or DocuSign answers is logged.

import { ConsentRequired, DocuSignError, call, consentUrl, guarded, signIn, type Config, type Session } from './docusign.ts';
import { envelopeDefinition, FORMS, documentsFor, SIGNER, type Which } from './forms.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-spike-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
export function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}

export interface Deps {
  readonly get: (name: string) => string | undefined;
  readonly fetch: typeof fetch;
  readonly now?: () => number;
}

export const ACTIONS = ['consent', 'whoami', 'envelope', 'mint', 'status', 'purge', 'template-view'] as const;
type Action = (typeof ACTIONS)[number];

export async function sha256Hex(text: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Equal in the same time however much of it matches. */
export function sameText(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let difference = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) difference |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return difference === 0;
}

const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

let cached: Session | null = null;

function config(deps: Deps): Config | null {
  const integrationKey = deps.get('DOCUSIGN_INTEGRATION_KEY');
  const userId = deps.get('DOCUSIGN_USER_ID');
  const accountId = deps.get('DOCUSIGN_ACCOUNT_ID');
  const privateKey = deps.get('DOCUSIGN_PRIVATE_KEY');
  return integrationKey && userId && accountId && privateKey ? { integrationKey, userId, accountId, privateKey } : null;
}

export async function handle(request: Request, deps: Deps): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const now = (deps.now ?? Date.now)();

  // 1 and 2: the end date and the key.
  const until = Date.parse(deps.get('DOCUSIGN_SPIKE_UNTIL') ?? '');
  const keyHash = deps.get('DOCUSIGN_SPIKE_KEY_SHA256');
  if (Number.isNaN(until) || !keyHash) return reply(503, { error: 'not set up' });
  if (now > until) return reply(410, { error: 'the spike has ended' });
  if (request.method !== 'POST') return reply(405, { error: 'POST only' });
  const header = request.headers.get('x-spike-key') ?? '';
  if (!header || !sameText(await sha256Hex(header), keyHash.toLowerCase())) return reply(401, { error: 'no' });

  // 3: a fixed list of actions.
  const text = await request.text();
  if (text.length > 4000) return reply(413, { error: 'too large' });
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') throw new Error('object');
    body = parsed as Record<string, unknown>;
  } catch {
    return reply(400, { error: 'a JSON object is expected' });
  }
  const action = body['action'];
  if (typeof action !== 'string' || !(ACTIONS as readonly string[]).includes(action)) return reply(400, { error: 'unknown action' });

  const cfg = config(deps);
  if (!cfg) return reply(503, { error: 'DocuSign is not set up' });
  if (action === 'consent') return reply(200, { url: consentUrl(cfg.integrationKey) });

  // 4: DocuSign, through its one door.
  const door = guarded(deps.fetch);
  try {
    if (!cached || cached.expiresAt <= now) cached = await signIn(cfg, door, now);
    const session = cached;
    const hook = `${deps.get('SUPABASE_URL') ?? ''}/functions/v1/docusign-spike-hook`;

    switch (action as Action) {
      case 'whoami':
        return reply(200, { consent: 'granted', accountMatches: true, apiHost: new URL(session.base).hostname, forms: FORMS.map((f) => f.id) });

      case 'envelope': {
        const which = body['which'];
        if (which !== 'E1' && which !== 'E100' && which !== 'Ear') return reply(400, { error: 'which: E1, E100 or Ear' });
        // Connect, for the one envelope that checks the payload: only once the hook has its key.
        const definition = envelopeDefinition(which as Which, body['connect'] === true ? { connectUrl: `${hook}/connect` } : {});
        const made = (await call(session, door, 'POST', '/envelopes', definition)) as { envelopeId?: string; status?: string };
        return reply(200, { envelopeId: made.envelopeId, status: made.status, documents: documentsFor(which as Which).length });
      }

      case 'mint': {
        const id = body['envelopeId'];
        if (typeof id !== 'string' || !UUID.test(id)) return reply(400, { error: 'an envelope id is needed' });
        const focused = body['display'] === 'focused';
        const origin = typeof body['origin'] === 'string' ? body['origin'] : '';
        if (focused && !/^https:\/\/[A-Za-z0-9.-]+(:\d+)?$/.test(origin)) return reply(400, { error: 'origin: an https origin for the frame' });
        const view = (await call(session, door, 'POST', `/envelopes/${id}/views/recipient`, {
          returnUrl: `${hook}/return`,
          authenticationMethod: 'none',
          email: SIGNER.email,
          userName: SIGNER.name,
          clientUserId: SIGNER.clientUserId,
          ...(focused ? { frameAncestors: [origin], messageOrigins: ['https://apps-d.docusign.com'] } : {}),
        })) as { url?: string };
        return reply(200, { url: view.url });
      }

      case 'status': {
        const id = body['envelopeId'];
        if (typeof id !== 'string' || !UUID.test(id)) return reply(400, { error: 'an envelope id is needed' });
        const found = (await call(session, door, 'GET', `/envelopes/${id}`)) as Record<string, unknown>;
        return reply(200, { status: found['status'], completedDateTime: found['completedDateTime'] ?? null, statusChangedDateTime: found['statusChangedDateTime'] ?? null });
      }

      case 'purge': {
        const id = body['envelopeId'];
        if (typeof id !== 'string' || !UUID.test(id)) return reply(400, { error: 'an envelope id is needed' });
        const done = (await call(session, door, 'PUT', `/envelopes/${id}?advanced_update=true`, { purgeState: 'documents_and_metadata_queued' })) as Record<string, unknown>;
        return reply(200, { purgeState: done['purgeState'] ?? null, status: done['status'] ?? null });
      }

      case 'template-view': {
        // The lead's embedded tagging: a template from F1 with no fields, then a link to DocuSign's own editor for it.
        const form = FORMS[0];
        const template = (await call(session, door, 'POST', '/templates', {
          name: 'Spike F1 (no fields)',
          shared: 'false',
          emailSubject: 'Made-up form',
          documents: [documentsFor('E1')[0]].map(({ documentBase64, name, fileExtension }) => ({ documentBase64, name, fileExtension, documentId: '1' })),
          recipients: { signers: [{ recipientId: '1', roleName: 'Member', routingOrder: '1' }] },
        })) as { templateId?: string };
        if (!template.templateId) return reply(502, { error: 'no template' });
        const view = (await call(session, door, 'POST', `/templates/${template.templateId}/views/edit`, { returnUrl: `${hook}/return` })) as { url?: string };
        return reply(200, { form: form.id, templateId: template.templateId, url: view.url });
      }
    }
    return reply(400, { error: 'unknown action' });
  } catch (error) {
    if (error instanceof ConsentRequired) return reply(200, { consent: 'required', url: consentUrl(cfg.integrationKey) });
    if (error instanceof DocuSignError) {
      cached = error.status === 401 ? null : cached;
      return reply(502, { error: 'DocuSign said no', status: error.status, errorCode: error.errorCode, message: error.message });
    }
    // A blocked host or anything unexpected: the kind of thing, never what was sent.
    return reply(500, { error: error instanceof Error && error.message.startsWith('blocked:') ? error.message : 'something went wrong' });
  }
}

/** For the tests: forget the signed-in session. */
export function forgetSession(): void {
  cached = null;
}
