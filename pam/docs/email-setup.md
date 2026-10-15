# Turning on email

Pam can already write two emails: the first one to a case manager or a program lead who has
been invited (D-450), and the fresh link for someone whose link ran out and who asked for
another on the expired-link page (D-476). One setup turns both on. Will approved the English on 10 October 2026 (D-461). It sends
nothing until the steps below are done. Texts are set up separately (`docs/sms-setup.md`).

## What Will does, in order

1. **Pick the domain mail comes from.** Pam's own, not a free address. A subdomain
   such as `mail.<pam domain>` keeps Pam's mail reputation apart from anything else
   on the domain.
2. **Make an account with the email service** (built for Resend; Postmark or SendGrid
   work the same way and need one new file, `provider.ts`). The free tier is enough
   for launch.
3. **Add the domain in that account.** It shows a few DNS records (usually three or
   four: SPF, DKIM, sometimes a return path). Whoever manages the domain's DNS adds
   them; then press Verify. Minutes to a day.
4. **Decide two addresses:** the From (a "Pam" name at the domain) and a Reply-to a
   person reads. Staff may answer an invite with a question.
5. **Create an API key that can only send.** Give it to the merge desk, never to a
   session and never to the repository.
6. **The words are signed.** English by Will (10 October 2026, D-461); the other six
   are written but **not signed** (D-488): that language is sent the English until Will or somebody who reads it signs it, and nobody has said what is
   wrong. Only a person writes `reviewedBy`. Storybook: *Onboarding › First invite
   email (staff)*.
7. **Send one to your own inbox** and look at it in Gmail, Apple Mail and Outlook.

## What the merge desk does with them

Set the function's secrets (names only here, values never):

| Secret | What it is |
|---|---|
| `INVITE_EMAILS` | `on` switches the sender on; anything else, or nothing, is off |
| `RESEND_API_KEY` | the service's key |
| `EMAIL_FROM` | for example `Pam <hello@mail.<domain>>`, on the verified domain |
| `EMAIL_REPLY_TO` | optional: where replies go |
| `APP_URL` | where Pam lives, `https://…`, for the link and the logo |
| `DISPATCH_SECRET` | the shared secret the clocks send. Its value is the vault's `dispatch_secret` (made in the database; see below). Without it this function will not run |

Then, in this order:

1. Apply `20261010063304_staff_invite_emails_wait_in_a_queue`,
   `20261010133313_the_expired_link_email_has_a_queue_the_sender_can_claim` and
   `…_the_clocks_send_the_shared_secret_from_the_vault_and_the` (`list_migrations` first,
   `get_advisors` after). The last makes the shared secret in the vault and has both clocks
   (`dispatch-sms` and `send-invite-emails`, every five minutes) send it. Check: `select jobname, active from
   cron.job;` shows both, and the next `dispatch-sms` answers in `net._http_response` are still 200.
2. `supabase functions deploy send-invite-emails`.
3. **Will** copies the secret from the dashboard into the function secret `DISPATCH_SECRET` (below).
   **This comes after step 1, never before:** the clock must already be sending the header, or
   `dispatch-sms` refuses every call — sign-in codes included — until it does.
4. Set `INVITE_EMAILS=on` last.

### Will's steps in the dashboard (once)

The secret is made by the database. Nobody types one, and it is never in a message or a file.

1. Open the Supabase project → **Project Settings → Vault** (or **Integrations → Vault**).
2. Find the secret named **`dispatch_secret`**. Click the eye to show it, then **copy** it.
3. Open **Project Settings → Edge Functions → Secrets** and add a secret named exactly
   **`DISPATCH_SECRET`**; paste the value; save.
4. Tell the merge desk "secret set". They check that texts still go (a 200 from the next tick,
   not a 401) and then switch the emails on.

If a 401 ever shows up in `select status_code, content from net._http_response order by created desc limit 6;`,
the two don't match (a stray space when pasting is the usual cause): copy it again.

If the English ever loses its sign-off the sender answers "the wording is not signed" and claims
nothing, so switching it on early is harmless.

## If the email lands in Spam

