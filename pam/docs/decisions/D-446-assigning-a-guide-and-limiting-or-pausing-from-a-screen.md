# D-446 — Assigning a guide, and limiting or pausing from a screen

**Date:** 2026-10-10 · **Branch:** `claude/pam-assign-and-limit`

Will, 9 October 2026, asking for the build: "Assign a case manager and limit or
pause a member. Until this exists, the limits feature and the notice I just shipped
never fire. A member with no assigned case manager is also seen by nobody." Shown a
plan with six open questions, on 10 October: **"You decide."** What follows is what
was decided, and why each answer is the narrower one. Any of them is Will's to
reverse.

## What was built

- **A case manager, on one of their members' page** (`/person/`), has two new rows:
  - **Limit or pause** (`/person/access/`): Everything / Limited / Paused, a
    required reason ("Only staff can read this"), Save, a confirm dialog that says
    what the member will meet, and a done state. It calls
    `admin_set_access_status`, which already existed (0008) and already required a
    reason and `admin_covers()`. Undo is the same screen ("Turn back on").
  - **Hand over to another case manager** (`/person/handover/`): the other case
    managers in their city, nothing chosen when it opens, a confirm dialog, then Home
    (they no longer see the member).
- **The super admin, on Everyone** (`/directory/`): each member's row says
  "Guide: {name}" or "No guide"; a new filter, **Members with no guide**; tapping a
  member opens **{name}'s guide** (`/directory/guide/`), where they choose a case
  manager, themselves, or "No guide".
- **Database** (two migrations, not applied):
  - `20261010034711_guides_are_assigned_and_handed_over_through_functions.sql`
    (expand): `assign_guide`, `hand_over_member`, `guides_i_can_choose`,
    `directory_guides`, and an internal `set_guide_internal` that ends the old row,
    starts the new one, and writes `audit_log` (`assignment.set`,
    `assignment.handed_over`, with `from` and `to`). Each function checks its caller
    inside and sets `search_path = public, extensions`.
  - `20261010034713_case_managers_no_longer_write_assignments_directly.sql`
    (contract): see "A gap closed" below.

## The six answers

1. **Can a case manager take on an unassigned member?** No. They would have to see
   people who are not on their list, which widens what a case manager sees and
   breaks the transparency contract ("Anyone who is not on their list"). The Pam
   team assigns, from **Members with no guide**.
2. **Can the Pam team limit or pause anyone?** No new power. The privacy policy says
   "Your guide can limit or pause an account"; a super admin who needs to can assign
   the person to themselves first, and is then that person's guide, which is what the
   policy says. `admin_set_access_status` is unchanged.
3. **Can the super admin see who guides whom?** Yes: it is how "unassigned" can be
   shown at all. `directory_guides()` returns member id, guide id and the guide's
   first name, to the super admin only. Members are not told anything new by this
   (the Pam team already sees every account on Everyone). This touches the open
   question in STATUS "What needs a human" row 10b (a line about the Pam team on the
   transparency screen); it does not answer it.
4. **Is the member told when their guide changes?** Not in this build. "Your guide"
   already means whoever is assigned, so every member-facing sentence stays true. A
   notification is the Messages & notifications lane's, and a new promise; left for
   Will (STATUS backlog).
5. **Can the member read the reason for a limit?** No; it stays in `audit_log` for
   staff, as before.
6. **"Fold into the next build, no separate action."** Could not be resolved from the
   record; still open, and asked again in the session log.

## A gap closed

`admin_assignments_admin` (0007) was a `for all` policy that checked only that a row
named the caller as the admin, and the table's grants were never revoked. So any case
manager could, through PostgREST, insert a row assigning themselves **any member who
had no guide** — or a program lead, or the super admin — with no audit row, or move
one of their rows to another member. Since 0082 that row is the whole of who reads a
member's profile, goals, points and badges and may limit or pause them. The contract
migration drops the policy, adds a select-only one, and revokes insert, update and
delete from `anon` and `authenticated`. Nothing in the app ever wrote that table from
the client (checked: no `from('admin_assignments')` write in `apps/web`), and the
functions that do (`redeem_invite` and the new ones) run as the
table owner, which bypasses row-level security on the live project (`postgres`,
`rolbypassrls = true`, read 10 October). So the contract step is safe to apply in
either order with the app. Found while planning, not by a test; the new test fails
without it.

## Rules kept

- **Only the member's own case manager** limits, pauses or hands over
  (`admin_covers`); a hand-over goes only to a case manager in the caller's city
  (`guides_i_can_choose`); a guide must hold the case manager or super admin role and
  not be paused; only a member can have a guide; the same guide twice writes nothing.
- **One primary action** per screen; the dialogs open on their question (D-411); an
  example person is never written, and the screen says so.
- **Words:** the screens quote the member's notice as it is on `main` ("Your guide
  turned this off… who to call", D-427). The staff screens use "guide" for the case
  manager a member is assigned to, as the member's screens do.
