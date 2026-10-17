# 2026-10-17 — design row taps fix

**Branch:** `claude/pam-fix-row-taps` · **Lane:** design system (Dot)

## What changed

Will, 17 October 19:13: a Profile row "doesn't let me click on those items with a simple tap". Cause (Mira's measurement, confirmed in the DOM): Astryx's `Item` draws a link row's `<a>` only around the label, as tall as the words; the `<li>` click handler only calls `onClick`, which link rows lack. So the icon, the chevron and the room above and below the words were dead (Profile link rows 31% live, Language 22%); about 54 uses in 35 files sit on that one `Item`. Fix: `packages/ui/src/tapRows.ts` (`useRowTaps`, mounted in `Providers` and in Storybook's decorator): one document click handler that clicks the row's direct-child link for a tap anywhere else on an `.astryx-item` (not on something that acts itself, not a disabled row, not a modified click), and one empty passive `touchstart` listener so iOS Safari applies `:active`. `MenuList`'s comment corrected. `html[data-row-taps]` marks that the handler is on.

## What was wrong, and what missed it

## Decisions made

## Verified

New `e2e/row-taps.spec.ts` taps every internal link row at its four inner corners (4px in), its icon and its chevron and checks each opens the row's place: Profile (member and super admin), Legal, Help, a place. It fails on main (the corners and icon do nothing) and passes on narrow-320, dark-320 and iphone-se-viewport. Unit test `tap-rows.test.tsx`. Full e2e on the three projects: 2079 pass; `flag.spec.ts:85` failed once each on narrow-320 and iphone-se-viewport under load and passes 60 of 60 alone (not related: a radio and a button). Storybook builds; @pam/ui and @pam/config tests pass.

## Left undone

Notifications and Saved had no Astryx link rows in the states tested; Language's rows are buttons (Item's own click handler already covers them). The press layer (cards and tiles press in, rows darken) is B, a design call for card a99.

## Needs a human
