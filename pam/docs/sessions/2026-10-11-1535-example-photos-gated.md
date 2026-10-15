# 2026-10-11 — example photos gated

**Branch:** `claude/messages-example-photos-gated` · **Lane:** Messages & notifications

## What changed

The name-matched example photo is looked up only when `examplesOn()` (thread page, Messages list real rows). D-537. An e2e test, with a control for a demo account.

## What was wrong, and what missed it

D-511 gated example people and conversations but not the photo helper, which lives in the config package and matches by name and program. Only the host guard (Lena) noticed, because it looks at requests, not screens.

## Decisions made

D-537.

## Verified

The new test fails without the fix (built without it); messages.spec on three projects; full e2e, web and config unit (see READY).

## Left undone

`staffPhotoFor` could take the gate itself. Not done.

## Needs a human

Nothing.
