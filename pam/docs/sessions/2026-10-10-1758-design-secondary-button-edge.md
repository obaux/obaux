# 2026-10-10 — design secondary button edge

**Branch:** `claude/pam-design-secondary-border` · **Lane:** design system & Storybook (Dot)

## What changed

Mira's queue item from Will's website note (10 October). D-493.

- `packages/ui/src/Button.tsx`: a secondary Button has a 1px inset ring in `--color-border`; new prop
  `hasEdge` (default true) to opt out. Icon-only unchanged.
- `ChoiceChips.tsx`: `hasEdge={false}` (the chip has its own border, the selected one is filled green).
- Story: Components / Actions / Secondary button (On gray, Before no edge, Chips are unchanged).

## What was wrong, and what missed it

Wren's version put a `border` on every secondary button: it changed the selected language chip and failed
the `@pam/ui` option-tag test, which is how it was caught. A ring (inset shadow) rather than a border keeps
every button's size.

## Decisions made

D-493.

## Verified

`@pam/ui` 117 tests, option-tag snapshot unchanged; tsc; build-storybook; bundle budget 23.5 kB spare;
`audit:fit` (en, es, pt-BR, zh-CN, zh-HK, ru, ar, pseudo) on the component stories and about 74 screen
stories with secondary buttons: nothing new; full Playwright suite (see the READY). Before and after
screenshots made from the story (light only: Storybook does not follow the system dark setting, so dark is not seen).

## Left undone

The site's own border (`apps/site/src/components/SecondaryButton.tsx`) is Wren's to drop once this is on
main. Not seen on a phone; not seen in WebKit (not installed here).

## Needs a human

Will to look at the before and after.
