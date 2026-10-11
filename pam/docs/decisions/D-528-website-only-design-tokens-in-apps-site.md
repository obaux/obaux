# D-528 — Website-only design tokens in apps/site

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-website-styles`

## Decided

Will (11 October, relayed by Mira): "Update components to reflect these, for website only. Clean up the Figma colors and text, and create new styles for website."

The website gets its own set of colours and type, separate from the app's:

- **Figma** (Pam — Website): variable collection `Website` (Light and Dark, 23 colours, e.g. `Website/Text/Primary`) and 32 text styles `Website/<Group>/<Name>` (Figtree). Every layer on Home, Support, Post, About, Copy proposals and Components is bound to them. Near-duplicates were merged; the merge list is in the session log.
- **Code**: the same set in `apps/site/src/lib/website.stylex.ts` (colours, `--website-*`, `light-dark()`) and `website-type.stylex.ts` (type), plus `website-palette.ts` as plain data for tests. `packages/ui` and the app's tokens are unchanged.

## Why

The file mixed the Astryx library, a small local set and raw hex values, so the same grey or green appeared under several names. Wren is building the new site from this file and needs one set of names to build against.

## Contrast

Dark values that failed AA were moved: Text/Secondary `#9E9E9E` to `#A6A6A6`, Text/Muted to `#8F8F8F` (below Secondary), Icon/Shamrock `#0B603D` to `#108E5A`. In light, Text/Muted (`#666666`) is under 4.5:1 on Gray, Green and Purple surfaces and Accent/Success (`#0B991F`) is 3.76:1 on white, so Muted is for Page and Muted surfaces only and Success is for icons and strokes only. `test/website-tokens.test.ts` checks every pair in both themes and pins these two limits.

## What a later session might reverse

Fold the website set into `@pam/ui` if the app ever shares the site's look. Until then the two stay apart.
