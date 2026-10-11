# 2026-10-11 — design real accounts no examples

**Branch:** `claude/pam-design-real-accounts-no-examples` · **Lane:** Design system & Storybook

## What changed

Will's launch rule (a real account sees only its real things). Points no longer earns the example Scholar; Profile's Connections count is 0 for a real account; Connections shows its empty state; uses `lib/exampleMode` `showsExamples` (D-509: a super admin's preview, a demo tab, Storybook). D-518.

## What was wrong, and what missed it

`ProfileScreen`, `ConnectionsScreen` and the Points page showed example data to every member; nothing tested a real account without examples.

## Decisions made

D-518. I kept the two explicit demo modes (preview, demo view) as examples; for Mira to confirm.

## Verified

`tsc`; web 119 unit tests; `no-examples-profile` e2e (6) and points/account specs; build; build-storybook (Storybook still shows the examples).

## Left undone

`USE_DUMMY_PEOPLE` still true for other lanes. No real query for connections or badges yet.

## Needs a human

Will: whether a demo account and a super admin's preview should keep their examples.


## Update (04:50)

Main gained D-511's `lib/examples.ts` and Piper's fold of every reader onto it, including Points. I merged, took main's Points, Connections and Profile-count code, and kept only the e2e (`no-examples-profile.spec.ts`) and D-520's skeletons. D-518 is now a test record only.
