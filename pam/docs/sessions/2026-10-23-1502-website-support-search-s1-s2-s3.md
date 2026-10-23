# 2026-10-23 — website support search S1 S2 S3

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** <see docs/lanes.md>

## What changed

Iris's 22 October Support-search findings, on mira/b78 (d8a76afb): **S1** a suggested post (tap or Enter) opens the post; a question or “Search for…” still searches. **S2** after a search the box keeps its words and the cursor stays in it. **S3** one result count: `SearchPill` has `isQuiet`, which turns off Astryx’s own two page-wide live regions while the bar is on the page, so only the page’s count is spoken. Three specs in `scripts/usability.mjs` (all three fail on b78, pass here); that script’s server now answers 404 for a missing file instead of crashing (router prefetch).

## What was wrong, and what missed it

## Decisions made

## Verified

usability (with the new specs), a11y (130 scans, 0 problems), site tests (125), tsc for site, ui and web pass. scrollspy: 2 problems on the live post “When something doesn’t go through” at 1280px (see below); they are in b78 as it stands, not from this change.

## Left undone

Nothing from this session. (Fixed after Mira's 15:05 answer: the “On this page” cell runs 56px past the post from 1180px, so the menu is not pushed up at the end of a short post. Mira asked for room below the last section; that would put about 440px between the “Still stuck?” card and the footer and fail the a83 check of 120px, which Will set, so the menu's own cell was extended instead. A check in `usability.mjs` fails on b78 and passes now.)

## Needs a human
