# D-488 — The staff invite email's six other languages go out in English until a person signs them

**Date:** 2026-10-10 · **Branch:** `claude/messages-member-address-deleted`

An amendment to D-461. D-461 says plainly that Will approved the English staff invite email "himself", and that the
other six carried "Will (Oba), 10 October 2026 — approved to learn from; no native reader yet" because the merge desk
told me to keep them as drafts by the 9 October convention (D-429), which Will did not say for these six. The sender sends
any language whose `reviewedBy` is non-empty, so those six drafts would have gone to real people as signed.

The merge desk decided (10 October, after I flagged it): **empty the six `reviewedBy` values on the staff invite email.**
Spanish, Portuguese, Simplified and Traditional Chinese, Russian and Arabic now fall back to the English email (A25), until
Will or somebody who reads the language signs them. The wording is unchanged and still in the repository, so signing one is
setting its `reviewedBy` to who read it and when. The sender's bundle was regenerated.

**Not touched:** the expired-link email's five drafts (`INVITE_EMAIL_MORE`), which Will approved to learn from himself on
9 October. The texts' own sign-offs are unchanged.

Tests: the staff email's tests now say the six are unsigned and send the English; they sign a language only for the length of
a check that needs to see it in its own script; the shipped bundle is checked to carry the six empty.
Redeploy `send-invite-emails` after this merges (the bundle changed).
