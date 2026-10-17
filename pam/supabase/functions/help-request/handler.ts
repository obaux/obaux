// help-request: the help desk's "Still stuck?" form, forwarded to Pam's inbox (A28, D-521).
//
// The flow Will set: problem -> help desk -> email forward. A person who has read the help desk and
// still needs a person fills in a form on joinpam.org; this sends ONE email from Pam's address to
// hello@joinpam.org with their address as reply-to. The handler is written with everything it
// touches passed in so it can be tested; index.ts wires it to Deno.
//
// The rules that matter:
//   1. Off until somebody switches it on. Without HELP_REQUESTS_LIVE=on it answers 503
//      { live: false } and touches nothing: not the database, not the email service. The form
//      reads that answer and shows the address instead.
//   2. It only ever mails hello@joinpam.org. The address is a constant, not a setting, so no secret
//      or request can aim it elsewhere.
//   3. Abuse: CORS and an Origin check for joinpam.org only, a honeypot, hard length caps, a body
//      size cap, and a limit per caller and overall (`help_request_allowed`, migration
//      20261011041940) keyed on a salted hash of the caller's address, never the address.
//   4. What goes in the email: what they typed, how to answer them, who they say they are (member,
//      program, case manager: any of them, asked on the form), the page they came from, the language,
//      and their role if known. No member records: it reads none. Who they say they are is in the
//      email only: it is not stored, logged, or part of the duplicate check.
//   5. It never logs a word of the request, an address or a name: statuses and counts.

import type { Emailer } from './provider.ts';

export const TO = 'hello@joinpam.org';
export const ALLOWED_ORIGINS: readonly string[] = ['https://joinpam.org', 'https://www.joinpam.org'];

export const LIMITS = {
  message: 3000,
  email: 254,
  name: 100,
  page: 300,
  lang: 16,
  role: 40,
  body: 12_000,
} as const;

/** Who the form lets a person say they are (Will, 13 October; not_yet from Sage's fourth choice). Anything else in `roles` is dropped. */
export const WHO = ['member', 'program', 'case_manager', 'not_yet'] as const;
export type Who = (typeof WHO)[number];
const WHO_WORDS: Record<Who, string> = {
  member: 'a member',
  program: 'a program',
  case_manager: 'a case manager',
  not_yet: 'not using Pam yet',
};
const MAX_ROLES = 10;

/**
 * `roles`: an array of the values above, any of them, in any order. Each is lower-cased and spaces or hyphens
 * read as underscores ("Case manager" is `case_manager`). Repeats and anything that is not one of the three are
 * dropped, not refused: a label the site has not been told about must not cost the person their message. Not an
 * array (when given at all), or an absurd number of entries, is refused. Always returned in the same order.
 */
export function rolesOf(input: Record<string, unknown>): Who[] {
  const raw = input['roles'];
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > MAX_ROLES) throw new Invalid('roles');
  const seen = new Set<Who>();
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const value = item.replace(CONTROL, '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    if ((WHO as readonly string[]).includes(value)) seen.add(value as Who);
  }
  // "I don't use Pam yet" ticked beside a role is the role: the role says more.
  if (seen.size > 1) seen.delete('not_yet');
  return WHO.filter((w) => seen.has(w));
}

