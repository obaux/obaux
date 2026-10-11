# D-518 — A real account sees no examples on Profile, Points and Connections

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-real-accounts-no-examples`

**Decided by:** Will, via the merge desk (11 October 2026, 03:02 UTC), a launch rule from the Trips and Messages screenshots: a real account sees only its real things, never examples; where a list empties, a short empty state.

**What happened to it.** I built Profile, Points and Connections on a helper of my own, then two other lanes built the same gate: D-509's `exampleMode.ts` and Nico's D-511 `lib/examples.ts` (`examplesOn()`, `useExamplesOn()`: Storybook's prototype, an `is_demo` account, `sessionStorage['pam.examples']`; not a super admin's preview). Piper then moved every reader onto it, including Points' earned badges. By the time this merged, **everything D-518 changed in code was already on `main`**, so my versions were dropped and nothing of the helper remains.

**What D-518 leaves.** `e2e/no-examples-profile.spec.ts`, which holds the three screens to the gate: a real member has no earned Scholar and no "Newest badge", Connections shows 0, the Connections screen is its short empty state ("No connections yet") with no axe violations; a demo tab still sees the example badge and cast; a super admin's preview sees none.

**What a later session might reverse.** Nothing here; the rule and its switch are D-511's.
