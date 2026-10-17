# D-596 — Case manager Home shows one visit line per member, not points

**Date:** 2026-10-17 · **Branch:** `claude/pam-caseload-visit-line`

## Decided

Card a93. Will chose Dot's design on 17 October, and Mira relayed the details.

- **Each member row shows one line, not points.**
  - If a visit is coming up: "Next visit: {when}".
  - Otherwise, the most recent past visit that was marked, whichever way:
    - "Marked as there: {date}" if the program checked them in;
    - "Not marked as there: {date}" if nobody marked it: the same one line, in red (Will, 17 October, below).
  - If there are no marked visits, nothing.
  - Cancelled visits and unmarked past visits are skipped.
  - The words are Sage's (ledger 6867b09b).
  - Points stay on the member's page.
  - The order of the list doesn't change.
- **A chip for what is switched off stays as it was.** The visit line is under the name either way.
- **One read for the whole list.** It asks `appointments` for `member_id`, `starts_at` and `status`, with
  `member_id in (…)`, under `appointments_select_admin` / `admin_covers`. That is the rule the member's page already
  reads under, so there is no new function and no policy change.
- **Under the members, two rows** (Dot's drawing):
  - "Invite someone", which replaces the floating button;
  - "What you can see", which opens a bottom sheet holding today's words: `admin.seeing.title`,
    `join.privacy.admin.1–4` and `admin.seeing.told`.
  The paragraph at the foot of the page is gone.

## Changed after Will saw it (17 October, 15:12, card a93)

Will: "I don't like that you wrapped those items inside white background cards with shadow. There's no need for that.
… For 'Not marked' we'll just make it red."

- **No cards on the list.** Members are rows on the page background with a thin line under each, the way a list is
  drawn (Astryx: "Dense data = rows … never Card-wrapped list items"). Invite someone and What you can see are rows
  the same way, under the members, flush with the page (D-439). Rows keep 64px, the message button its 48px.
- **The unmarked visit is a line, not a chip.** "Not marked as there: Oct 15" (`caseload.visit.missed`), in red, the
  same size and place as "Marked as there". The red is the theme's `--color-error` (AA in light and dark) until Dot's
  token lands. The words say it on their own; the red only draws the eye, so it isn't colour alone.
  `caseload.visit.missed.chip` is no longer used (Lena removes it), and so neither are the chip's `detail` and
  `spoken`, which came out of `PersonRow`.
- **The What you can see sheet stays as it is** until Dot's standard drawer.

Read "those items" as all of them, members and the two rows, as Mira did: a white card left on the two rows alone
would be the same thing Will said there's no need for.

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
view of a member lists only upcoming and attended visits, so Home's red line is the first place a case manager sees an
unmarked one. That is inside the promise, and Mira knows.

## Later

- a94: when programs can book visits, `CaseloadVisit.bookedBy` carries the program's name for a visit a program
  booked that wasn't marked. Piper adds the column, and Dot draws the look.
