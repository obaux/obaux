# 2026-10-11 — design token reconcile

**Branch:** `claude/pam-design-tokens` · **Lane:** design system & Storybook (Dot)

## What changed

Wren's list of where Foundations and the code disagree (Mira: yes, reconcile, per item). D-504.
- A decision with the verdict for each of five items (body size, card radius, spacing, colour tokens, dark grounds).
- Foundations only; no app code changed. Typography: a "Where the code stands" section (the theme's 14px / 12px defaults and the
  count). Layout: radii as drawn (cards 24, sheets 28, fields and rows 10, panels 12) and a spacing section (4px steps, 2px and 6px
  half-steps inside components). Colour: dark-mode section; the full token list generated from the theme
  (`scripts/gen-colour-tokens.mjs`, `colourTokens.ts`, a unit test that fails when the list is stale); `tokens.css` is `pam.css`;
  `background-surface` is `background-card`.

## What was wrong, and what missed it

Foundations restates the SOP by hand and nothing compares it with the theme. Measured over 70 role screens, the 16px body rule is
met only where a component remembers it (three in four text elements are under 15px). Cards are 24px, not 28px (28px is the
sheet). The Colour page named about 15 of 146 colour definitions. In dark, muted equals the page.
A first try imported the theme CSS as raw text (`?raw`): Storybook's webpack builder refuses a package export with a query.
The generated-list-plus-test route is the one that is testable. I also ran `pkill -f` with a pattern that matched my own
shell, twice; not doing that again.

## Decisions made

D-504.

## Verified

tsc; web unit tests (97, the new one keeps the Colour page in step with the theme); `build-storybook`; the Colour page rendered and
read (153 token names, Dark mode section). Docs and a generator only; no tests in the app touched.

## Left undone

Two visible changes wait for Will (D-504): the body-size theme change, and the dark muted ground (before/after pictures are in the
scratchpad: muted-before-after.png, left to right a conversation, Explore and Profile, each before then after).

## Needs a human

Will: the two items in D-504.
