# D-547 — Texting people back is not turned on for now (a61)

**Date:** 2026-10-12 · **Branch:** `claude/messages-a61-record`

**Decided by:** Will, 12 October 2026 (card a61), via Mira: "let's not turn on this for now. It's a nice to have not a must."

Pam does not text people back. Nothing is built for it and nothing is switched on; the help form answers by email only. This covers the whole a61 package: forwarding replies to hello@, the auto-answer `reply_no_read`, the form's phone field and the email's "Reply by text" link as a way for people to be answered, signing the two texts, and the carrier-side steps they depend on.

**Why it is written down:** it was a considered option with a pitch, and a later session should be able to find the pitch and what was left unbuilt rather than re-derive it. The deck outline and its example images are on the branch `origin/claude/messages-pitch-deck` (`docs/proposals/texting-pitch/`, last commit 4c78c4c3). That branch is kept on purpose; it is not for merging.

**Left as it is:** the two account texts and the reminders keep their own rules (`texts_live`, D-481); the sign-in code is sent by Supabase Auth, not Pam. `sms-inbound` (STOP/START) is still not deployed, a cap per number per day and a non-Latin length check are still unbuilt recommendations. `/reply/` (D-524), the super admin's page for answering a help request by text, exists and is unchanged; it is not the same thing as turning this on for everyone.

**To reverse:** Will says so; start from the deck outline above.
