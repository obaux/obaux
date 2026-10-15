# 2026-10-12 — colour examples for a65

**Branch:** `claude/pam-design-colour-examples` · **Lane:** Design systems

## What changed
New story `apps/web/src/stories/website/TextColours.stories.tsx` (Website / Text colours): grey #666666 vs #595959 on four surfaces, green #0B991F vs #087A18 on white, ratios computed live. No site tokens touched.

## What was wrong, and what missed it
Nothing broken; Will needed to see the choice.

## Decisions made
D-546.

## Verified
`tsc --noEmit` and `build-storybook` pass.

## Left undone
Will's pick. Then the tokens and palette follow in one small change.

## Needs a human
Will chooses.