Checked 11 October 2026, after Will's first sample (sent from `hello@mail.joinpam.org` through Resend) landed in his Spam
folder. **Nothing in the email itself is a spam trigger.** It has a plain-text part beside the HTML; it is about 2.5 KB of
HTML and 0.4 KB of text with one small logo (336×124, 9 KB) and one button, so the image-to-text ratio is fine; the link
the person is asked to click is written out in full beside the button and matches it; the subject, title and body use no
words filters dislike beyond "invited"; open and click tracking are off; From is `Pam <hello@mail.joinpam.org>` and
DKIM and SPF are signed by `mail.joinpam.org` / `send.mail.joinpam.org`, so both align with it. A
`List-Unsubscribe` header is not needed for a one-off invitation to one person and would make it look like a mailing.

What is left is the **domain's standing**, which is Will's to fix at the DNS and in his mailbox, in this order:

1. **A DMARC record.** Add a TXT record at `_dmarc.joinpam.org` with `v=DMARC1; p=none; rua=mailto:hello@joinpam.org`.
   `p=none` only asks receivers to report; it blocks nothing. Gmail and Yahoo expect one and mark mail without it down.
   (This container cannot look up DNS, so whether it exists is for Will to check at his DNS host.)
2. **Do not judge it by a forwarded copy.** A message sent to `hello@joinpam.org` is forwarded on by ImprovMX, and forwarding
   breaks SPF at the final inbox, so a mail that arrives that way is often spammed even when it was sent correctly.
   Send the test **straight to a real inbox** (Gmail, iCloud, Outlook), not to the forwarding address.
3. **Say "Not spam" on the first one** in each inbox. A brand-new sending domain has no history; a few real
   "Not spam" and replies teach the filters quickly. A real person replying to it helps most.
4. **Keep the link on Pam's own domain.** `APP_URL` is the host of the button and the logo. If it is the `vercel.app`
   address, the email says it is from joinpam.org but points somewhere else, which filters mark down. Use
   `https://app.joinpam.org` (or the domain Pam is on) once it is live (`docs/changing-the-domain.md`).
5. Send slowly at first: a handful of invitations a day for the first week, not a batch.

If it still lands in Spam after 1 to 3, a spam-testing service (it needs an email sent to an outside address) will say which
check fails; that needs Will's yes first.

## What to know

- Invites made before the migration are not queued: nobody asked for those to go out.
- The language is the inviter's (the invited person has no profile yet); a language
  nobody has signed is sent in English.
- Staff emails go through a mail service. The privacy page does not say so yet.
- **The expired-link email** (D-476) is sent by the same function, in the same run. Wording:
  Will's, 4 October 2026 (English and Spanish; the other five are drafts "approved to
  learn from", and an unsigned language gets the English). It goes to the address typed on
  the expired-link page, in the language that page was in, for any invited role — a member
  too. It carries the fresh invite's link, which works for 30 days. A request older than
  seven days, or whose fresh link has been used or has itself run out, is not sent. **The address typed on the expired-link page is deleted as soon as the link is sent** (D-487), and when a request can no longer be sent (too old, out of tries, or the fresh link used or run out); the row keeps that a link was sent and when, not where. The privacy page says so (Lena). When the
  sender is first switched on it sends the requests still inside those limits: people who
  were told to check their email.
- To see what was sent: `select requested_at, sent_at, address_removed_at, attempts, failure_reason from invite_emails order by requested_at desc limit 10;` (the address is deleted once sent, so this shows `sent_at` and `address_removed_at`, never where).


## The help request forward (A28, D-521)

The help desk's "Still stuck?" form posts to the `help-request` function, which sends one email to `hello@joinpam.org`
with the person as reply-to. The contract is `docs/help-request-contract.md`. It is built **off**.

Secrets (names only): `HELP_REQUESTS_LIVE` (`on` switches it on; anything else is off and the form shows the address),
`RESEND_API_KEY`, `EMAIL_FROM` (the same as the invite email's), `HELP_REQUEST_SALT` (any long random string; salts the hash
the rate limit keeps). Deploy it with **JWT verification off** (`verify_jwt: false`): the visitor has no Pam login.
Apply migration `20261011041940` first (the limit's table and function). Nothing is sent before Will says "test it": then one
request to `hello@joinpam.org` only, and `HELP_REQUESTS_LIVE=on` after he sees it arrive.
