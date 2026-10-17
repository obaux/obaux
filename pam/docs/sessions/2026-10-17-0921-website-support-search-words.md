# 2026-10-17 — website support search words

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** website

## What changed
- The Support search box's placeholder was "Ask a question, for example “why didn’t I get a code?”", about 390px of words in 240px at 320 (Lena's fit check). Now "Ask a question", and its label (the SearchPill `label`, the accessible name) is "Ask a question in Support" (was "Search Support"), as Sage signed (ledger 3c4c721f). The label begins with the visible words (WCAG 2.5.3). The `role="search"` aria-label "Support" is unchanged.
- `scripts/a11y.mjs` and the website Storybook stories (`apps/web/src/stories/website/Website.stories.tsx`) look the box up by its new name.

## Verified
tsc, site tests, build, a11y (120 scans, 0 problems) and usability all exit 0. At 320 the placeholder is "Ask a question" in a 240px box with no overflow (scrollWidth equals clientWidth), light and dark; pictures in `docs/design/review/2026-10-17-support-placeholder/`. No post quotes the box, so no `posts:date`.

## Left undone
Lena's `audit:fit` against the new Storybook build (see the READY for its result).
