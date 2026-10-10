// sms-inbound: what a person texted back to Pam, as far as it changes what Pam
// may do (D-460). The handler, with everything it touches passed in so it can be
// tested; index.ts wires it to Deno.
//
// Twilio calls it when somebody replies to a text. Twilio already stops texting a
// number that replied STOP and answers STOP and HELP itself (Advanced Opt-Out);
// what Pam never did was learn it. This records it, and nothing else:
//
//   * STOP (or a word that means it)  -> `record_sms_stop`: sets `sms_stopped_at`
//     on the profile with that number, which every screen and the dispatcher read.
//   * START or UNSTOP                 -> `record_sms_start`: clears it, nothing more.
//   * anything else (HELP, YES, NO, a reply in words) is not answered and not kept.
//     YES and NO to "did you make it" are a later job: "YES" is also Twilio's own
//     opt-in word, so it is left alone until that keyword is changed in Twilio.
//
// The rules that matter:
//
//   1. Off until switched on. Without SMS_INBOUND=on it answers an empty reply and
//      touches nothing: not the database, not the signature.
//   2. Only Twilio. A request whose X-Twilio-Signature does not match the auth
//      token and the exact URL is refused (403) before it is read. Without the
//      token or the URL set up it will not run (503).
//   3. It never answers with words. The confirmation and the HELP reply are
//      Twilio's, set once in its console; a second reply from here would be two
//      texts for one.
//   4. It never logs a phone number or what was said: counts and the kind, only.

import { sameSignature, twilioSignature } from './signature.ts';

const XML = { 'Content-Type': 'text/xml' };

/** Twilio wants TwiML back; an empty <Response/> means "send nothing". */
export function empty(status = 200): Response {
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', { status, headers: XML });
}

export interface Deps {
  readonly get: (name: string) => string | undefined;
  readonly fetch: typeof fetch;
}

/** The words that stop texts. Twilio's own list, so Pam and Twilio agree. */
const STOP_WORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);
/** The words that start them again. Not YES: that is a different job. */
const START_WORDS = new Set(['START', 'UNSTOP']);

export type Intent = 'stop' | 'start' | 'other';

/**
 * What a reply means to Pam. Twilio's `OptOutType` says so when Advanced Opt-Out
 * is on, and is trusted first; otherwise the first word of the message, upper
 * case, without punctuation, counts only when it is the whole message.
 */
export function intentOf(params: Readonly<Record<string, string>>): Intent {
  const kind = (params['OptOutType'] ?? '').trim().toUpperCase();
  if (kind === 'STOP') return 'stop';
  if (kind === 'START') return 'start';
  if (kind) return 'other';
  const word = (params['Body'] ?? '').trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (STOP_WORDS.has(word)) return 'stop';
  if (START_WORDS.has(word)) return 'start';
  return 'other';
}

async function rpc(deps: Deps, name: string, phone: string): Promise<boolean> {
  const url = deps.get('SUPABASE_URL');
  const key = deps.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('the function has no database credentials');
  const response = await deps.fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_phone: phone }),
  });
  // The status only: nothing about the number.
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  return (await response.json()) === true;
}

export async function handle(request: Request, deps: Deps): Promise<Response> {
  if (deps.get('SMS_INBOUND') !== 'on') return empty();
  if (request.method !== 'POST') return new Response('POST only', { status: 405 });

  const token = deps.get('TWILIO_AUTH_TOKEN');
  const publicUrl = deps.get('SMS_INBOUND_URL');
  if (!token || !publicUrl) return new Response('not set up', { status: 503 });

  // Read the form as Twilio sent it: every field is part of the signature.
  const params: Record<string, string> = {};
  for (const [name, value] of new URLSearchParams(await request.text())) params[name] = value;

  const given = request.headers.get('x-twilio-signature') ?? '';
  const expected = await twilioSignature(token, publicUrl, params);
  if (!sameSignature(given, expected)) {
    console.warn('sms-inbound: a request failed the signature check');
    return new Response('not Twilio', { status: 403 });
  }

  const from = params['From'] ?? '';
  const intent = intentOf(params);
  if (intent === 'other' || !from) return empty();

  const recorded = await rpc(deps, intent === 'stop' ? 'record_sms_stop' : 'record_sms_start', from);
  console.log(`sms-inbound: ${intent} ${recorded ? 'recorded' : 'no change'}`);
  return empty();
}
