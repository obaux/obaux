# D-596 — Case manager Home shows one visit line per member, not points

**Date:** 2026-10-17 · **Branch:** `claude/pam-caseload-visit-line`

## Decided

Card a93. Will chose Dot's design on 17 October, and Mira relayed the details.

- **Each member card shows one line, not points.**
  - If a visit is coming up: "Next visit: {when}".
  - Otherwise, the most recent past visit that was marked, whichever way:
    - "Marked as there: {date}" if the program checked them in;
    - a dark chip, "Not marked as there: {date}", if nobody marked it.
  - If there are no marked visits, nothing.
  - Cancelled visits and unmarked past visits are skipped.
  - The words are Sage's (ledger 6867b09b).
  - Points stay on the member's page.
  - The order of the list doesn't change.
- **If a card already has a chip for what is switched off, that chip wins.** The visit then shows as a plain line, so
  nothing is lost.
- **One read for the whole list.** It asks `appointments` for `member_id`, `starts_at` and `status`, with
  `member_id in (…)`, under `appointments_select_admin` / `admin_covers`. That is the rule the member's page already
  reads under, so there is no new function and no policy change.
- **Under the cards, one card with two rows** (Dot's drawing):
  - "Invite someone", which replaces the floating button;
  - "What you can see", which opens a bottom sheet holding today's words: `admin.seeing.title`,
    `join.privacy.admin.1–4` and `admin.seeing.told`.
  The paragraph at the foot of the page is gone.

## Why

- Will (a93): the most useful fact first, so a guide knows who showed up without calling around.
- **"Not marked as there", not "Missed".** Pam records a mark, not the fact. The only thing that sets `missed` is
  `sweep_missed_visits()` (D-526), overnight, for a visit nobody marked. No program marks someone absent.
- **One rule for "went".** `wentTo(status)` is used by both Home and the member's page. A test runs every status
  through both, so a guide never sees a "Marked as there" the member's page doesn't list (Sage).
- **Most recent marked visit, not "went" first.** Mira, 17 October, from the card's own wording: "if the last visit
  was attended… otherwise, if the last one was missed".

## Nothing new is shown

Visits, and whether the person went or missed one, are in `ADMIN_CAN_SEE` (`appointments_and_attendance`), and
members are told so (`transparency.canSee.appointments`, `join.privacy.admin.2`). One difference: the case manager's
view of a member lists only upcoming and attended visits, so Home's chip is the first place a case manager sees an
unmarked one. That is inside the promise, and Mira knows.

## Later

- a94: when programs can book visits, `CaseloadVisit.bookedBy` carries the program's name for a visit a program
  booked that wasn't marked. Piper adds the column, and Dot draws the look.