/** "a member", "a member and a case manager", "a member, a program and a case manager". */
export function saysTheyAre(roles: readonly Who[]): string {
  const words = roles.map((w) => WHO_WORDS[w]);
  if (words.length <= 1) return words[0] ?? 'not said';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

export interface Deps {
  readonly get: (name: string) => string | undefined;
  readonly fetch: typeof fetch;
  readonly emailer: Emailer | null;
}

const EMAIL = /^[^\s@<>"'`,;()[\]\\]+@[^\s@<>"'`,;()[\]\\]+\.[^\s@<>"'`,;()[\]\\]{2,}$/;
// Control characters and the two Unicode line separators, built from character codes: written as escapes in a
// regex literal, the deploy tool turns the last two into real line breaks and the source stops compiling.
const CONTROL = new RegExp(
  `[${Array.from({ length: 32 }, (_, code) => (code === 9 || code === 10 || code === 13 ? '' : String.fromCharCode(code))).join('')}${String.fromCharCode(127, 0x2028, 0x2029)}]`,
  'g',
);

function cors(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = { Vary: 'Origin' };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'content-type, apikey, authorization, x-client-info';
    headers['Access-Control-Max-Age'] = '600';
  }
  return headers;
}

function reply(status: number, body: unknown, origin: string | null, extra: Record<string, string> = {}): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(origin), ...extra },
  });
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** A string field, trimmed, control characters out, or null if absent; throws a field name if too long or the wrong kind. */
function field(input: Record<string, unknown>, name: keyof typeof LIMITS, required: boolean): string | null {
  const raw = input[name];
  if (raw === undefined || raw === null || raw === '') {
    if (required) throw new Invalid(name);
    return null;
  }
  if (typeof raw !== 'string') throw new Invalid(name);
  const value = raw.replace(CONTROL, '').trim();
  if (value === '') {
    if (required) throw new Invalid(name);
    return null;
  }
  if (value.length > LIMITS[name]) throw new Invalid(name);
  return value;
}

class Invalid extends Error {
  constructor(readonly fieldName: string) {
    super(fieldName);
  }
}

async function digest(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function callerOf(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return request.headers.get('cf-connecting-ip')?.trim() || forwarded || 'unknown';
}

async function allowed(deps: Deps, who: string): Promise<boolean> {
  const url = deps.get('SUPABASE_URL');
  const key = deps.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('the function has no database credentials');
  const response = await deps.fetch(`${url}/rest/v1/rpc/help_request_allowed`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_who: who }),
  });
  if (!response.ok) throw new Error(`help_request_allowed: ${response.status}`);
  return (await response.json()) === true;
}

export interface Request_ {
  message: string;
  email: string;
  name: string | null;
  page: string | null;
  lang: string | null;
  role: string | null;
  roles?: readonly Who[];
}

export function render(input: Request_): { subject: string; text: string; html: string } {
  const rows: [string, string][] = [
    ['From', input.name ? `${input.name} <${input.email}>` : input.email],
    ['Says they are', saysTheyAre(input.roles ?? [])],
    ['Answer by', `Reply to this email (it goes to ${input.email})`],
    ['Page', input.page ?? 'not given'],
    ['Language', input.lang ?? 'not given'],
    // Only when the site sent one: the form asks "Says they are" now, and "Role: not known" beside it would confuse.
    ...(input.role ? ([['Role', input.role]] as [string, string][]) : []),
  ];
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${input.message}\n`;
  const html =
    `<table role="presentation" style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5">` +
    rows
      .map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#555"><b>${k}</b></td><td>${escapeHtml(v)}</td></tr>`)
      .join('') +
    `</table><p style="font-family:system-ui,sans-serif;font-size:17px;line-height:1.5;white-space:pre-wrap">${escapeHtml(input.message)}</p>`;
  return { subject: 'Pam help request', text, html };
}

export async function handle(request: Request, deps: Deps): Promise<Response> {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return reply(origin && ALLOWED_ORIGINS.includes(origin) ? 204 : 403, null, origin);
  }
  if (deps.get('HELP_REQUESTS_LIVE') !== 'on') return reply(503, { live: false }, origin);
  if (request.method !== 'POST') return reply(405, { error: 'POST only' }, origin, { Allow: 'POST, OPTIONS' });
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return reply(403, { error: 'not allowed from here' }, origin);

  const salt = deps.get('HELP_REQUEST_SALT');
  const from = deps.get('EMAIL_FROM');
  if (!deps.emailer || !from || !salt) {
    return reply(503, { live: false, error: 'not set up: the email service key, EMAIL_FROM and HELP_REQUEST_SALT are needed' }, origin);
  }

  const raw = await request.text().catch(() => '');
  if (raw.length > LIMITS.body) return reply(413, { error: 'too_large' }, origin);
  let input: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('shape');
    input = parsed as Record<string, unknown>;
  } catch {
    return reply(400, { error: 'invalid', field: 'body' }, origin);
  }

  // The honeypot: a field no person sees. A bot fills it; it is told all is well and nothing is sent.
  if (typeof input['website'] === 'string' && input['website'].trim() !== '') return reply(200, { ok: true }, origin);

  let clean: Request_;
  try {
    const email = field(input, 'email', true)!;
    if (!EMAIL.test(email)) throw new Invalid('email');
    clean = {
      message: field(input, 'message', true)!,
      email,
      name: field(input, 'name', false),
      page: field(input, 'page', false),
      lang: field(input, 'lang', false),
      role: field(input, 'role', false),
      roles: rolesOf(input),
    };
  } catch (error) {
    if (error instanceof Invalid) return reply(400, { error: 'invalid', field: error.fieldName }, origin);
    throw error;
  }

  if (!(await allowed(deps, (await digest(`${salt}|${callerOf(request)}`)).slice(0, 32)))) {
    return reply(429, { error: 'rate_limited' }, origin, { 'Retry-After': '3600' });
  }

  const email = render(clean);
  try {
    await deps.emailer.send({
      to: TO,
      from,
      replyTo: clean.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      // The same request twice (a double tap) is one email.
      idempotencyKey: `help-request-${(await digest(`${clean.email}|${clean.message}|${clean.page ?? ''}`)).slice(0, 40)}`,
    });
  } catch (error) {
    console.error('help request not sent', error instanceof Error ? error.message : 'unknown');
    return reply(502, { error: 'send_failed' }, origin);
  }
  return reply(200, { ok: true }, origin);
}
