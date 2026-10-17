# 2026-10-14 — design text boxes lose their ring

**Branch:** `claude/pam-design-text-box-no-ring` (off `main`) · **Lane:** design system

## What changed

`globals.css`: the 3px ring Pam drew on the frame round a text field, and on the search pill, is gone (with the rules that cancelled it on the code boxes and the pill's inner field). Tests updated: `focus-text-boxes.spec.ts`, `consent.spec.ts`, `theme.spec.ts`. D-569 supersedes the text-box line of D-523. Pictures before and after at 390, light and dark.

## What was wrong, and what missed it

Nothing wrong: Will reversed his 11 October rule (a83).

## Decisions made

D-569.

## Verified

`focus-text-boxes`, `theme`, `consent`, `messages` e2e at narrow-320: 117 passed. Computed outline on the field, its frame and the next two parents is `none` for the search box (focused on arrival) and the sign-in field, light and dark.

## Left undone

The chat composer has no ring to remove (checked: none on Tab); the code boxes keep their 2px accent edge on purpose (D-251); both said in D-569. The accessibility trade (WCAG 2.4.7) is written there too.

## Needs a human

Will: the code-box edge stays unless he says otherwise.
