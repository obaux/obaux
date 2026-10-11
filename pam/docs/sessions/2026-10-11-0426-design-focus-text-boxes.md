# 2026-10-11 — design focus text boxes

**Branch:** `claude/pam-design-focus-text-boxes` · **Lane:** Design system & Storybook

## What changed

One CSS rule in `globals.css`: a `tabindex=-1` non-control, a `dialog` and `[role=dialog]` get `outline: none` on `:focus-visible` in every input mode. Replaces D-411's focus line. D-523.

## What was wrong, and what missed it

D-411 moved where a dialog focuses but left the global ring on; the browser draws it on script focus after any keyboard use. No test looked at the outline of the focused element.

## Decisions made

D-523.

## Verified

`focus-text-boxes.spec.ts` (7) and the photo viewer in `messages.spec.ts` (2), narrow-320; theme, legal and legal-tabs specs. With the rule removed the keyboard sheet and confirm-dialog tests fail.

## Left undone

Only narrow-320 run for these specs. The Privacy/Terms section link passed even before the fix in headless Chromium; Will's report may be on a phone browser.

## Needs a human

Will: try a Privacy contents link and a modal on the phone.
