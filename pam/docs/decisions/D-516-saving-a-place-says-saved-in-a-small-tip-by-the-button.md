# D-516 — Saving a place says "Saved" in a small tip by the button

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-saved-tooltip`

**Decided by:** Will, via the merge desk (11 October 2026, 03:03 UTC): "When I save a place it should show a tooltip saying saved."

**What.**
- New `@pam/ui/ConfirmTip` (a confirmation tip, documented in Storybook: Components › Feedback › ConfirmTip). It wraps a button; when its `trigger` number goes up it shows a small bubble ("Saved") by the button for about two seconds (`CONFIRM_TIP_MS`), then fades. No tap is needed to dismiss it; the bubble takes neither focus nor taps (`pointer-events: none`).
- Said to a screen reader too: a polite live region (`role="status"`) that is in the page before it holds anything, filled for as long as the tip shows. The drawn bubble is `aria-hidden`, so it is not read twice.
- Motion: an opacity fade of 200ms and nothing else. With reduce-motion the app's global rule makes it instant.
- Used where a place is saved: the place bar (`PlaceBarActions`) and every `PlaceCard` (Explore and wherever a card has Save). Each shows it only on a tap that **saves**.
- **Unsave says nothing.** The mark empties and the button's name and `aria-pressed` change; a word would be noise on an undo. If Will wants one ("Removed"), it is one more `ConfirmTip` trigger and a new string.
- Words: the existing `places.saved` ("Saved"), the same word as the filled button's name. No new string, nothing for Lena.
- Why not Astryx's `Tooltip`: it is a hover and focus label and drags in the overlay layer (the weight `Notice` avoids, see its comment). This is a few lines with no layer, so it can sit on every card.
- The tip appears on the tap, with the optimistic save; if the write then fails the existing "could not save" message shows, and the tip fades by itself in two seconds.
- Tests: `e2e/saved-tip.spec.ts` (shows on a card and in the place bar, is announced, gone in about two seconds, nothing on unsave, no transition under reduce-motion, only opacity otherwise).

**What a later session might reverse.** The two seconds; the bubble's position (below, lined up with the button's end); saying nothing on unsave.
