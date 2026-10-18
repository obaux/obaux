# 2026-10-18 — website d608 quotes held

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** website

## What changed
A held patch, `docs/design/review/2026-10-18-d608/d608-site-quotes.patch` (two source files, `git apply --check` passes on origin/main and after the Message Pam patch), for D-608 (Will 15:19, screens don't explain; Sage, b50e386a). The site quotes two app strings that change when the lanes ship:
- Messages in Pam, the block dialog: “Neither of you can send messages here. You can unblock them later.” (replaces the longer dialog text).
- Texts from Pam, the alt text of the Text reminders picture: the list is headed “Kinds of texts” (was “What we would send”).

## Held
Apply in the batch that ships the app change, not before. At ship: `pnpm --filter @pam/site posts:date messages-in-pam=<day> texts-from-pam=<day>` (the patch deliberately leaves `post-updated.json` and `posts.ts` alone, so it does not collide with the Message Pam patch, which also moves messages-in-pam). The Texts from Pam picture (`texts-from-pam/reminders.png`) shows the old heading; re-shoot it from Nico's screen when it ships.

## Verified
Site tsc 0 and tests 124 pass on the patched tree (text-only change). No browser checks: Mira's batch runs them.
