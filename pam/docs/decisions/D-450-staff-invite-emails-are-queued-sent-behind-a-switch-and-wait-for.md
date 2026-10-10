# D-450 — Staff invite emails are queued, sent behind a switch, and wait for a signature

**Date:** 2026-10-10 · **Branch:** `claude/messages-staff-invite-email`

Will, 10 October 2026, through Mira (the merge desk): "Go ahead and decide, you're the
CTO" — sending emails, starting with staff invites; a transactional email service of the
Resend kind, behind a switch that is off by default, no keys, addresses or domain in the
repository, each email in the reader's language.

## What was built

- **A queue, not a change to `invite_create`.** `20261010063304_staff_invite_emails_wait_in_a_queue.sql`
  (expand only, not applied): `staff_invite_emails` holds one row per staff invite (the
  language, and where it stands), queued by a trigger on `invite_contact_emails`. It holds
  **no address**: the address stays in the one place 0086 put it and is read at the moment
  of sending, so it goes when the invite is redeemed or the account is deleted. Three
  functions for the sender (claim, mark sent, mark failed), service role only.
- **The sender**, `supabase/functions/send-invite-emails`, a pure handler with its
  collaborators passed in (as `translate-messages` does) and a Resend emailer behind an
  `Emailer` interface, so changing service is one file.
- **The first-invite wording**, `STAFF_INVITE_EMAIL`, in all seven languages. The
  expired-link email says "your last link ran out", which is false of a first invite, so
  this is a different email on the same layout.

## The choices a later session might question

1. **The off switch is a secret, `INVITE_EMAILS=on`, and unset means off.** Off answers
   `{ enabled: false }` and touches neither the database nor the email service. Shipping
   the function sends nobody anything.
2. **Nothing is signed, so nothing sends.** Every language's `reviewedBy` is empty,
   English included, and the sender refuses to claim a single row while English is
   unsigned, so waiting for a signature does not use up anybody's five tries. A language
   nobody has signed is sent in English once English is signed, as with texts. I did not
   reuse the 9 October "approved to learn from" for the five newer languages: it was
   given for the expired-link email's words, not these.
3. **The language is the inviter's, not the invitee's.** The invited person has no
   profile, so nothing says what they read. The inviter's `preferred_language` is the
   best guess available and falls back to English. If Will wants the invitee's language,
   the invite form has to ask for it (Accounts & invites' screen) and the queue's
   `locale` takes it.
4. **At-least-once, made exactly-once by the provider.** A claim older than 15 minutes is
   taken again (the sender died); the provider is given `staff-invite-<id>` as an
   idempotency key, so a retry cannot become a second email. Five tries, then it is left
   for a person; the reason (a status, never an address or a word of the email) is kept.
5. **It is not a send button.** A call needs the shared `DISPATCH_SECRET`; with none set
   up the function will not run. It sends only for an invite that is still open (pending,
   unexpired, staff role). Invites made before the migration are not queued — nobody asked
   for those to go out.
6. **Nothing is logged but ids and counts.** Not an address, a link or a word of an email.
7. **The layout exists twice** (the Storybook preview in `@pam/config`, the sender's
   `render.ts`), because the function cannot import the config package. A test renders
   both for every language, role and awkward inviter name and fails if they differ.

## Not done, on purpose

- The expired-link email (`invite_emails`, 0071) is still not sent. The sender is built so
  that is a second claim function and a second template, not a second sender; Will said
  "starting with staff invites".
- The privacy page does not yet say that staff emails go through a mail service. That is
  Languages & legal's file and Will's wording; flagged to the merge desk.
- Existing staff accounts have no email and no screen to add one (D-441, open).
