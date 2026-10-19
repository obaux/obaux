# 2026-10-18 — design malfunction alert surface

**Branch:** `claude/pam-design-malfunction-surface` (off main `9aac8b6f`) · **Lane:** design system (Dot)

## What changed

`apps/web/src/lib/malfunction.tsx`: the floating alert's wrapper (`styles.inner`) has `--color-background-popover` and an 8px radius. Ava found it on /directory/ at 390×700: the card under the alert read through its words, because every layer from `role=alert` to the fixed host computed to `rgba(0,0,0,0)`. CompactNotice's own `--color-background-sunken` is not a token the theme defines, so it is transparent too; inline on a page that is invisible, floating it is not. The fix is in the floating wrapper, so CompactNotice inline is untouched.

## What was wrong, and what missed it

My D-616 pictures were of /alerts/ and the story, where the page under the alert's place is empty, so a missing surface did not show. No check looked at what is behind it.

## Verified

New `e2e/alerts.spec.ts` test (some layer from the alert up is opaque) fails on main's real build (worktree) and passes on this branch on all three projects, light and dark. alerts.spec 69 passed, config tests 1491, tsc clean, bundle budget 6.0 kB spare.

## Left undone

`CompactNotice`'s `--color-background-sunken` is undefined, so the compact notice has no fill where it is used inline. Left as it is; a decision for the next time that notice is touched.
