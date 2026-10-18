# 2026-10-18 — accounts message-pam s2-s4

**Branch:** `claude/pam-message-pam-admin` · **Lane:** Accounts & invites (Ava)

Follows `2026-10-18-1454-accounts-message-pam-inbox-s1.md`. Mira, 16:10: "S2, S3, S4, in order, each READY with pictures."

## What changed

- **S2:**
  - Saved replies (`PamSavedReplies`) are wired into the Pam thread through Nico's `teamTools` render prop
    (5ac28807).
  - The team's ⋯ goes to the new `/pam/thread/options/` (`PamThreadOptionsScreen`, `PamTeamOptions` with a `more`
    list). It has Close or Reopen, and Stuff shared.
  - The only lines changed in Nico's `thread/page.tsx` are `teamTools` and `menuHref`, as he cleared.
- **S3:**
  - `/pam/start/` takes `?profile=` or `?service=`.
  - Everyone has a "Message … as Pam" button on each person.
  - On a program's page, the super admin's message row is "Message this program" while the switch is on (Piper
    cleared the row).
- **S4:** `/pam/hours/` has days, Opens and Closes stacked, the out-of-hours reply as a preview, and Save. The privacy guard
  lists it as collecting nothing personal.
- **Dot's inbox review:**
  - (a) In Arabic, an English body after "أنت:" is its own `dir="auto"` element and is cut at its own end.
  - (b) The reply-time line is cut: its keys are removed from seven locales and the ledger, and `replyDuration` and
    `usePamReplyTimes` are deleted.
  - (c) Back only on Messages to Pam, Closed, and Pam's hours.
- **Specs:** `e2e/pam-team.spec.ts` (12 tests) and `e2e/pam-place.spec.ts` (3) are new. `pam-inbox.spec.ts` gained the
  Arabic test and no longer reads the reply-time line.
- **Story:** `super-admin-screens--pam-thread-options`.
- Decision: D-613.

## What was wrong, and what missed it

- Unticking every day on the hours screen crashed it: `pamDaysLine([])` in `@pam/config` makes a day name from
  `undefined`. No test ticked every day off. The screen now hides the preview, and the new e2e unticks all five days.
  Nico has the finding for the function itself.
- The Arabic preview: my first fix put the body in an isolate but kept the line's single ellipsis. That still cut the start
  of the English. Only the 320 Arabic picture showed it; the computed-style test passed. The body now truncates itself.
  Then English lost its ellipsis, because English has no isolates and the whole line became one bare flex item. The split
  layout now applies only when there is an isolated piece.
- The Saved replies sheet's title sat under its grab handle. I copied the New message sheet's padding.
- Removing the reply-time keys, which were last in six locale files, left trailing commas. I fixed them line by line and
  checked each file parses.

## Decisions made

D-613, which builds on D-605.

## Verified

- e2e:
  - pam-inbox, pam-team and message-pam: 120 passed.
  - pam-place, row-taps, people-strip and no-examples-for-real-accounts: 48 passed.
  - All on narrow-320, dark-320 and iphone-se, with 0 failed.
- Web unit tests: 206. `tsc` is clean. `build-storybook` passes.
- Config tests: everything passes except translation parity, which waits on Lena and Sage for the new placeholder words.
- `next lint` is unconfigured. It asks to set ESLint up and exits 1, as it does on main.
- Pictures: `docs/design/review/2026-10-18-pam-team/` at 390 light, 320 dark and 320 Arabic.

## Left undone

- Sage has not signed these words yet: `pam.thread.*`, `pam.start.*`, `pam.program.*`, `pam.inbox.sent`, `pam.hours.*`
  (title, row, days, times, open, close, preview, save, said). Lena's six languages follow.
- Nico:
  - the team's composer should say "Reply as Pam" and take photos only, in the thread and on `/pam/start/`;
  - `profile_roles` in `pam_program_has_lead` and `pam_start_program_conversation` (Piper's finding);
  - an empty-days guard in `pamDaysLine`.
- D-608 shortens (529b21f0 is in b72): merge main once b72 lands, then send the second READY.

## Needs a human

Nothing new. The switch, Privacy and Terms are Will's, as D-605 says.
