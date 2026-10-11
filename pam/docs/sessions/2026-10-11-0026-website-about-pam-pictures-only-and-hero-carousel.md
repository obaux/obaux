# 2026-10-11 — website: About Pam pictures only, and the hero carousel

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Public website (Wren), job from Will via the merge desk

## What changed

- `packages/ui/src/OnboardingSlides.tsx`: new `showLines` prop (default `true`). `false` draws no words and no wash; each slide becomes `role="img"` named by its line.
- `apps/web/src/screens/AboutScreen.tsx`: passes `showLines={false}`, and the slide lines through `tPlain`.
- `apps/site/src/screens/HomeScreen.tsx`: hero is a two-column grid from 900px (headline, intro, buttons | carousel), stacked under 900px; the carousel is `OnboardingSlides` inline with the three HOW pictures.
- Figma "Pam — Website": new `Hero carousel` component (swappable Slide, dots); Home Desktop and Phone gain a Hero row around the headline block. Will's own edits to those frames (new headline, cards) were kept, not rebuilt.
- Records: D-499, changelog fragment, this log.

## What was wrong, and what missed it

Nothing broke. One thing to know: the slide lines were the *only* accessible text for the pictures (artwork is `aria-hidden`, "the line carries the meaning"). Removing the words without naming the pictures would have left them silent to a screen reader, and no test caught that case, so a test now asserts the pictures are named when the lines are not drawn.

The Figma Home had already been edited by Will after the first "Pam — Website" delivery (headline "Pam is how modern cities offer services that help!", Philadelphia, a green About banner, round-icon cards). The site on `main` still has the older copy. That divergence is Will's to resolve; it is not part of this change.

## Decisions made

D-499.

## Verified

| Check | Result |
|---|---|
| `@pam/ui` slides tests | 3 passed (new: no words drawn, every picture named) |
| `@pam/web` typecheck, `@pam/site` typecheck, `@pam/site` tests | pass, 26 tests |
| Site a11y (axe, `apps/site/scripts/a11y.mjs`) | 85 scans, 0 problems |
| Hero at 320 / 390 / 1440, light and dark | no sideways scroll; carousel right of the headline at 1440, under it at 320 and 390 |
| About story at 390 (built Storybook), light | no words over the pictures; no sideways scroll; pictures named |
| `pnpm --filter @pam/web build-storybook` | passes |

Not run: the app's e2e and `audit:fit` (no copy changed; the lines are the existing keys).

## Left undone

- Dark-mode screenshot of the About story was measured (no overflow) but only the light one was looked at.
- The site carousel has no pause control (autoplay 6 s, off under reduced motion), as in the app.
- "How Pam helps" cards below the hero repeat the same three pictures; left as is.

## Needs a human

Will: whether the site hero carousel wants the audience tabs; and what to do about the Figma Home copy that is ahead of the site.
