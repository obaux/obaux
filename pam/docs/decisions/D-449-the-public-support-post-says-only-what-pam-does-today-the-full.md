# D-449 — The public support post says only what Pam does today; the full table is held behind live flags

**Date:** 2026-10-10 · **Branch:** `claude/compassionate-bohr-mzrchf`

**Decided by Will, 10 October 2026, through Mira (the CTO / merge desk):** "Go ahead
and decide, you're the CTO." Mira's answer to Wren's question: tone the "Case manager
assignments" post down to what is live today, nothing promised that members or staff
can't do yet, then READY.

## The rule

The public support site says only what Pam does today. When a post's subject is
partly built, it describes the built part and nothing else.

## What changed

- **"Case manager assignments"** now says: your case manager is the person who
  invited you or a staff member responsible for guiding you (and you may not have
  one if you joined another way); a case manager looks after their own members and
  only those (0082); a change to an account has a reason, kept in a log; what a
  limited or paused account can and can't do (the privacy policy and terms already
  say it, and the notice is built, D-427). Limiting is worded as **"we can turn off
  parts of Pam for an account that is hurting other people"** (the terms' own
  sentence), not as something a case manager does, because **no screen calls
  `admin_set_access_status`** (STATUS, "How a case manager limits or pauses
  someone").
- **Will's table is not deleted.** Every row of it is still in
  `apps/site/src/content/assignments.ts` with `live: false`; `AssignmentsTable`
  renders only the live rows. When the screens for taking on, handing over,
  unassigning, the Unassigned filter, limiting, pausing and turning back on ship,
  flip the flag and put the table back in the post under "Who can do what". The site
  test fails if the post names a held row.
- Search keywords and the search placeholder no longer mention "unassigned".

## Why

A public page is read by the people it describes. A promise a member or a staff member
can't use is worse than a gap, and the first version of this post was exactly that
(D-433 said so and held it back). Holding rows behind flags keeps the design work and
makes publishing each row a one-line change.

## What a later session might reverse

Whether "we can turn off parts of Pam" is clear enough, or should name who ("Pam's
team"). Whether to render the table as soon as one row is live, or only when several are.
