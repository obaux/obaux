# 2026-10-13 — design help callout

**Branch:** `claude/pam-design-help-callout` · **Lane:** Design systems

## What changed
New site token `--website-text-link` (dark: very light lime, #EEF1C2) in `website.stylex.ts`, `website-palette.ts`, with AA tests. The dialog and call-out spec and the dark link rule are in D-562. Before and after pictures in `docs/design/review/2026-10-13-help-desk/`. No component changed: Wren builds.

## What was wrong, and what missed it
Every text link in dark was the lime accent. The form's text was small.

## Decisions made
D-562.

## Verified
website-tokens.test passes (18); looked at the Support index and a post in dark at 390, before and after (the after is the built page with the colours applied in the browser).

## Left undone
Wren builds the dialog and applies the token.

## Needs a human
Sage: the words for the call-out and the dialog.
