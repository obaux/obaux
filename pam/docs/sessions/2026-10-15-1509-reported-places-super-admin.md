# 2026-10-15 — reported places, for the super admin (D-585)

**Branch:** `claude/places-programs-reported-places-2` · **Lane:** Places & programs (Piper), job from the merge desk

## What changed

- `app/places/ReportedPlaces.tsx`: reason and note at reading size, a hint above each button, a ConfirmDialog before removing, a banner after either decision.
- `screens/RequestsScreen.tsx`: the Reported places row with a count.
- Seven new English keys in all seven locale files (`places.reported.*`), allow-listed in `copy.test.ts`.
- New `e2e/reported-places-pass.spec.ts`.

## What was wrong, and what missed it

Reported places reached a super admin only through Profile or the bell, and a decision with no way back took effect on one tap with no word after. The only check was that the buttons exist (`messages.spec.ts`). Now a spec holds the confirmation and the word after.

## Decisions made

D-585.

## Verified

`build:e2e`; reported-places-pass, admin, a11y, places-retired and the reported part of messages on three projects; `@pam/config` tests. Before and after shots in `docs/research/shots/2026-10-15-piper-*-sa-*`.

## Left undone

Sage's signature and Lena's translations. Approve and Deny confirmations (Ava). Programs to check polish (not routed to me).

## Needs a human

Merge desk: READY. Screens: Requests (super admin Home), Reported places, the confirmation dialog, the banner after a decision.
