# D-520 — Profile's hero card draws skeletons while it loads

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-real-accounts-no-examples`

**Decided by:** Will, via the merge desk (11 October 2026, 03:51 UTC): "We need skeleton loaders for the image, stats and labels in profile hero card."

**What.**
- `ProfileSummary` (`@pam/ui`) takes `isLoading`: the photo, the name, the role and each stat are pulses (Astryx's `Skeleton`, the primitive Places and People already use) sized exactly like the real content: a 128px circle, the name's 31px line, the role's 25px line, each stat's 24px number and 17px label. The sizes are measured from the real card, not guessed, and `profile-skeleton.spec.ts` fails if they drift.
- A stat can also be `value: null`: just the number is a pulse while its caption stays real. Profile uses it for Points and Places saved while they arrive; the Connections count is known at once.
- `/account/` while the account is being found out draws the title and the hero card as pulses (`ProfileLoading`), not a spinner. What goes under the card depends on who the person is, so nothing is drawn there yet. A member's card has three stats; a staff account's has none and is a little shorter, which is the one thing that can still move.
- **No skeleton for longer than the data takes.** `usePointsState` says whether points are still on their way; a failed call ends the pulse and the card shows the real 0, as it did before. A failed account load is the page's existing Notice. (`usePoints` is unchanged for its other callers.)
- Motion: Astryx's pulse is one animation per placeholder; under reduce-motion the app's global rule makes it run once, instantly, so it stops. It is announced once, politely ("Loading", `common.loading`), and the pulses are hidden from a screen reader. No new English.
- Tests: `e2e/profile-skeleton.spec.ts` (stats pulses then numbers with the card's box unchanged and layout shift under 0.01; the whole-card skeleton the same height and position as the real card; a failed call ends the pulse; reduce-motion stops it). Storybook: Member › Created › States › Profile: Loading hero card, Numbers arriving.

**What a later session might reverse.** The staff card's height when the role is not known yet; showing captions as pulses only in the whole-card state.
