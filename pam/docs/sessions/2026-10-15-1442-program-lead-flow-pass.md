# 2026-10-15 — program lead flow pass (D-582)

**Branch:** `claude/places-programs-lead-flow-pass` · **Lane:** Places & programs (Piper), job from the merge desk

## What changed

- S1: `BookForMemberView.tsx` lists the lead's real conversations with members (own READY first, 87776c94). New `e2e/book-for-member-real.spec.ts`.
- W1: `StaffHomes.tsx`, `ProgramLeadHome.stories.tsx` (Help on).
- W3: `ScheduleView.tsx` (tabs 48px; the week starts at the day shown).
- W4: `StaffPeopleRow.tsx` (heading for a lead; faint circles keep it), `StaffHomes.tsx` (no strip with no program). `staff-home.spec.ts` updated: the (+) test now covers a lead with no program having no strip.
- P1: `AddProgramView.tsx`. P6: `app/person/page.tsx`. P7: `AddMenu.tsx`. P9: `packages/ui/src/InfoTip.tsx`.
- Tests: new `e2e/lead-flow-pass.spec.ts`.

## What was wrong, and what missed it

S1 broke on D-509's "no examples for real accounts": the real replacement for the example list was never written, so the screen's promise quietly turned into an empty state. Nothing tested a real lead with a real conversation on that page. Now one does.

## Decisions made

D-582 (it reverses the 38px tabs of D-355, the "small target is the rule" of D-368 for the target, and D-486's (+) circle on a new lead's Get started).

## Verified

Built with `build:e2e`. Specs on three projects: lead-flow-pass, staff-home, program-visits, person-real-trips, tap-targets, a11y, book-for-member-real, program-book-example; `@pam/ui` tests. Before and after shots in `docs/research/shots/2026-10-15-piper-*`.

## Left undone

P2 and P4 wait on Sage's and Lena's words (proposals sent to the merge desk). P5 waits on Dot's mark. P3 is Will's. W2 and P8 are Ava's. P10 is Lena's. Copy address is fixed on the member branch (D-578), not here. W5 (Iris's member note) is not mine.

## Needs a human

Will: the picture card should say the Day/Week/Month tabs are now 48px, against his 7 October 38px, and that a new lead's Get started has no people strip.
