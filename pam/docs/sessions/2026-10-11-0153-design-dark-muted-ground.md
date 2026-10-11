# 2026-10-11 — design dark muted ground

**Branch:** `claude/pam-design-dark-muted` (built on `claude/pam-design-tokens`, which has D-504) · **Lane:** design system & Storybook (Dot)

## What changed

Will (11 October 01:37, a49): "Yes go for it." D-504 item 5.
- `packages/ui/src/theme/pam.theme.ts`: `--color-background-muted` is `['#F1F1F1', '#262626']`; `pam.css`, `pam.js` regenerated with
  `astryx theme build` (diff is that one token; I put back the header comment lines the CLI rewrote, to keep the diff to the change).
- Foundations: the Colour page's dark-mode section says it is done; the generated colour list regenerated (its test is what would
  have failed otherwise); new story Foundations › Dark muted ground, before and after, both panels dark.
- D-504's table and "For Will" item updated.

## What was wrong, and what missed it

Nothing new: the finding is D-504's. One process point: main did not yet have D-504's generated colour list, so a change made on
main would have left that list stale and failed its test the moment both merged; I built this on the D-504 branch instead, so
merge `claude/pam-design-dark-muted` (it carries D-504) rather than both.
A first version of the story put the old value back with an `xstyle` custom property; Astryx's `xstyle` does not take one
(tsc said so, Storybook did not), so the panel is a plain element with `stylex.props`.

## Decisions made

None new: recorded in D-504 (Will's yes).

## Verified

Contrast of text on `#262626`: primary 15.1:1, accent 10.7, success 9.2, warning 10.5, error 10.0 (AAA); secondary 5.65 (AA; 6.43
before on the page, so nothing that passed fails). a11y e2e in dark-320: 15 passed. Colour list regenerated, web unit tests 97 pass.
tsc; build-storybook. Fit audit on conversation, profile and guide stories: nothing new. Explore shows 4 unaccepted pseudo clamps
in `member-created-states-explore--live` (the program cards' two-line descriptions): the same 12 findings and 4 unaccepted with my
theme change taken out and Storybook rebuilt, so they come from main, not this change (reported as a FINDING).

## Left undone

a48 (the body and label size) waits on Will. Not seen on a phone.

## Needs a human

Nothing.
