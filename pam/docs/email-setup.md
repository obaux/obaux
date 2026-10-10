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
   are drafts "approved to learn from" until somebody who reads them says what is
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
| `DISPATCH_SECRET` | the shared secret the scheduler sends; without one the function will not run |

Then, in this order: apply `20261010063304_staff_invite_emails_wait_in_a_queue` and
`20261010133313_the_expired_link_email_has_a_queue_the_sender_can_claim`
(`list_migrations` first, `get_advisors` after); `supabase functions deploy
send-invite-emails`; a schedule that calls it every five minutes with
`x-dispatch-secret` (like 0039/0040); set `INVITE_EMAILS=on` last.

If the English ever loses its sign-off the sender answers "the wording is not signed" and claims
nothing, so switching it on early is harmless.

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
  seven days, or whose fresh link has been used or has itself run out, is not sent. When the
  sender is first switched on it sends the requests still inside those limits: people who
  were told to check their email.
- To see what was sent: `select requested_at, sent_at, attempts, failure_reason from invite_emails order by requested_at desc limit 10;` (the address is in the row; do not paste it anywhere).
