# 2026-10-13 — design green card transition

**Branch:** `claude/pam-design-card-motion` · **Lane:** Design systems

## What changed
Story `apps/web/src/stories/website/CardTransition.stories.tsx` (real time and four times slower, with stand-in pictures). The motion is in D-556 for Wren. No site code.

## What was wrong, and what missed it
The 240ms swap read as abrupt. Also found while building: a crossfade with both pictures animating opacity dips to the card's green at the middle; the old picture has to stay until the end.

## Decisions made
D-556.

## Verified
tsc and build-storybook pass; looked at four frames of the slowed story (no dip, one line at a time).

## Left undone
Wren builds it; I tap-check at 320/390 and reduced motion.

## Needs a human
Nothing.
