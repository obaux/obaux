# 2026-10-15 — accounts case-manager-pass

**Branch:** `claude/pam-case-manager-flow` (from main 73f96b76) · **Lane:** Accounts & invites (Ava)

The merge desk routed Iris's case manager first pass to this lane (15 October, 13:51): W1, W2, W3 and P3 to P9.

## What changed

- **W1:** joining step 2 goes back to About you (members too). With an account, Next saves the corrected name and
  city on it (`updateMyDetails` in `useJoin.ts`), never a second redeem. Staff step 2 has Contact Pam.
- **W3:** `/person/` is titled with the member's first name.
- **P3:** Connect says "Distances are from City Hall." It measures from `CITY_HALL` today, and the member's area isn't
  visible to a case manager (`ADMIN_CAN_SEE`).
- **P4:** the after-recommending screen has "Back to {name}" and "Return home".
- **P5:** "What you can see" is at 16px, with a section-style heading.
- **P7:** staff joining by invite see "City you work in" (`join.details.city.work`).
- **P8:** `packages/ui` SearchPill: the typeahead's own label is empty inside the labelled group.
- **P9:** InviteForWho lists every missing field at once.
- **Strings:** two new English keys (`person.connect.distanceFrom`, `join.details.city.work`), sent to Sage. W2's
  reword of `admin.caseload.empty.body` waits on Sage.
- **Records:** D-580, this log, a changelog fragment, STATUS.

## What was wrong, and what missed it

- **Step 2's "no back once the account exists" was a choice written into a comment, not a test.** Nothing checked that
  joining never dead-ends. The two new join tests now walk back from step 2 and check that the fix lands on the
  account and the invite is redeemed once.
- **P8 was the same bug SearchField already had a fix for (Iris, b20),** in the component next to it. The fix wasn't
  carried over. The new spec asserts the exact accessible name.

## Decisions made

- D-580.

## Verified

| Check | Result |
|---|---|
| `build:e2e`, then Playwright on 3 projects: case-manager-pass, join, admin, invite, connect-examples-only, people-strip, person-real-trips, messages, staff-home, a11y, back, consent, directory, street-search, places, program-visits, focus-text-boxes, tap-targets | 738 passed |
| `@pam/ui` vitest and typecheck | 124 passed; clean |
| `@pam/web` vitest; tsc | 177 passed; clean |
| `@pam/config` vitest | red only on the 2 new keys missing in six languages |
| Storybook build (branch and main, for the shots) | both pass |

## Left undone

- P5's list (item 11): waits for Sage's new admin.seeing / join.privacy.admin keys and Lena's languages.
- person.connect.distanceFrom is not signed yet. The six languages for the new and reworded keys (Lena).

## Needs a human

- Sage: `person.connect.distanceFrom`, `join.details.city.work`, W2's body, and whether W3 should read "Marcus's
  profile" rather than the name.

- 14:30: Sage signed W2, W3 and P7 (ledger 8710a563). W2's body and P7's missing line are wired. Item 10: the
  "Programs saved by" link, the /person/saved/ page, its story and its route are removed (test in case-manager-pass).
- 14:45: program leads too (Mira 14:18): their step 2 back + Contact Pam (join test), and their member page titled with the name, one h1 (program-visits spec). Shots PL-*.
- 14:55: merged Lena's claude/lena-cm-lists (445936b2). Item 11: Home's What you can see is the join.privacy.admin.1–4 list + admin.seeing.told. admin.spec's old 'Not their messages' check updated to the signed words. Row 5 for program leads is on its own branch, claude/pam-lead-expect-row5 (572ed044), held for card a92.
