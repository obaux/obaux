# 2026-10-10 — Messages & notifications (Nico): the STOP/START release checklist

**Branch:** `claude/messages-release-checklist` · **Lane:** Messages & notifications

Mira (10 October): check that `dispatch-sms` on `main` is what will deploy beside `sms-inbound`, write the exact
deploy order in `docs/sms-setup.md` § 3 as a checklist, hold `claude/messages-reply-start` for the same release.
No new features.

## What I checked (read-only, against the live project)

- `list_migrations`: the staff-invite queue, the STOP grants, the consent claim, trips and the STOP/START
  recorder are all applied. Nothing waits to be applied.
- `list_edge_functions`: only `dispatch-sms` (version 15, deployed 17 September) and `link-preview`.
- `get_edge_function dispatch-sms`: **the deployed dispatcher is the 17 September one**: "PAM:" wording, English and
  Spanish only, fifteen templates, no seven-language logic, none of the four alert texts. `main` has "Pam:", seven
  languages, the two-segment reminders, nineteen templates with the four alert texts signed. `templates.json` on
  `main` matches what the config tests generate (checked after the tests: clean tree) and has no unsigned template.
- The clock (`0040`) calls the function with the publishable key and **no** `x-dispatch-secret`. Setting
  `DISPATCH_SECRET` on `dispatch-sms` would make every run a 401: written into the checklist.

## What changed

- `docs/sms-setup.md` § 3 is now the release checklist: what was true, nine ordered steps (look, redeploy
  `dispatch-sms`, deploy `sms-inbound --no-verify-jwt`, secrets by name, a signed-out `curl` that must answer 403,
  Will's Twilio step, Will's STOP/START test with the audit-log query, then merge `reply-start` last, then "done"),
  and how to turn it back off.

## What was wrong, and what missed it

- Nothing in the repo; but the live dispatcher is four weeks of changes behind `main` and nothing said so. A copy
  change in `sms-templates.ts` reaches phones only after a redeploy, and no check compares the deployed bundle with
  the generated one. Worth a line in the release process: after any change to `sms-templates.ts`, redeploy.
- I could not read whether `DISPATCH_SECRET` is set on the live function (secrets are not readable): step 1 says what
  to do either way.

## Decisions made

- `reply-start` goes **last**, after Will's test, not first: the sentence is true only once the receiver works, and a
  Vercel build is the one step that cannot be taken back quickly.

## Verified

- Config 986 pass (twice), working tree clean after. Not run: anything against Twilio, anything that deploys.

## Left undone

- The release itself: the merge desk deploys and Will does the Twilio step.
