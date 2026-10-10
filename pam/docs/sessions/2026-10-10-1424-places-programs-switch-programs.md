# 2026-10-10 — places programs switch programs

**Branch:** `claude/places-programs-switch-programs` · **Lane:** Places & programs (Piper)

## What changed

D-318 (before-launch part 4). No migration: the database already allowed a lead's organisation several listings (`submit_program` only blocks while one is waiting for review). `useOwnProgram` now loads every active program of the lead's organisation (newest first) with their open submissions in one go, and the screens keep reading `program` — the one shown: the lead's pick (kept on that phone) or the newest. `pickOwnProgram(id)` chooses; a send picks the newest ("Add a program returns to the new one"). New page `/program/switch/` ("Your programs": ticked row, tap to switch, Add another program, which waits while Pam is checking one). A "Your programs" row on the Program tab, and on the "Sent to Pam" page when the lead has another program. 8 strings in seven languages (drafts for Lena), a story set, prototype route, flow map.

## What was wrong, and what missed it

The submissions query selected no `service_id`, which a list of programs needs; added, and the loader tolerates a row without one only when there is a single program (older fixtures).

## Decisions made

None new (D-318 as already decided by Will).

## Verified

Web 76, config 1026, tsc clean, Storybook builds, stories checked in the browser, fit audit 0 new in seven languages and one pseudo ellipsis (a service sentence, one line by design) accepted. E2E new program-switch (switch and remember; Add another offered; waits while one is checked) plus a11y, account, join: 123 passed on all three phones.

## Left undone

Home and the get-started cards still describe the program shown, not all of them. Real policies per service (D-313 step 2).

## Needs a human

Lena: 8 strings. Nothing else.
