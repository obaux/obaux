// The one place an email leaves Pam: a call to Resend's API, with the key in
// the function's own secrets (never in the app, never in this repository).
//
// It is an `Emailer` like any other: swapping the service (Postmark, SendGrid)
// means writing another one of these, nothing else. What it sends is the
// address, the sender, the subject and the words of the email, and an
// idempotency key (the invite's id) so that a retry after a crash cannot
// become a second email. It never logs any of them: a failure carries the
// service's status and nothing else, because an error body can echo the
// request, and the request is somebody's address.

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
      if (!response.ok) throw new Error(`the email service answered ${response.status}`);
    },
  };
}
