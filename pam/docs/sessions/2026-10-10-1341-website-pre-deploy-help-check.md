# 2026-10-10 — website: every help post checked against main before tonight's deploy

**Branch:** `claude/compassionate-bohr-mzrchf` (main `75cb832` merged in) · **Lane:** Website

Mira (13:38): re-check every post against main as it is now (tab layout D-456, legacy Messages gone D-469,
Block, trips saved/cancel/past, four ways to earn, wrapping badge names, the loader fix). Method: one
fresh build of main's Storybook; every picture retaken in one run and compared byte for byte with the
committed one; every quoted label in every post checked against `en.json` by a script; the app diff since
the last review read for anything a post names; then each post read.

## What changed

- **Messages in Pam**: the "who can start a chat" table was wrong about super admins. Migration 0072 (D-262)
  lets a super admin message case managers and program leads, never a member; the post said "Nobody". Table,
  header comment and a line below it now say so; a case manager and a program lead can also be messaged by
  a super admin. The Block section said a super admin is not in the "anyone can block" line because they
  message nobody; it now includes them. New: case managers and super admins see reported messages under
  "Reported" on Messages (D-469), with the app's sentence.
- **Texts from Pam**: one clause in the rules: a sign-in code more than 12 hours late is cancelled instead of
  sent (D-475); ask for a new one. Reminders and everything else about texts still follow `flags.ts`.
- **Sending an invite**: in the + menu the label reads "Invite someone to Pam" (the Profile row reads "Invite
  someone"); the step says so.

## Checked, unchanged

- Joining Pam, Joining as staff, One phone two sides, Who is my guide, What others can see (transparency.ts
  not touched since), Points and badges (four ways; picture identical after the badge-name wrap),
  Planning a visit, Staff requests (draft), Case manager assignments (nothing has landed on assign/limit),
  Pam words.
- **All 19 pictures are identical to the committed ones** on the new Storybook, so none was re-committed.
- Every quoted label in every post exists in `en.json`, except five that are filled in by the app or by a
  fixture (the invited-as line, a place name, two fixture service names, "This number is already in Pam"
  split across lines; the last checked by hand).
- The loader fix (D-471) and the wrapping badge names change no step or label.

## What was wrong, and what missed it

- **The super-admin row of the Messages table had been wrong since I wrote it.** I read D-176 and 0063
  (members, case managers, programs) and did not read 0072, which narrows D-171 and is the one that names
  super admins. Found today because D-469 mentions "staff can already message the super admin (0072, D-262)".
  Nothing checked the table against `can_message`. Left: a test that reads `can_message` is not possible
  from the site, so the post's header comment now names 0072 as well.

## Decisions made

None new.

## Verified

- Site tests, tsc, normal build and `a11y.mjs` (numbers in the READY note).

## Left undone

- Picture of "Past visits" waits for Piper's story. Unchecked: the deployed app, Vercel, GitHub Actions.

## Needs a human

- Will: sign the English of About Pam.
