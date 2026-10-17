# 2026-10-17 — accounts case manager home a93

**Branch:** `claude/pam-caseload-visit-line` · **Lane:** Accounts & invites (Piper's Home lane, lent for a93)

## What changed

- `caseloadVisit.ts`: the one visit line, and `wentTo`, now shared with the member's page.
- `useCaseload`: one `appointments` read for the whole list. D-596 has the rule and why nothing new is shown.
- `StaffHomes.tsx` `CaseloadHome`:
  - The visit line and chip replace points.
  - Dot's two rows under the cards (Invite someone, What you can see), with the What you can see bottom sheet.
  - The floating Invite button and the foot paragraph are gone.
- Words: `caseload.visit.next`, `.went` and `.missed`, with Sage's signed English (ledger 6867b09b). The six other
  languages hold the English, unrecorded, until Lena translates.
- Storybook:
  - The fake caseload gains Jordan (m3).
  - The visits mock answers the whole-list read.
  - New story: Case manager › States › Home › What you can see, open.

## What was wrong, and what missed it

- I wrote the new stories into `CaseManagerHome.stories.tsx` with a shell `cat >`, which overwrote the existing
  file. I saw it in `git status` (M, not A), restored it, and added one story to it. Every other file made that
  way in this session was new; I checked each one.
- First rule: "went" before "missed". Mira corrected it to the most recent marked visit, and the test holds her
  exact case.

## Verified

- Unit tests (`caseloadVisit.test.ts`, 8): the rule, Mira's case, and Home and the member's page agreeing on every
  status. Web `tsc` is clean.
- Pictures in `docs/design/review/2026-10-17-cm-home-built/`: home en 390 and en 320, ar 320 and ar 390, and the
  sheet. They match Dot's drawing, with Sage's words.
- e2e, after build:e2e:
  - First full run: broken. A run I had stopped took the test web server down, so everything got "connection
    refused".
  - The rerun of the specs that touch this Home found 8 real failures × 3 projects: admin, case-manager-pass and
    connect-examples-only didn't stub the new `appointments` read, so the caseload waited on it. Two tests also
    expected the promise on the page instead of in the sheet.
  - Fixed both. New test in admin.spec: four members get "Next visit", "Not marked as there", "Marked as there"
    and nothing; no points; exactly one whole-list read; Invite someone is a row linking to /invite/.
  - admin, case-manager-pass and connect-examples-only: 90 passed on 3 projects. staff-home, invite,
    people-strip, person-real-trips, a11y and languages passed in the rerun.
- I also ran `pkill -f` once and killed my own shell again; use the port.

## Left undone

- Lena's six languages for the three visit lines. Config is red on them until then.
- Pictures on card a93 for Will's yes, then READY.

## Needs a human

- Will: yes on the pictures (card a93).
