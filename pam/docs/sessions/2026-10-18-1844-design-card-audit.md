# 2026-10-18 — design card audit

**Branch:** `claude/pam-design-card-audit` (off main 615e1078) · **Lane:** design system (Dot)

## What changed

Nothing in the app. A list: every screen where a `Card` wraps the one list or form the screen is for, with route, file, owner lane and a built 390-light picture, in `docs/design/review/2026-10-18-card-audit/` (README.md and 11 pictures). Mira asked for a list, not fixes; she routes each to its owner and posts them to Will first.

## What was wrong, and what missed it

Cards were the default frame for a settings or form screen until Will's 17:51 rule; nothing named it a pattern.

## Decisions made

None. Uses D-615.

## Verified

Read all 35 `<Card` uses in `apps/web/src` (stories and the gallery apart). Drew 19 screens in the built Storybook (a temporary story file, not committed) and 6 existing stories, counted `.astryx-card` on each, and looked at every picture. Ten screens are listed as violations, one as borderline, four more are in the code but not pictured (their state needs data no story has).

## Left undone

The ten fixes, by their owners, after Will sees the list. The sign-in card (flat) and sheets/drawers with cards were not audited as screens.

## Needs a human

Will: which of the borderline cases (a form cut into section cards, the quote card on Answer by text) he wants treated as the rule.
