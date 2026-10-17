# 2026-10-17 — design a86 bell hides while searching

**Branch:** `claude/pam-design-search-bar-look` · **Lane:** design system (Dot)

## What changed

`SearchBar` reports open/closed (`onOpenChange`); `ExploreScreen` passes it to `HeaderActions` (`isBellHidden`) and `HeaderBell` (`isHidden`) returns null after its hooks, so the list and the unread count stay loaded and the bell returns with its dot. Cancel and Escape now put focus on the launcher (before, it fell to the page; Mira's brief said "as today" but there was no such focus return). Merged origin/main. Specs: explore-bell gets two (open: no bell in the tree, bar wider; Cancel: bell and dot back, header unmoved, launcher focused; Escape).

## What was wrong, and what missed it

## Decisions made

## Verified

The two new specs fail on the branch without the change and pass with it. one-search, explore-bell, explore-bell-shift and focus-text-boxes: 102 pass on narrow-320, dark-320 and iphone-se-viewport. tsc clean; @pam/ui test passes. Pictures at 390 and 320, light, dark and Arabic.

## Left undone

The case manager Home search (StaffHomes, Ava's a93) is not on `SearchBar` yet, so it has no bell rule; a86 ships only on Will's yes and his p7 signature.

## Needs a human
