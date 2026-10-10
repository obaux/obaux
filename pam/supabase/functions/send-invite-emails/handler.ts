// send-invite-emails: the first email to a case manager or a program lead who
// has been invited (D-450). The handler, with everything it touches passed in
// so it can be tested; index.ts wires it to Deno.
//
// Run on a schedule, like the text dispatcher (0039/0040). The rules that matter:
//
//   1. It is off until somebody switches it on. Without INVITE_EMAILS=on it
//      answers { enabled: false } and touches nothing: not the database, not
//      the email service. Shipping this function sends nobody anything.
//   2. It sends nothing while no person has signed the wording
//      (`bundle.json`, from packages/config). It says so and CLAIMS NOTHING, so
//      waiting for a signature does not use up anybody's five tries.
//   3. It is not a send button: a call needs the shared secret
//      (DISPATCH_SECRET), and without one set up it will not run at all.
//   4. The database decides who is worth emailing (`claim_staff_invite_emails`,
//      0 migration 20261010063304: the invite still open, staff role, not sent, under five
//      tries). This decides only how it is worded and sent.
//   5. It never logs an address, a link or a word of an email: ids and counts.

import bundleJson from './bundle.json' with { type: 'json' };
import type { Emailer } from './provider.ts';
import { canSend, localeOf, renderStaffInvite, UnsendableError, type Bundle, type StaffRole } from './render.ts';

export const BUNDLE = bundleJson as unknown as Bundle;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/** Everything the handler touches outside itself, so a test can hand it fakes. */
export interface Deps {
  readonly get: (name: string) => string | undefined;
  readonly fetch: typeof fetch;
  readonly emailer: Emailer | null;
  readonly bundle: Bundle;
  /** Pauses between emails: the service allows a couple a second. */
  readonly sleep: (ms: number) => Promise<void>;
}

interface Due {
  id: string;
  email: string;
  code: string;
  role: StaffRole;
  locale: string;
  inviter_first_name: string | null;
}

/** What the link says, in words a person could read; the real role is the code's (0077). */
const ROLE_IN_LINK: Record<StaffRole, string> = { provider: 'program', admin: 'case-manager' };

async function rpc(deps: Deps, name: string, args: Record<string, unknown>): Promise<unknown> {
  const url = deps.get('SUPABASE_URL');
  const key = deps.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('the function has no database credentials');
  const response = await deps.fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  // Not the body: for the claim it holds addresses.
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/** Puts a row back for another try. Never throws: one that cannot be reported must not stop the rest. */
async function reportFailure(deps: Deps, id: string, reason: string): Promise<void> {
  try {
    await rpc(deps, 'mark_staff_invite_email_failed', { p_id: id, p_reason: reason });
  } catch (error) {
    console.error('could not record a failure', id, error instanceof Error ? error.message : 'unknown');
  }
}

export async function handle(request: Request, deps: Deps): Promise<Response> {
  if (deps.get('INVITE_EMAILS') !== 'on') return reply(200, { enabled: false });

  const secret = deps.get('DISPATCH_SECRET');
  if (!secret) return reply(503, { error: 'not set up: DISPATCH_SECRET is missing' });
  if (request.headers.get('x-dispatch-secret') !== secret) return reply(401, { error: 'not authorised' });

  const from = deps.get('EMAIL_FROM');
  const appUrl = deps.get('APP_URL')?.replace(/\/+$/, '');
  if (!deps.emailer || !from || !appUrl || !/^https:\/\//.test(appUrl)) {
    return reply(503, { error: 'not set up: the email service key, EMAIL_FROM and an https APP_URL are needed' });
  }

  // Nobody has signed the words: wait, and claim nothing.
  if (!canSend(deps.bundle)) return reply(200, { enabled: true, sent: 0, waiting: 'the wording is not signed' });

  const replyTo = deps.get('EMAIL_REPLY_TO') || null;
  const due = (await rpc(deps, 'claim_staff_invite_emails', { p_limit: 20 })) as Due[];
  let sent = 0;
  const failures: { id: string; reason: string }[] = [];

  for (const [index, row] of due.entries()) {
    try {
      const link = `${appUrl}/signin/?invite=${encodeURIComponent(row.code)}&as=${ROLE_IN_LINK[row.role]}`;
      const email = renderStaffInvite(deps.bundle, {
        link,
        role: row.role,
        inviterFirstName: row.inviter_first_name,
        locale: localeOf(row.locale),
        appUrl,
      });
      if (email.locale !== localeOf(row.locale)) {
        // Written in English because nobody has signed that language. Which message and why, never the words.
        console.warn(`sent in English: invite ${row.id} (${row.locale}): that language is not signed`);
      }
      if (index > 0) await deps.sleep(600);
      await deps.emailer.send({
        to: row.email,
        from,
        replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
        idempotencyKey: `staff-invite-${row.id}`,
      });
      // Sent. If this report is lost the row is claimed again after 15 minutes
      // and the same idempotency key makes the service ignore the second send.
      await rpc(deps, 'mark_staff_invite_email_sent', { p_id: row.id });
      sent += 1;
    } catch (error) {
      const reason = error instanceof UnsendableError || error instanceof Error ? error.message : 'unknown';
      failures.push({ id: row.id, reason });
      await reportFailure(deps, row.id, reason);
    }
  }

  return reply(200, { enabled: true, claimed: due.length, sent, failures });
}
