# D-585 — Reported places: a row on Home, reading-size reasons, ask before taking off

**Date:** 2026-10-15 · **Branch:** `claude/places-programs-reported-places-2`

From Iris's super admin first pass (`docs/research/2026-10-15-super-admin-flow.md`, W1 and W4), routed by the merge desk. Approve and Deny on staff requests and programs are Ava's.

- **W4 — on Home.** A super admin's Home (the Requests screen) has a "Reported places" row beside "Programs to check", with a count badge (spoken "{count} reports") when places are waiting. Existing words only.
- **W4 — on the screen.** What was reported is at reading size (17px bold, it was a 12px badge), with the reporter's own note when they wrote one ("They wrote: “…”", shown as data, direction from its own text), and a line above each button saying what it does. A case manager sees the reason and the note too, and no buttons.
- **W1 — ask first, say after.** "Take it off the list" opens Pam's ConfirmDialog ("Take {place} off the list?", Cancel sends nothing). "Keep it" is one tap, as it changes nothing for members. Either decision then says what was done in a banner ("{place} stays on the list." / "{place} is off the list.").
- **Words.** All new, English in the six other languages until Lena translates (allow-listed in `copy.test.ts`; delete those lines when she has). They are proposals to Sage, sent to the merge desk; they are not signed yet. The open question is whether "anyone who saved it is told" should say "by text".

Not here: P1 to P4 of that pass (counts and wording on Programs to check, back labels, a withdrawn program counted, links on a program's phone and website) are not routed to Piper.
