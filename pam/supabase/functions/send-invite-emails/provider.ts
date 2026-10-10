// The one place an email leaves Pam: a call to Resend's API, with the key in
// the function's own secrets (never in the app, never in this repository).
//
// It is an `Emailer` like any other: swapping the service (Postmark, SendGrid)
// means writing another one of these, nothing else. What it sends is the
// address, the sender, the subject and the words of the email, and an
// idempotency key (the invite's id) so that a retry after a crash cannot
// become a second email. It never logs any of them: a failure carries the
// service's status and, so a refusal can be understood, two short fields of its
// error body (`name` and `message`) with anything that looks like an address
// taken out (`explain`). An error body can echo the request, and the request is
// somebody's address, so nothing else of the body is kept.

export interface Outgoing {
  to: string;
  from: string;
  replyTo: string | null;
  subject: string;
  html: string;
  text: string;
  /** The same key for the same email, however many times it is tried. */
  idempotencyKey: string;
}

export interface Emailer {
  readonly name: string;
  send(email: Outgoing): Promise<void>;
}

const ADDRESS = /[^\s@<>"'`,;()[\]]+@[^\s@<>"'`,;()[\]]+/g;
const KEY = /\bre_[A-Za-z0-9_]{6,}\b/g;
const MAX_DETAIL = 200;

/**
 * What a refusal says, safe to keep: Resend's error `name` and `message`, any address replaced by
 * [address] (and anything shaped like one of its API keys by [key]), on one line, cut to about 200
 * characters. Nothing else of the body. A body that is not JSON, or has neither field, says nothing.
 * Never throws.
 */
export function explain(body: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return '';
  }
  if (typeof parsed !== 'object' || parsed === null) return '';
  const { name, message } = parsed as { name?: unknown; message?: unknown };
  const parts = [name, message].filter((part): part is string => typeof part === 'string' && part.trim() !== '');
  const text = parts
    .join(': ')
    .replace(ADDRESS, '[address]')
    .replace(KEY, '[key]')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > MAX_DETAIL ? `${text.slice(0, MAX_DETAIL - 1).trimEnd()}…` : text;
}

export function resendEmailer(apiKey: string, fetcher: typeof fetch = fetch): Emailer {
  return {
    name: 'resend',
    async send(email) {
      const response = await fetcher('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': email.idempotencyKey,
        },
        body: JSON.stringify({
          from: email.from,
          to: [email.to],
          ...(email.replyTo ? { reply_to: email.replyTo } : {}),
          subject: email.subject,
          html: email.html,
          text: email.text,
        }),
      });
      if (!response.ok) {
        const detail = explain(await response.text().catch(() => ''));
        throw new Error(`the email service answered ${response.status}${detail ? `: ${detail}` : ''}`);
      }
    },
  };
}
