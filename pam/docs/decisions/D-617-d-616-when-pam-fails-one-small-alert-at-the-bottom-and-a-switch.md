# D-617 — D-616 When Pam fails: one small alert at the bottom, and a switch that moves only after its save

**Date:** 2026-10-18 · **Branch:** `claude/pam-design-malfunction`

Will, 18 October, 21:14 (via the merge desk): *"use the smaller alert banner. Overlaid below at bottom of page … alert pattern
for malfunctions … switch shouldn't turn on if the connection is not established … create an error log."* The job is
called D-616 in the team's messages; this is its record, numbered by the claim.

## Decided

1. **A malfunction is Pam failing, not the person**: a failed save, switch or send.
2. **One small alert says so.** `CompactNotice` (D-509), `role="alert"`, fixed at the bottom of the screen above the tab bar,
   the safe area and the keyboard. It never covers the control that failed (the control is scrolled clear of it) and takes no
   taps. The words are Lena's `notice.malfunction`; there is no reason and no Contact Pam button.
3. **It has no timer.** It stays until the next tap or key, a successful retry, or leaving the screen (WCAG 2.2.1).
4. **One host.** `MalfunctionProvider` and `useMalfunction().show(action, error, control)` in `apps/web/src/lib/malfunction.tsx`.
   `show` also logs through `reportAppError({ action, code })`; the alert shows even when the log is off (`app_errors_live`).
5. **A reason the person can fix stays inline** (a wrong code, a file too big); a page that cannot load keeps its `Notice`
   card; a failed message send keeps "Not sent" on the bubble, logged, with no overlay.
6. **A switch moves only after its save succeeds**, and shows it is saving (`isLoading`) while it does. Astryx's
   `changeAction` moves the switch first and puts it back on a failure, so the screen uses `onChange`.
7. **No answer in 15 s is a failure** (a send keeps its 30 s). A save that lands late is read back (`settleWithin`'s `late`,
   and again on the next focus), so the switch follows what the database says (Iris's A6).
8. **Instant-save controls follow the switch rule** (person star, saved heart, language picker, role switcher); the owner of
   each converts their own file. This job converts Text alerts.
9. **The log carries a code, never text and nothing about the account** (Nico: HTTP status, 5-character SQLSTATE, or
   offline / timeout / unknown).

## Why

A switch that goes on and then off again tells a person with little reason to trust a phone that Pam is unreliable, and says
nothing about what to do. One short line in a fixed place, with the control left where it was, is the one thing they can
act on (try again). The old way put a card under the row, which pushed the list and could fall off the screen at 320px.

## What a later session might reverse

- The 15 s limit (it is a guess from how long a person waits before tapping again).
- No reason in the alert: if the log shows one cause dominating (offline), a second line for that cause alone could help.
- The save functions still return only true or false, so the log can say only offline / unknown / timeout for Text alerts
  until Nico's `useReminderConsent.ts` returns the error.

Proofs: `e2e/alerts.spec.ts` (B3, saving, A6, dismissal), each failing on `main` at 4d39ccca. Pictures:
`docs/design/review/2026-10-18-d616-*`.
