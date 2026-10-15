# 2026-10-13 — messages help request roles

**Branch:** `claude/messages-help-request-roles` · **Lane:** Messages & notifications (Nico)

## What changed

`help-request` takes an optional `roles` array (member, program, case_manager); the email gets a "Says they are" row near the top. Dropped-not-refused for unknown labels, refused for a non-array. Not stored, logged, or in the subject or duplicate check. Handler tests (config/test/help-request.test.ts), contract doc, D-559.

## What was wrong, and what missed it

## Decisions made

## Verified

Config tests (1269 passed, 6 skipped); the new roles tests fail without the change and cover order, plain words, dropping, refusing, subject, duplicate check, logs.

## Left undone

Redeploy of help-request by the merge desk after the merge. Wren's form question; Sage's wording.

## Needs a human
