# 2026-10-17 — design menu items and jump link targets W2 P2

**Branch:** `claude/pam-design-menu-targets` · **Lane:** design system (Dot)

## What changed

**W2 (Iris's run-through):** the drop-down menu items were 34px: a place's More options (`PlaceBarActions`), Home's + (`AddMenu`) and What you sent's More (`WhatYouSentView`), where "Delete and start over" sat directly above Help. All three are Astryx `DropdownMenu`, so one rule in `globals.css` (`.astryx-dropdown-menu-item { min-height: var(--pam-touch-target-min) }`, beside the dropdown option rule of D-370) makes every item 48px, and the other menus that use the same component (role, language, page title) get the same floor. No change to LanguageSwitcher, LanguageField or Dropdown (Lena's).

**P2:** the Terms/Privacy jump links are 40px pills (D-417) with an invisible margin that was meant to make each a 48px target. It gave 46: a `::before` inset is measured from the padding box, inside the border. `insetBlock` is now `-6px`, so a tap 3.5px above or below the pill opens the section. The pill's look is unchanged. In Storybook the `#` links already scroll (the Terms story goes from 0 to 916px on a tap; the prototype and the preview handler both let `#` through), so there was nothing to change there.

## What was wrong, and what missed it

## Decisions made

## Verified

New `e2e/menu-items.spec.ts` (a place's More options: every item 48px; 34px on main) and `e2e/legal-toc-targets.spec.ts` (hit-tests 3.5px above and below every pill; fails on main at the top edge); both pass on narrow-320, dark-320 and iphone-se-viewport. Languages, account, tap-targets, legal-tabs and messages specs pass. Full e2e: see the READY.

## Left undone

## Needs a human
