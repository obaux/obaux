# D-461 — Will signs the staff invite email and the four alert texts, in his words

**Date:** 2026-10-10 · **Branch:** `claude/messages-signoff-alert-texts-staff-email`

Will, 10 October 2026, 08:11 UTC, relayed and quoted by Mira (the merge desk): "Staff
email: No need to mention expiry days. Invite CTA button should say Accept Invite.
Remember we're a human-touch company. Speak human please. Then approved. Text alerts:
approved."

I (Nico) never fill in `reviewedBy` on my own authority (D-450, D-453). This is Will's
sign-off, given in so many words and carried to me by the merge desk, as `team.md` provides
for his decisions; the words are above.

## What changed

- **The four Text alerts texts** (`message_waiting`, `visit_booked`, `booking_changed`,
  `trip_planned`) carry `Will (Oba), 10 October 2026` in English and Spanish, wording
  unchanged. The other five languages carry `Will (Oba), 10 October 2026 — approved to learn
  from; no native reader yet` (`APPROVED_TO_LEARN_FROM_ALERTS`): the 9 October convention
  (D-429), dated the day it was given. Nothing queues them yet, so none sends; the Text alerts
  screen still says "coming soon" until one is built and joins `LIVE`.
- **The staff invite email, English, exactly as Will approved it** (Mira gave the words):
  "You're invited to join Pam" / "We'd love to have you with us." / "You're invited to Pam" /
  "Hi! {inviter} would love for your program to be part of Pam. Pam helps people find programs
  like yours and plan a visit. Accept your invite to set up your program." (and for a case
  manager: "…to join Pam as a case manager. Pam helps the people you support find services,
  plan visits and stay in touch with you. Accept your invite to get started.") / button "Accept
  invite" / "If the button doesn't work, copy this link into your browser:" / "You're getting
  this because someone invited you to Pam. If it's not for you, you can just ignore it."
  `reviewedBy` is `Will, 10 October 2026`. **No expiry days anywhere, in any language**: a test
  reads subject, preheader and body in all seven and fails on a number of days.
- **The staff email has its own fallback line**, so the expired-link email is untouched (a test
  says so: its button, its line and its 30 days are as they were).
- **The other six languages** carry the same warmth and meaning (no expiry; the button means
  "Accept invite": Aceptar invitación, Aceitar convite, 接受邀请, 接受邀請, Принять приглашение,
  اقبل الدعوة). Drafts under the 9 October convention, `…approved to learn from; no native
  reader yet`. **I applied that convention to the staff email's other six languages on Mira's
  instruction ("Keep them as drafts by the D-429 convention"); Will approved the English
  himself and did not say the others. If he does not want them sent until a native reader has
  signed, emptying `reviewedBy` for a language sends that language in English.** Spanish is in
  this group too.

## What a later session might reverse

- The convention above, per language.
- "Hi!" in the body: Will's own word, kept in English; the others open with the natural
  greeting of the language (¡Hola!, Oi!, 您好！, Здравствуйте!, مرحبا!).
- The sender's bundle now says it can send. It still sends nothing until the migration, the
  function, the secrets and `INVITE_EMAILS=on` are in place (`docs/email-setup.md`), which is
  the merge desk's and needs the mail domain.
