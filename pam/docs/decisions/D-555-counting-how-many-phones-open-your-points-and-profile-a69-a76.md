# D-555 — Counting how many phones open Your points and Profile (a69, a76)

**Date:** 2026-10-13 · **Branch:** `claude/messages-screen-open-counter`

**Decided by:** Will, 12 October 2026 (a69: "set up a way to analyze how many members tap on rewards screen so we can learn the demand for it"), signed as a76 on 13 October. Iris's plan: `docs/research/2026-10-12-rewards-interest-plan.md` (branch `claude/research-help-site`); the Privacy line is in `docs/signed-english.md`.

**What is counted:** how many phones opened Your points, and how many opened Profile, each day. Nothing else: counting another screen needs a new Privacy line first, so the database refuses any other name.

**What is stored:** `screen_open_counts (day, screen, count)`, one row per day and screen. No profile id, account, device, time of day, place or language. RLS is on and forced, a policy denies every client, and no client has a grant. The call `count_screen_open(screen)` takes only the screen's name, returns nothing, and stores nothing about the caller; it reads `auth.uid()` only to refuse a signed-out caller. The ordinary request log sees who asked, as for every request, and is deleted within a week; the count table never has it and nothing joins the two.

**Once a day per phone:** the phone keeps a note (`pam.counted.<screen>` = the phone's date in its own storage, never sent). The note is written before the call and taken back if the call fails. A phone with no usable storage does not count at all, rather than on every open. Only a real member's phone counts: not a demo account, Storybook, or staff looking at the member's screens.

**The report:** `screen_opens_weekly()`, service role only. A week is Monday to Sunday, Philadelphia time (the day stored is Philadelphia's). A weekly total under 5 reads "under 5"; the table keeps the exact number, which is why the Privacy line says "shows only as under 5 in our reports", not "hidden". Iris sees weekly totals only, through the merge desk or Will.

**Built by Nico, not Piper** (Mira, 13 October: Piper is on the live W4 fix). Ava reviews the Profile call. Lena's Privacy line ships in the same batch as the counter, never before.

**Also in this job, Iris's W3:** the Explore bell's arrival moved the page 26 to 30 px (the role chip wraps under the logo). The phone now keeps a note, `pam.explore.bell` = `1`, that the bell was there last time, and holds the bell's place until the answer arrives. A phone with none holds no place. The first time a phone has a bell the page still moves once. This is a UI hint on the phone, no identifier, never sent.

**To reverse:** stop calling `count_screen_open`; the table can stay or be emptied (expand-only, no DROP).
