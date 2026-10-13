# 2026-10-13 — design green card chip progress

**Branch:** `claude/pam-design-card-progress` · **Lane:** Design systems

## What changed
Story `apps/web/src/stories/website/CardChipProgress.stories.tsx` (States, Running): the look of the translucent progress fill behind the green card's chips, light and dark, left-to-right and right-to-left, with live contrast ratios. No site code changed.

## What was wrong, and what missed it
Nothing; a new look for Will's a77.

## Decisions made
D-553.

## Verified
tsc and build-storybook pass; looked at every state in a screenshot.

## Left undone
Wren's build at 320/390 is checked once he pushes it. The Pause/Play words for the card need Sage.

## Needs a human
Whether the dark selected chip needs a stronger fill (see D-553).
