# 2026-10-10 — places programs policies p2

**Branch:** `claude/places-programs-policies-p2` · **Lane:** Places & programs (Piper)

## What changed

Policies P2 (Will's card a25, D-485). Stacked on P1 (`claude/places-programs-policies-p1`). Migration `20261010145337`, expand only: `policy_signatures` (one row per member per policy; own-read only; no direct writes), `member_signatures` (the saved picture, private to the member), `sign_policy(policy, image)` (a member signs a CURRENT policy of a LIVE program, picture given or the saved one; signing again replaces picture and date), `forget_my_signature()`, a read policy so a signer keeps an archived policy, and `can_read_policy_file` extended with "or one they signed" (same signature). Pictures are PNG data URLs ≤200 KB in the member-only tables, so there is no second bucket. App: `usePlacePolicies` (a real place asks for exactly what its program keeps in the database, nothing when it has none; an example place keeps the example set); `useMySignatures` reads/writes real signatures (optimistic, taken back if refused); the place, new-trip, trips and signing screens use them; a real policy's pages open from the signed link; the signing page says what the program keeps and what a signature means, before Sign; the transparency promise gains its line. 4 strings plus the transparency line, seven languages.

## What was wrong, and what missed it

`useShownPolicies` and three other member screens each asked `placeAsksForPolicies` (false for every catalogue place). They now ask `usePlacePolicies`, and the source-scan test says so. The policies test of the earlier fix is updated, not loosened: it still fails if a screen goes back to the example set.

## Decisions made

D-485 covers it (points 1, 2, 3, 6).

## Verified

Whole database suite passes (new test 46: only a member signs; only a current policy of a live program; no saved signature = refused; a non-PNG refused; the tables cannot be written or edited directly; another member and the program's lead read nothing of it; signing again replaces; a new version is unsigned while the old signature stands; a signer keeps reading the archived policy and its page, a non-signer does not; a member can forget the saved picture and signed policies keep theirs; signed-out refused). Web 91, config 1035, tsc clean, Storybook builds; e2e new member-signs-policy (3) + program-policies, policies, a11y, place, trip-booked, visit-change, join, account, legal, admin: 297 passed on all three phones.

## Left undone

P3 (who signed: first name and date for the program, and the verified tick, Trips' status) and P4 (only for this service). The lawyer's reading of 'a record that you read and agreed' is on before-launch.

## Needs a human

Lena: the transparency line and 4 strings. Mira: apply `20261010145337` after P1's.
