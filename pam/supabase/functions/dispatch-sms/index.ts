// The dispatcher. Runs on a schedule, sends the messages the database says are
// due, and is deliberately the least clever part of the SMS path.
//
// Everything that decides WHETHER a message may go out lives in the database
// (migration 0039): quiet hours, the STOP list, and atomic claiming. This
// function decides only HOW one is worded, and it refuses to send copy no human
// has signed off.
//
// The three refusals, in order of how much they matter:
//
//   1. No `reviewedBy` on the template  -> nothing sends. This is the one that
//      keeps PAM silent until Will reads the copy.
//   2. Fails the safety check           -> that message is dropped and logged.
//      §9: no message may reveal justice involvement, exceed 160 characters,
//      or carry emoji.
//   3. Twilio refuses it                -> reported back so it shows in the log
//      rather than disappearing as "sent".
//
// The template bundle is generated from packages/config/src/sms-templates.ts,
// which is where the copy is reviewed and tested. Editing templates.json by
// hand puts unreviewed words in front of members; run the generator instead.

import bundle from './templates.json' with { type: 'json' };
import { localeOf, render, UnsendableError } from './render.ts';

interface Due {
  id: string;
  // null only for a phone-only row (0055) — a denied staff request, which has
  // no profile. Not read here either way; carried through for the log.
  member_id: string | null;
  phone: string;
  locale: string;
  template_key: string;
  vars: Record<string, string>;
}

const BUNDLE = bundle as Parameters<typeof render>[0];

async function sendViaTwilio(to: string, body: string): Promise<string> {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  const from = Deno.env.get('TWILIO_FROM_NUMBER');
  const messagingService = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID');

  if (!sid || !token || (!from && !messagingService)) {
    throw new UnsendableError('Twilio is not configured');
  }

  const form = new URLSearchParams({ To: to, Body: body });
  if (messagingService) form.set('MessagingServiceSid', messagingService);
  else form.set('From', from!);

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Twilio ${response.status}: ${payload.message ?? 'no detail'}`);
  }
  return payload.sid as string;
}

async function rpc(name: string, args: Record<string, unknown>): Promise<unknown> {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('the function has no database credentials');

  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!response.ok) throw new Error(`${name}: ${response.status} ${await response.text()}`);

  // A function that returns nothing answers with an empty body, and asking an
  // empty body for JSON throws. Reporting a failure used to die here, which left
  // the row marked sent when nothing had been sent — the one outcome the queue
  // must never produce.
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Puts a row back as failed. Never throws: one message that cannot be reported
 * must not stop the rest of the batch from going out.
 */
async function reportFailure(id: string, reason: string): Promise<void> {
  try {
    await rpc('mark_outbound_failed', { p_id: id, p_reason: reason });
  } catch (error) {
    console.error('could not record a failure', id, error);
  }
}

export async function dispatch(limit = 50) {
  const due = (await rpc('claim_outbound_messages', { p_limit: limit })) as Due[];
  let sent = 0;
  const failures: { id: string; reason: string }[] = [];

  for (const row of due) {
    let body: string;
    try {
      body = render(BUNDLE, row.template_key, localeOf(row.locale), row.vars ?? {});
    } catch (error) {
      // Rendering failed, so nothing went out. The row is put back as failed
      // with the reason, which is how an unreviewed template becomes visible in
      // the log instead of a silence nobody notices.
      const reason = error instanceof Error ? error.message : String(error);
      failures.push({ id: row.id, reason });
      await reportFailure(row.id, reason);
      continue;
    }

    try {
      await sendViaTwilio(row.phone, body);
      sent += 1;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failures.push({ id: row.id, reason });
      await reportFailure(row.id, reason);
    }
  }

  return { claimed: due.length, sent, failures };
}

Deno.serve(async (request) => {
  // Called by the scheduler, not by a browser. A shared secret keeps the URL
  // from being a send button for anybody who finds it.
  const expected = Deno.env.get('DISPATCH_SECRET');
  if (expected && request.headers.get('x-dispatch-secret') !== expected) {
    return new Response(JSON.stringify({ error: 'not authorised' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await dispatch();
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
