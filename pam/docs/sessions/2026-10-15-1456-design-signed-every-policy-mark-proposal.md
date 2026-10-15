# 2026-10-15 — design signed every policy mark proposal

**Branch:** `claude/pam-design-signed-mark` · **Lane:** design system (Dot) · Asked by Piper (Iris's program lead pass, P5)

## What changed

Pictures and a patch only, in `docs/design/review/2026-10-15-signed-mark/`: three candidate marks for "signed every policy" in Coming in (light, dark, 320, Arabic), and whether people who haven't signed get one. No app code changed.

## What was wrong, and what missed it

The green pen means "to sign" everywhere else (D-270: `SignIcon` orange on the policy and trip cards) and is the edit icon besides; D-316 reused it for the opposite. A tick in a circle is also taken (each signed policy, D-369; the check-in circle, D-316), so the fix is a different shape, not a different glyph in the same circle.

## Decisions made

None recorded: a proposal until Will picks. Recommended: a document with a tick; nothing for people who haven't signed (D-261, D-324).

## Verified

Candidates shot in Storybook's `program-lead-states-home--week` in light, dark, 320 and Arabic against the same rows. The patch was reverted; the branch holds no code change.

## Left undone

If Will picks it, Piper adds the icon to `packages/ui/src/icons.tsx` with its note and story, in the program lead branch. An unsigned mark, if wanted, needs a label from Sage and Lena.

## Needs a human

Will picks the mark and whether unsigned people get one.
