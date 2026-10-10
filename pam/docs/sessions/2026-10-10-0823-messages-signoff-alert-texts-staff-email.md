# 2026-10-10 — Messages & notifications (Nico): Will's sign-off on the alert texts and the staff invite email

**Branch:** `claude/messages-signoff-alert-texts-staff-email` · **Lane:** Messages & notifications

Will's words, relayed by Mira: "Staff email: No need to mention expiry days. Invite CTA button
should say Accept Invite. Remember we're a human-touch company. Speak human please. Then
approved. Text alerts: approved." Full record: D-461.

## What changed

- The four Text alerts texts carry Will's name (English, Spanish) and the 10 October approval-to-learn-from
  (the other five languages). Wording unchanged. `AWAITING_SIGNATURE` in the two SMS test files is now empty.
- The staff invite email is Will's English exactly, with no days anywhere; its own fallback line (the
  expired-link email is untouched); "Accept invite" for the button; the other six languages rewritten to
  match, as drafts approved to learn from. The sender's bundle regenerated.
- Storybook page text, `docs/email-setup.md` and the samples file updated to say it is signed.

## What was wrong, and what missed it

- Nothing broke. One thing to remember: the generated bundles (`templates.json`, `bundle.json`) are
  rewritten by the first test run, so a signature change fails the bundle tests once and passes the second
  time; run the config tests twice.
- The old tests encoded "30 days" in every language of the staff email. A request to remove expiry meant
  changing the test, not only the words; the new test reads what a person reads and fails on a number of days.

## Decisions made

- D-461, including the one thing Will did not say himself: the other six languages of the staff email
  are sent as drafts approved to learn from, on Mira's instruction. Emptying `reviewedBy` for a language
  sends it in English.

## Verified

- Config 961 pass (twice), `copy:status` in step, `tsc` clean in config and web, Storybook builds, fit audit on
  the staff invite email stories: clean. English email looked at in Storybook at 320px.
- Not run: the database suite (no migration changed), Playwright (no screen changed).

## Left undone

- Nothing sends yet: the queue migration was applied by the merge desk, but the function is not deployed,
  the secrets and the mail domain are not set, and `INVITE_EMAILS` is off.
- Nothing queues the four alert texts, so none sends.

## Needs a human

- Will: whether the staff email's other six languages should wait for a native reader (see D-461).
