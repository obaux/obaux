# 2026-10-14 — design searchfield dir auto

**Branch:** `claude/pam-design-searchfield-dir` (off `main`) · **Lane:** design system

## What changed

`SearchField` (`packages/ui/src/SearchPill.tsx`): while the field has words in it, its input gets `dir="auto"`, so what is typed reads as typed in every language (Lena: in Arabic "1500 Market" showed as "Market 1500"). Empty, `dir` is left off so the placeholder follows the page. New e2e in `focus-text-boxes.spec.ts` in Arabic: empty is right to left, Latin words left to right, Arabic words right to left, cleared right to left again.

## What was wrong, and what missed it

The page's right-to-left base direction reordered a Latin address in a field. The language-fit audit measures strings on screen, not typed text, and nothing typed an address in Arabic.

## Decisions made

None new.

## Verified

focus-text-boxes, area-picker, street-search e2e at narrow-320: 28 passed; tsc clean; build-storybook (below).

## Left undone

`SearchPill`'s own field (the Typeahead on Explore before Piper's inline build) is not changed; the inline a86 uses `SearchField`.

## Needs a human

Nothing.
