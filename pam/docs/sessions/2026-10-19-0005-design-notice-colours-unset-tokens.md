# 2026-10-19 — design notice colours (unset tokens)

**Branch:** `claude/pam-design-notice-colours` (off main `9aac8b6f`) · **Lane:** design system (Dot)

## What changed

`packages/ui/src/Notice.tsx`: the stripes and the compact fill used three custom properties the theme never defines (`--color-text-error`, `--color-text-warning`, `--color-background-sunken`), so each fell to its fallback: a stripe in the text's own colour (black in light, white in dark) and no fill. They now use ones the theme does define: `--color-text-red` (error), `--color-text-orange` (warning) and `--color-background-muted` (the compact fill). Info already used `--color-text-accent`, which exists.

## Was it meant to look like that?

No. Nothing records it: D-509 and D-510 (the small alert) say nothing of fill or stripe colour, and the compact notice's own comment says it has "the same three tones as Notice". I wrote the unset names on 11 October (`1480edb5`) with fallbacks that hid that they did not resolve. It is a second missing surface, and a missing stripe colour.

## What changes on screen

The inline compact alert (sign-in's wrong code, the only inline use) gets a light fill and a red stripe. The full `Notice` card's stripe goes from the text colour to red (error) or orange (warning), as its icon already is. Colours only; no layout moves. Pictures: `docs/design/review/2026-10-19-notice-colours-after-*`.

## Verified

New test in `e2e/signin-wrong-code.spec.ts` (stripe is not the text colour, the row has a fill) fails on main's real build and passes here on all three projects (21 passed). `@pam/ui` tests 130 passed.

## Left undone

Will has not seen the card stripes in colour; if he wants them as they were (the text colour), the card styles can go back and only the compact row keeps the new ones.
