# D-602 — The press layer: rows darken, cards, tiles and buttons press in

**Date:** 2026-10-17 · **Branch:** `claude/pam-design-press-layer`

**Decided by:** proposed by the design lane on Will's 17 October 19:13 words (card a99): "a more sophisticated interaction layer across the app for tapable items, where it feels like someone is tapping or pressing in. Right now those items are feeling very flat and they're also not working." Ships only on Will's yes.

## What

Three things, all on `:active`, in `apps/web/src/app/globals.css` (a `pam` layer block, with the numbers as `--pam-press-*` custom properties):

| What | Press | In | Release |
| --- | --- | --- | --- |
| **A row** (`.astryx-item`) or **a segment** of a switch (Day / Week / Month, Conversations / Reported) | background shade: 7% black (10% white in dark); no scale | 60ms | 200ms, `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| **A card or tile** (`.astryx-clickable-card`) | `scale(0.97)` and the same shade | 90ms | 220ms, same curve |
| **A button** (`.astryx-button`, not disabled) | `scale(0.97)` | 90ms | 220ms, same curve |
| **Reduced motion** | the shade stays; no scale and no transition | | |

`Press` (packages/ui/src/motion.tsx) already scaled a primary button's wrapper to 0.97; it is now marked `data-pam-press` and the global button rule skips what is inside it, so a primary button does not press to 0.94.

## Why it was flat

Before: a row had no press style at all (Astryx draws `:active` on its link, which is only the words); a card, tile or button had Astryx's 10% overlay and nothing else. And iOS Safari applies `:active` only on a page with a touchstart listener, which Pam had none of until the row-taps fix (b60, `useRowTaps`), so on an iPhone nothing reacted at all.

## What Iris found showed nothing, and now does (P1)

Checked by holding each: a trip card and a program card (both `ClickableCard`: scale and shade), a conversation row (an `Item`: shade), a place's service choices (buttons: scale), the Day / Week / Month switch (its segment: shade). Iris's "some change" list (list rows, tab bar, header icon buttons, chips, big and secondary buttons) gets the same layer through `.astryx-item` and `.astryx-button`.

## What to reverse

0.97 is the number to change if it reads too strong (0.98 is subtler; 0.96 is more toy-like). The shade is one token. A card with its own `background-image` loses it while held (the shade is a gradient over the card's colour); none of the current cards has one.

## Checked

`e2e/press-layer.spec.ts` (a held mouse button sets `:active` as a finger does in Safari): a row's shade, a tile's and a button's scale 0.97 and their return, and reduced motion (shade, no scale). All four fail on main on the assertion they claim (no shade, scale 1) and pass on narrow-320, dark-320 and iphone-se-viewport. Pictures and a before-and-after clip (left before, right after) in `docs/design/review/2026-10-17-press/`.

## Addendum, part 2 (18 October)

A card whose heading is a stretched link (`data-pam-stretch`: Explore's program cards, the case manager's member cards and program list, the program lead's Finish setting up cards) presses as a whole through `.astryx-card:has(a[data-pam-stretch]:active)`. A service choice (`.astryx-selectable-card`) presses in; a tab (`a.astryx-tab`) shades. Same tokens as part 1. Only marked cards press, so an ordinary link in a card does not.
