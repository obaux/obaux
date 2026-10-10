# D-481 — Nothing but an account text leaves Pam until texts_live is on

**Date:** 2026-10-10 · **Branch:** `claude/messages-alert-texts-wired`

The merge desk found the app-side hold on the Text alerts switches (D-478) was not enough. On main, turning on
"a saved place closes" sets `sms_enabled`, which is the consent `queue_trip_reminder` reads; two accounts
already said yes, and from tonight trips save to the account, so a day-before reminder could have been queued
and sent by the dispatcher the next day — before Will's go and before the carrier filing is approved.

So a server-side lock, in the one place every text passes: migration
`20261010141859_no_text_but_an_account_text_leaves_pam_until_texts_live_is.sql` (expand only).

- `app_settings.texts_live`, inserted `'off'`, never overwritten (`on conflict do nothing`).
- `claim_outbound_messages` (same signature; the body of 20261010130754 with one more condition) hands the
  dispatcher only the account texts while the setting is anything but exactly `'on'`: sign-in code, a decision
  on a staff request (approved or denied), the notice that parts of Pam are off, the two invitations — the same
  list as the "never agreed" exemption. Everything else stays **scheduled**, not cancelled. The claim's other
  rules still run, so a stale time-bound text is cancelled by the 12-hour and visit-started rules rather than sent
  when the switch goes on. A missing setting holds too.
- Opening it: `update app_settings set value = 'on' where key = 'texts_live'`, by the merge desk, with
  `ALERT_TEXTS_LIVE` and `claude/messages-reply-start`, on the day Will says go. Setting it back to `'off'` is the
  gentlest way to stop: the clock keeps running and account texts keep going.

DB tests that exercise sending turn it on at their top; test 44 (numbered 43 on its branch) proves off holds, on sends, off holds again, and
that the insert is idempotent. A future test that claims a reminder or alert must do the same.
