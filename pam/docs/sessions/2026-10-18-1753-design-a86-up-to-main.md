# 2026-10-18 — design a86 up to main

**Branch:** `claude/pam-design-search-bar-look` · **Lane:** design system (Dot)

## What changed

Merged main 615e1078 (b72: D-610's bell rule, `hideWhenNothingNew`) into a86. Three files conflicted with a86's own bell change: `HeaderBell`, `HeaderActions`, `ExploreScreen` (and STATUS). Both now stand: `HeaderBell` takes `hideWhenNothingNew` (main) and `isHidden` (a86); `HeaderActions` takes `bellOnlyWhenNew` and `isBellHidden`; a member's Explore passes both. So the bell is hidden while the search bar is open, and hidden when nothing is unread; one unread brings it back with its dot when the bar closes.

## What was wrong, and what missed it

Nothing new. The merge is the point: main's rule and a86's were written apart.

## Decisions made

None; D-610 and a86's are as they were.

## Verified

On the merged tip: explore-bell (main's three cases plus a86's open, Cancel and Escape cases), explore-bell-shift, one-search, focus-text-boxes, places, case-manager-pass: 153/153 across narrow-320, dark-320 and iphone-se-viewport. tsc clean. On main's real build (615e1078, a worktree) with a86's spec files: 26 fail on the iPhone project, 19 pass; the bell cases that fail are a86's open and Escape cases and the centred launcher, since main has no `SearchBar`. Pictures: `docs/design/review/2026-10-18-a86-merged-bell/` (none, only read, one unread; 390 light, 320 dark, 390 Arabic).

## Left undone

a86 ships only on Will's yes and the p7 signature. The staff Home search is now a plain field on main (D-610), not a `SearchBar`, so it has no bell rule to hold.

## Needs a human

Will's yes on a86, and p7.
