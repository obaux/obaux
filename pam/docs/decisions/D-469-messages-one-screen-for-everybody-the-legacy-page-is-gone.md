# D-469 — Messages: one screen for everybody, the legacy page is gone

**Date:** 2026-10-10 · **Branch:** `claude/messages-remove-legacy`

Case managers and super admins now get the same `MessagesScreen` as everyone else, with
"Conversations | Reported" under the title (D-464). The older two-role page
(`LegacyMessagesPage`) and the example-conversation half of `DummyRows` are deleted; the
merge desk asked for it once D-464 was on main.

- `?show=reported` still opens Reported (the bell's "a message was reported" row).
- A super admin opens on Conversations and has both sections. Before, the legacy page showed a
  super admin Reported only; staff can already message the super admin (0072, D-262), so
  Conversations is the right first view.
- "New message" is hidden while Reported is open, as it was before.
- Every reported-message test in `e2e/messages.spec.ts` is kept and moved to the new switch
  (the title-as-menu is gone). Piper's reported-places tests (D-189) are untouched.

Later sessions might reverse: showing a super admin Reported first when something is waiting.
