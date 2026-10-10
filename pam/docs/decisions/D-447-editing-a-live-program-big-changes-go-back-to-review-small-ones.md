# D-447 — Editing a live program: big changes go back to review, small ones apply at once

**Date:** 2026-10-10 · **Branch:** `claude/places-programs-load-own-program`

**Decided by Will, 10 October 2026**, on the Places & programs session's
recommendation, while planning "load a program lead's own program"
(`docs/before-launch.md`, Programs). The record had nothing on edits after
approval: D-379 to D-386 cover only the first review.

## The rule

Once a program is live, what a lead edits depends on what it changes:

- **Changes who or where the program is — back to review.** Name, address and
  category (with its subcategory). The listing stays visible to members as it
  was until Pam approves the change; the lead sees "Your changes are being
  checked" (the same review wait as D-381).
- **Changes how to reach or understand it — applies at once.** Description,
  phone, website, and (when they exist) the program's services, hours and
  policies.

## Why

A member finds a program by its name, category and address, and travels to the
address. Those are what a bad or mistaken edit would send somebody to the wrong
place about, and what Pam checks the first time. A phone number or a sentence
of description is easy to correct and costs a member little if wrong, and
making a lead wait days to fix a number would push them to stop keeping it
current.

## What it asks of the build

- A change to a reviewed field on a live listing must not overwrite the live
  row. The live row keeps serving members; the pending change waits beside it.
  That needs a place to hold the pending change — the `program_submissions`
  table specified in `docs/design/program-review-queue.md` (part 5a of the
  plan), which is why this rule is built there, not in the first branch.
- Until that exists, a live program's reviewed fields are shown but not
  editable in the app.
- The database, not the screen, is the boundary: an `update` of those columns
  by a provider on a live row is refused.

## What a later session might reverse

The list of reviewed fields. If Pam's reviewers find phone or website edits
need checking too, move them across; the rule's shape does not change.
