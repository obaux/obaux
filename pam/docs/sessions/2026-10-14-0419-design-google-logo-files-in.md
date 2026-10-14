# 2026-10-14 — design google logo files in

**Branch:** `claude/pam-design-google-logo` · **Lane:** design system

## What changed

Google's Gray and White Maps logos (from the set Will approved on card a81) are in `apps/web/public/google/`, unchanged, renamed light and dark. README records where they came from and that the 16–19px and "Google Maps" sentence were not confirmed by Will. Imagery list entries, a test for the files (`PoweredByGoogle.test.ts`), and a check in the street-search e2e that the logo loads from Pam's origin at 18px. D-557 updated. Pictures at 320 and 390, light and dark.

## What was wrong, and what missed it

Nothing wrong; this was waiting on the files.

## Decisions made

D-557 extended (which sets, and why not the outlined ones).

## Verified

`PoweredByGoogle.test.ts` and `imagery.test.ts` (6 passed); street-search and area-picker e2e at narrow-320 (17 passed); the logo drawn in the suggestion list at 320 and 390, light and dark.

## Left undone

Will to check 16–19px and "Google Maps" against Google's page. Will makes the key after this ships.

## Needs a human

Will: the check above, and the key.
