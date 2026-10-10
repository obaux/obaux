# 2026-10-10 — messages texts live switch

**Branch:** `claude/messages-alert-texts-wired` · **Lane:** Messages & notifications (Nico)

## What changed

- Migration `20261010141859_…` (expand): `app_settings.texts_live` ('off'), and `claim_outbound_messages` hands over
  account texts only unless it is 'on'. I checked first that the live claim is 20261010130754's (Mira's md5);
  the new body is that file's with one condition added.
- DB test 43 (new, 11 checks; renumbered 44 at merge); tests 04, 27, 36, 38, 42 turn the switch on at their top because they test sending.
- Runbook: the day's step 7 sets it; the switch-off section starts with setting it to 'off'; sms-setup and
  before-launch say plainly that only account texts can leave Pam until then.

## What was wrong, and what missed it

The app-side hold left a path: an existing yes to texts plus a saved trip would have queued a reminder the
dispatcher sent. The lock belongs where every text passes.

## Decisions made

D-481.

## Verified

Full DB suite (1052 ok).

## Left undone

Nothing. Any future DB test that claims a reminder or alert must turn `texts_live` on.

## Needs a human

The merge desk: apply the migration before tonight's deploy; set 'on' only when Will says go.
