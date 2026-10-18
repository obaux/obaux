# 2026-10-18 — accounts message pam inbox s1

**Branch:** `claude/pam-message-pam-admin` (off `main` 2bcb2e39, with Nico's `claude/messages-pam-s0-s1a` @ 6b449896 and
Lena's `claude/lena-pam-inbox-words` @ a2fc2638 merged in) · **Lane:** Accounts & invites (Ava)

## What changed

S1 of my slice plan (`docs/design/plans/2026-10-18-message-pam-admin-build.md`, Nico's slice 4), card a100. Will picked
B on 07:04, and Mira said "go on S1" at 07:25.

- **Home's first row** (`RequestsScreen`): "Messages to Pam", with a plain `value` (D-586) counting the conversations
  waiting for a reply. It shows only when the switch is on (`usePamStatus`) and the inbox has loaded, so it never
  appears on live before Pam's functions exist.
- **`/pam/messages/`** (`PamInboxScreen`, Dot's x5):
  - Waiting for Pam, longest wait first, each with "Waiting 2 days".
  - Answered.
  - "Closed conversations" as one `MenuList` row with its count, opening `?show=closed`.
  - A foot line with the median first reply over 30 days.
  - Each row shows first name, "Member · {region}" / "Case manager · {region}" / "Program lead at {program}", and the
    last line, with "You: " when Pam wrote last. Nothing else.
  - The screen is gated on the role and the switch, and shows not-available otherwise.
- **Data:** Nico's `lib/pam.ts` (`usePamStatus`, `usePamInbox`, `groupInbox`, `pamReplyTimes`). I dropped the hook I'd
  started before his landed. Mine are `lib/pamInbox.ts` (`writtenIn`, `inboxGroups`, `waitedFor`, `replyDuration`)
  and a thin `usePamReplyTimes`.
- **Storybook:** `MessagesToPam`, `MessagesToPamClosed` and `MessagesToPamEmpty` in the super admin's screens, and
  `/pam/messages/` in the prototype routes. The fixtures are Nico's.

## What was wrong, and what missed it

- **I built against guessed column names** (`last_line`, `last_from_team`, `region`) before Nico's hooks landed. When
  they did, the real names were `preview`, `last_from` and `region_name`. The view moved onto his hooks; nothing
  shipped on the guess.
- **The reply-time line rounded down**, so a 1.5-hour median read "within 1 hour", which is false for half of them.
  It rounds up now, and a unit test holds it. The picture at 390 caught it, not a test.
- **`pam_inbox()` returned a welcome-only conversation for every account.** I filter those out (`writtenIn`). Nico
  then skipped them in the function itself (migration 20261018080342), so the filter is now a guard.
- **My first run of the English-locale script re-sorted the whole file.** I undid it and inserted the keys after the
  last `pam.` key.

## Decisions made

- None claimed. The inbox's shape is in D-605 and the plans; my side's decision is written at 4e, per the plan.
- The reply-time words are Sage's: "half of Pam's first replies came within", not "you usually reply within", since
  it is a median and may be read by more than one person.

## Verified

- `tsc` clean.
- `@pam/config`: 1430 passed, with Lena's six languages; `copy:status` in step.
- Web unit tests: 207 passed, including 7 in `pamInbox.test.ts`.
- e2e `pam-inbox.spec`: 24 passed (8 tests × 3 projects). It covers:
  - the row and its count, first on Home, with no red badge;
  - the switch off: no row, nothing shown, nothing read;
  - the order and the waiting words;
  - the closed list;
  - only the listed columns;
  - welcome-only conversations left out;
  - the empty and no-replies lines;
  - a member and a case manager refused, with the inbox never asked;
  - axe.
- Full e2e: see the READY.
- Pictures at 390 light, 320 dark and 320 Arabic, for Home, the inbox, closed and empty:
  `docs/design/review/2026-10-18-pam-inbox/`.

## Left undone

- S2 (Close/Reopen, saved replies; needs Nico's `teamTools`/`teamOptions` slots from his slice 2).
- S3 (starting as Pam from Everyone and a program's page).
- S4 (hours; needs `pamHoursLine` from his slice 2).
- 4e records.
- Lena noted that the mock's English preview truncates on the near side in Arabic. A real Arabic message won't; check
  once there is one.

## Needs a human

- None for S1. The switch goes on only with slices 2 to 4 and Will's signed Privacy lines (signed 14:44).
