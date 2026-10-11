# 2026-10-11 — design saved tooltip

**Branch:** `claude/pam-design-saved-tooltip` · **Lane:** Design system & Storybook

## What changed

New `ConfirmTip` in `@pam/ui` (bubble by a button, ~2s, fade, polite live region); wired into `PlaceBarActions` and `PlaceCard`; story; `e2e/saved-tip.spec.ts`. Uses the existing `places.saved`. D-516.

## What was wrong, and what missed it

Saving showed only a changed icon; nothing said it had worked.

## Decisions made

D-516. Unsave says nothing (proposed: leave it).

## Verified

`tsc` (web, ui); saved-tip and saved specs in three projects (36 passed); build; build-storybook; fit audit on the place card stories.

## Left undone

If Will wants a word on removing, one more trigger and a new string.

## Needs a human

Will: look at Components › Feedback › ConfirmTip, and say whether removing needs a word.
