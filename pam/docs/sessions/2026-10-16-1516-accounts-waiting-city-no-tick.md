# 2026-10-16 — accounts waiting city no tick

**Branch:** `claude/pam-waiting-city-no-tick` · **Lane:** Accounts & invites · **HELD for Will**

## What changed

- This is build 3 of Mira's privacy builds from Lena's guard (D-587), option A, Mira's advice. It waits for Will.
- The "Text me when Pam opens in {city}" tick is gone from the Join step for a city Pam is not in yet, and so is
  the STOP/HELP small print under it. Nothing reads `waiting_cities`, so the tick promised a text that never came.
- The city is still saved. `joinWaitingCity(city)` now always sends `p_wants_updates: false`, and the RPC is
  unchanged.
- The line after is `join.waitingDone.no`, which already existed: "Your city is on our list. Come back any time to
  see if Pam has opened." No new words.
- `join.waiting.optIn` and `join.waitingDone.yes` are no longer drawn. I left them in the locales; removing them is
  a words job, for Lena and Sage, once Will decides.
- New stories: Onboarding › Not in your city yet (the step, and after Save). The Join preview takes a `city`.
- `data-collected.ts`: the waiting-list entry says what is asked now, and JoinScreen has 4 fields, not 5.

## Verified

- `join.spec.ts`:
  - The step has no checkbox and no "Text me" line.
  - Save sends the city with `p_wants_updates: false`.
  - The line after is "Your city is on our list", with no "want to hear" or "cannot text you".
  - The "ticking the box" test is removed with the box.
- After build:e2e, join and a11y pass on all three projects: 117 tests.
- `@pam/config` 1319 passed, privacy guard included. Web `tsc` is clean, and Storybook builds.
- Pictures at 390, before and after, are in `docs/design/review/2026-10-16-waiting-city/`.

## Left undone

- Not to merge until Will chooses A or B.

## Needs a human

- Will: option A (this branch) or option B (keep the tick and build the text for when a city opens).
