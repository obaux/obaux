# 2026-10-10 — Places & programs: load a program lead's own program (parts 1–3)

**Branch:** `claude/places-programs-load-own-program` · **Lane:** Places & programs (Piper)
**Job:** Will, 10 October: do parts 1–3 of "Load a program lead's own program" first, then plan the rest so it does not collide with other merges.

## What changed

- **A lead's program is read from the database.** `lib/useOwnProgram.ts` (a small shared store, so Home, the Program tab and the review page ask once) reads the lead's `profiles.org_id`, then the newest `services` row of that org. `lib/ownProgram.ts` holds the pure parts (row → screen shape, what a send and a save write). `useProgramSetup` now follows it: a lead with a program on file sees it, waiting or live, on any phone; the tab's sessionStorage marks still decide for demo accounts and for a lead with none.
- **"Add a program" sends for real** (`submit_program`), for a signed-in program lead who is not a demo account; it stays on the last question and says "We could not save that" if it fails (existing words, no new copy).
- **The Program tab edits for real.** A live program's name, address and kind of help show but are disabled, with one new sentence (`program.locked`, seven languages, drafts, in the ledger); description, phone and website save at once. A program still waiting for review may change anything.
- **"What you sent"** reads the program on file; "Delete and start over" is hidden for a program on file (see Left undone).
- **Database (two migrations, none applied):**
  - `20261010042108_a_program_lead_submits_their_own_program.sql` — `submit_program()` makes the lead's org and a `needs_review` listing; a trigger stops a provider approving their own listing, moving it to another org, or renaming/moving/recategorising a *live* one (D-447); and `flag_unapproved_rewrite` no longer hides a live program when its lead changes the words.
  - `20261010062347_an_approved_program_lead_gets_an_org.sql` — `review_staff_request` (0085's body) gives an approved lead an org. **0085 first**, and it refuses to run without it.
- **D-447**: editing a live program (Will, 10 October). Written and claimed.
- A draft post for the public site was sent to the Website session, to publish only when this ships.

## What was wrong, and what missed it

- **The documented plan was wrong.** `before-launch.md` and `AddProgramView` said the rules "already let a lead write a listing", so sending was "a follow-up, not a migration". They do not: nothing gave a self-signed-up lead an org (`profiles.org_id` null), so `services_write_provider` refused them; and `review_staff_request` wrote the approved program with no `org_id`. Nothing tested a lead writing a listing, so nothing said so. `23_program_lead_submits_test.sql` and `25_approved_lead_gets_an_org_test.sql` now do.
- **A lead could approve their own listing.** 0016 granted `insert, update` on `services` to `authenticated`, and the write policy is `for all`, so `update services set needs_review = false` worked for a lead on their own row. The review gate (D-379) held only because no screen did it. The new trigger closes it.
- **A trigger from 0020 fights D-447.** `flag_unapproved_rewrite` sets `needs_review = true` whenever a listing's description changes, so a lead fixing one sentence would have hidden their live program until Pam re-approved. Found by my own test ("a lead changes a live program's phone, website and description at once"), which failed on first run.
- **My first test of the lock passed for the wrong reason.** The fixture row was inserted while a previous step's JWT claim was still set, so the new trigger treated the owner's insert as the lead's and held it for review; the "rename a live program" check then had nothing live to attack. Fixed by clearing the claim before fixtures. Worth remembering: a `set_config(..., false)` claim outlives `reset role`.

## Decisions made

- D-447 — editing a live program (Will, 10 October).
- Org fix is built on 0085's body, 0085 applied first (Mira, relaying Will: "go ahead and decide, you're the CTO").

## Verified

- `pnpm --filter @pam/db test`: passes with both migrations and both new files, on a database built from every migration including 0085.
- **Refusal path:** a database built from every migration *except* 0085, then `20261010062347`: raises `APPLY_0085_FIRST` and `review_staff_request` is unchanged (same definition hash before and after).
- `numbering.test.ts` passes (no `drop`/rename in either migration). `pnpm --filter @pam/web test`: 55 passed (7 new, `ownProgram.test.ts`). `pnpm --filter @pam/config test`: 808 passed. `tsc --noEmit` clean. `copy:status`: all languages in step.
- Storybook build passes. In a browser (Chromium, 390px): the new stories "Program — on file" render from the pretend database — waiting for review shows "Sent to Pam", live shows the program; Edit on the live one disables name and address, leaves description/phone/website editable, and shows the locked sentence; no `[journey] no fixture` logs.
- **Not run:** the language-fit audit (`audit:fit`) on the new sentence in Russian, Arabic and the pseudo-language — the PR check will. Nothing was run against the live project.

## Left undone

- **Delete and start over** for a program on file: starting over withdraws it from the review queue (D-385, D-386), which needs `program_submissions` (part 5a). Until then a lead who sent something wrong must call Pam; the menu offers Help only.
- **Changing a live program's name, address or kind of help** has no path in the app yet: the database refuses it and the screen says to call Pam. Part 5a builds the pending-change flow.
- **Existing approved leads** (approved before `20261010062347`) have a program with no org; their first "Add a program" creates one, but their old listing stays orphaned. A one-off repair is Will's/the merge desk's call.
- **The review wait** (status from the database, Pam's note, a text when live) — part 5b. `changes` is never set for a program on file, so "Pam asked for changes" does not appear for real leads yet.
- **Flow map**: no screen was added, removed or rewired, so `docs/user-flows` is unchanged.
- **Home flashes the example** for a real lead for a moment while the database answers (the example is the pre-launch default while `USE_DUMMY_PEOPLE` is true). It goes with that flag.
- Parts 4 (switching programs), 5a/5b, 6 (super admin queue): see the plan in the READY note.

## Needs a human

- Will: apply 0085 by hand, then the two migrations (merge desk sequences them).
- Will: part 5a wants a `program_services` table for the services a program offers (D-313 reserves that for his approval).
