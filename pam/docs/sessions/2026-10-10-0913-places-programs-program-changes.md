# 2026-10-10 — Places & programs: a live program's pending change, and Delete and start over (the screens for 5a's review record)

**Branch:** `claude/places-programs-program-changes` (stacked on `claude/places-programs-submissions-and-services`, the database half, which must merge first) · **Lane:** Places & programs (Piper)
**Job:** Mira, relaying the plan Will approved: after trips, "programs' pending changes and their list of services". This is the first, the pending changes; the list of services is next.

## What changed

- **The Program tab reads what is waiting for Pam.** `useOwnProgram` now reads the lead's active listing and its open `program_submissions` (D-462): `submissionId` and Pam's note for a first check, `pendingChange` (the new name / address) for a live program. A first send that was withdrawn is deactivated and is not shown.
- **A live program's name or address is asked of Pam, not locked** (D-447 built). Edit now lets the lead type a new name or address; saving writes the description, phone and website at once and calls `request_program_change` for the rest. The page keeps showing what members see, says "Saved. Your new name or address is waiting for Pam…", and a "Waiting for Pam" banner shows what was asked with "Cancel these changes" (`withdraw_program_submission`). Kind of help is not editable on this screen (it never was), so `changeRequest` carries the live one.
- **Delete and start over works** for a program with a send on file: it calls `withdraw_program_submission`, marks the account fresh again, and lands on Add a program rather than the example. The menu still offers it only when there is a send to withdraw.
- Copy: one string reworded (`program.locked`, now "Pam checks a new name or address before members see it."), four new, all seven languages, in the ledger.
- Stories: "Program — on file" gains *Live with a change waiting* and *What you sent*; the mock answers `program_submissions`, `request_program_change`, `withdraw_program_submission` and the services update.

## What was wrong, and what missed it

- **A banner action that silently did nothing.** I passed `action` to Astryx `Banner`; the prop is `endContent`. TypeScript did not object because the props were spread from a conditional object. The browser check (click "Cancel these changes") caught it. Worth remembering: a spread into a component hides a wrong prop name from the typechecker.
- **A mock that answered with a 204 and a body.** My first fixture for the services update returned `{status: 204, body: null}`, which the mock turns into a `Response` that throws, so "Save" showed the failure notice. The browser check caught it; it answers `[]` now.
- **Start over landed on the example program**, not Add a program: while `USE_DUMMY_PEOPLE` is true an account with nothing on file shows the example unless this tab marked it fresh. The browser check showed it; it marks the account fresh after withdrawing.

## Decisions made

None new: this builds D-447 and D-462.

## Verified

- web 67 tests (6 new for the submission mapping and `changeRequest`), tsc clean, `copy:status` in step, Storybook builds.
- In a browser (Chromium, 390px): editing a live program's name → "Waiting for Pam" banner and the old name still shown; a change already waiting → banner, Cancel clears it and the program stays live; What you sent → Delete and start over → Add a program; no unanswered mock calls.
- Language fit at 320px, seven languages and the pseudo-language, on the program stories: nothing unaccepted (nine pseudo entries for the example services' one-line descriptions, one line with an ellipsis by design, recorded in `fit-known.json`).
- **Not run:** anything against the live project. This needs migration `20261010083715` live (it reads `program_submissions` and calls the two functions); without it the Program tab for a real lead would fail to load the waiting state.

## Left undone

- **The services list** (`program_services`, D-313) on the Program tab, the service editor, and member place pages: the next job.
- **A lead resending after Pam asks for changes** (`changes_asked`): nothing sets that state until part 6, and the database has no resend function yet (D-386: it updates the same submission back to `in_review`).
- **The kind of help** (category) cannot be edited on the Program tab.
- A program that predates the review record has no submission, so Delete and start over is not offered for it.

## Needs a human

- Mira / Will: the database half (`claude/places-programs-submissions-and-services`) must be live and merged before this one.
