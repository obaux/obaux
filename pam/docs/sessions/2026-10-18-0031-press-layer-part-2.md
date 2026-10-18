# 2026-10-18 — press layer part 2

**Branch:** `claude/pam-design-press-layer-2` · **Lane:** design system (Dot)

## What changed

D-602 part 2, the kinds Iris's re-test found not pressing. `data-pam-stretch` on the four stretched-link anchors (`PlaceCard`, `SetupCard`, `PersonRow` ×2); in the `pam` layer of `globals.css`: `.astryx-card:has(a[data-pam-stretch]:active)` and `.astryx-selectable-card:active` press in (0.97 and shade, as a clickable card), `.astryx-tab:active` shades, and reduced motion drops the scale on the new cards and keeps the shade.

## What was wrong, and what missed it

Part 1 matched `.astryx-clickable-card`, `.astryx-item`, segments and buttons. Program cards, member cards and Finish setting up cards are `astryx-card` with a heading link stretched by `::after`; service choices are `astryx-selectable-card`; tabs are `a.astryx-tab`. None matched. `:has(a:active)` fires on a held press of the stretched link (`::after` covers the card), so the whole card presses; an ordinary link inside a card does not, because only `data-pam-stretch` anchors count.

## Decisions made

None new; addendum to D-602.

## Verified

`e2e/press-layer.spec.ts` gained Explore's program card, a service choice and a tab; each fails on main on its assertion (scale 1, not 0.97; no shade) and passes with the rule. `:active` is forced with a held mouse button, as in part 1. Mira's second round added the two staff screens: a case manager's member card (Home) and a program lead's Finish setting up card (Home, no program yet); both fail on main on scale 1 not 0.97 and pass with the rule on all three projects (27 passed). Pictures and clip in `docs/design/review/2026-10-18-press-2/`.

## Left undone

The primary button under reduced motion: the big "Plan a trip" inside the Press wrapper already shades. Measured with reduced motion and a held mouse button on the button (`:active` true): background-image goes from none to linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)); the wrapper's transform stays none. So Astryx's own overlay shows through the wrapper and no rule was added.

## Needs a human

Nothing from Will.
