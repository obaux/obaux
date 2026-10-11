# 2026-10-11 — Data headings keep their own direction

**Branch:** `claude/pam-design-data-headings` · **Lane:** Dot, Design Systems Lead · **Decision:** D-534

## What changed

New `packages/ui/src/DataHeading.tsx` (exported, `@pam/ui/DataHeading`); `SubPageHeader` `isTitleData`; used on the place page title, `ProfileSummary` name, `PersonRow` names, and the conversation bar (`ThreadFrame`). Gallery section, a story, and `e2e/data-headings.spec.ts`.

## What was wrong, and what missed it

Names inside headings took the page's direction, so on an Arabic page a Latin name could put its punctuation on the wrong side or be cut at its start. No test put a name in a heading in Arabic.

## Decisions made

D-534.

## Verified

New spec (ar and en) passes; `messages` (78, includes Nico's Arabic direction tests), `languages` and `signin-wrong-code` pass at narrow-320; web typecheck, web build and build-storybook pass.

## Left undone

Other places that show a name as a heading, if any, are found by looking: Explore and Saved cards are `Text`, not headings, and were not changed. Program names inside the Add my program wizard were not changed.

## Needs a human

Nothing.
