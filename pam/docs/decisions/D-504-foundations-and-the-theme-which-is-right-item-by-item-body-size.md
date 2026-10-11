# D-504 — Foundations and the theme: which is right, item by item (body size, card radius, spacing, colour tokens, dark grounds)

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-tokens`

Wren mirrored the design tokens into a Figma library (10 October) and listed where Storybook's Foundations and the code
disagree; Mira (11 October): yes, reconcile. For each item, who is right, with what I measured (the code over 70 role
screens in Storybook, and `packages/ui/src/theme/pam.css`). Anything visible in the app goes to Will first.

| # | Item | Foundations said | The code does | Right one | Done |
|---|---|---|---|---|---|
| 1 | Body text | 16px (A23) | theme `--text-body-size` and label 14px, supporting 12px; per-component overrides to 15-18px | **Foundations** (the rule is Will's) | Typography now says where the code stands. **The change is Will's call, below.** |
| 2 | Card radius | 28px (`--radius-page`) | every `Card` is 24px (`.astryx-card`), 105 of 114 cards; 28px is the sheets and drawers | **The code** | Layout corrected: cards 24, sheets 28, fields and rows 10, panels 12. No code change. |
| 3 | Spacing | a 4px scale | 4px steps, plus 2px and 6px half-steps inside components (about 40 off-grid values beside about 170 on-grid) | **The code**, with a limit | Layout says: 4px between things, 2px/6px half-steps inside a component, never 1/3/5px or between sections; three stragglers named (1px, 3px, 15px). No code change. |
| 4 | Colours | about 15 documented | 131 `--color-*` in the theme (146 definitions) | **The code** | Colour now lists every token, light and dark, generated from the theme (`pnpm --filter @pam/web tokens:colours`); a unit test fails if it goes stale. `tokens.css` renamed to `pam.css`; `background-surface` fixed to `background-card`. |
| 5 | Dark grounds | muted sets a choice apart | dark page, card and muted are all `#1B1B1B`; cards are told apart by the theme's 1px inset edge in dark, which is deliberate; `--color-background-surface` is `#262626` | **Foundations** for muted; **the code** for card (flat plus an edge is intended) | Colour explains dark mode. **The muted change is Will's call, below.** |

**For Will (visible, not done).**
1. *Body text.* Raise the theme: body and label 16px, supporting 15px (leave xs/sm for captions, tab labels, badges). Measured:
   1,355 text elements at 14px, 1,224 at 13px, 425 at 12px and 1 at 11px, against about 1,000 at 15px or more, so three in four
   are under the rule's 15px; the 16px rule only holds where a component remembers it. It fixes the root and touches every
   screen and every language (reflow, the fit audit, 320px). Alternative: amend the rule to "16px for body copy, 14px for
   secondary lines". Recommended: raise it, as its own job, with before/after screenshots and a full fit audit.
2. *Dark muted ground.* `--color-background-muted` dark `#1B1B1B` becomes `#262626` (the surface value), so a muted tile,
   the card behind the next trip, the back and send buttons and the avatar read as shapes in dark. Small: before/after
   screenshots on Explore, a conversation and Profile were sent with this decision. Light mode untouched.

**Not decided here, noted.** Components set 16/12/14/24px radii in StyleX and read no radius token (0 uses): a `--radius-card`
would let a card be a token; not worth a job until a card's radius is questioned again.

**A later session might reverse:** the half-step allowance, if the off-grid values grow.
