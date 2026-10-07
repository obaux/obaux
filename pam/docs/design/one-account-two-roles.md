# One account, two roles: member and program (D-374)

**Status:** answered and built, 7 October 2026 (D-375) — same city: yes;
booking their own program: no; the switch on Profile: agreed. Notifications
by role and the transparency lines are still to do. Decisions already made are marked **decided**; open questions are at
the end.

## What we're building

One person, one phone, one Pam account that can be both a **member** and
**program staff** (Will: "allow member and program only"), with a switch
between the two. Typical case: someone who came home, used Pam, and now
works at a program in the network.

- **Decided:** only member + program. Not case manager + member (a case
  manager supervises members), not super admin with anything.
- **Decided:** while someone is staff at a program, *that* program's lists
  don't show their member side ("create an extra rule hiding them from their
  own program's lists").

## The audit: where "role" is used today

Measured on a database built from every migration (0001–0077), not by
reading files, so superseded function versions don't count.

**Access rules (RLS): 94 policies, none read `role` directly.** The 23 that
depend on role all go through three helper functions: `my_role()`,
`is_admin()`, `is_super_admin()`. That's the good news — access control has
one front door.

**Database functions: 23 mention `role`.** Each one means one of two things:

| Meaning | Functions | Change |
| --- | --- | --- |
| **Acting as** — what you can do right now | `my_role`, `is_admin`, `is_super_admin` | None. They keep reading `profiles.role`, which becomes the *acting* role (below). |
| **Is** — what the person has been given, whatever they're acting as | `people_activity` (a program's members' activity), `can_message` (staff at an org), `award_points_for_save`, `award_points_for_finishing_setup`, `super_admin_ids`, `directory_people` (filter by role), `flag_service` (staff flags weigh differently) | Read the new `profile_roles` table instead. |
| **Shows a role** to someone else | `conversation_partners`, `messageable_people`, `directory_people`, `reports_for_review` | Show the role that fits the context: a program's conversation with them shows "member"; a colleague's shows "program". |
| **Creates or changes roles** | `redeem_invite`, `start_membership`, `review_staff_request`, `create_invite`, `request_staff_access`, `pending_invite_for_me`, `invite_preview`, `invites_log`, `request_invite_link`, `notify_on_staff_request` | Redeeming a program invite on a member account **adds** the program role, after a confirmation screen, instead of refusing. |

**App: 45 files read the session's role** (tab bars, Home, routes, labels).
They keep reading one role, the acting one; the session adds the list of
given roles for the switch.

## The design

### 1. Schema: keep `profiles.role` as the *acting* role

- New table `profile_roles (profile_id, role, org_id, region_id, granted_at,
  granted_by)`, one row per role given. A check allows at most
  `{member, provider}` together; every other role stands alone.
- `profiles.role` stays, now meaning **acting as**. A trigger keeps it equal
  to one of the account's `profile_roles`. It is already not writable by the
  app (`role` isn't in the column grant), so the only way to change it is…
- `switch_role(p_role)` — security definer; allows only a role in
  `profile_roles` for `auth.uid()`; writes an audit row.

Why this shape: the three helpers and all 94 policies keep working
unchanged, and every existing single-role account keeps exactly its behaviour
(one `profile_roles` row, acting as it). The risk is concentrated in the
seven "is" functions, which are few and testable.

### 2. Per-role place

A member's region comes from where they live; a program's comes from where
the program is. They can differ, so `region_id` (and the program's `org_id`)
move onto `profile_roles`, and `switch_role` copies them onto the profile.
Until then: v1 can require both roles to be in the same city, which avoids
the copy. **Open question 1.**

### 3. Hidden from their own program (decided)

Wherever a program lists people — who's coming in, members' activity
(`people_activity`), check-ins, messageable people — exclude anyone who
holds a `provider` role at that same `org_id`. One SQL predicate
(`not public.is_staff_at(p.id, org)`), used in each list, and tested list by
list.

Side effect to accept or block: if they book a visit at their own program,
the program won't see them coming. **Open question 2.**

### 4. Adding the second role

- Today (D-373): a member whose number gets a program invite lands on "This
  number is already in Pam" and is asked for another number.
- With this phase, that screen becomes **"Add Example Learning Center to your
  account?"**:
  - it says what changes ("you'll be able to switch between your own Pam and
    your program");
  - it says what stays private ("people at your program won't see your
    visits or activity as a member").
  Confirming redeems the invite as an added role. Declining keeps things as
  they are.
- Case manager invites to a member's number keep the D-373 screen, since that
  pair is not allowed.

### 5. The app

- **Session:** adds `roles: Role[]` beside `role` (the acting one).
- **Profile:** a "Use Pam as" row with *Me* / *[Program name]*, shown only
  when there are two roles. It reuses the super admin's view-as control.
  Switching calls `switch_role` and reloads Home.
- **Sign-in:** lands on the role used last.
- **Notifications:** each one is about one role, so it carries it. The bell
  shows the acting role's; the other role's count appears as a dot on the
  switch.
- **Texts:** consent stays per person. Each text already says which program
  it's from.

### 6. Promises to members (`transparency.ts`)

Two new lines, approved before this ships. The transparency tests will fail
until the contract changes, by design:

- To a member who is also staff: "People at the program where you work can't
  see your activity as a member."
- On What to expect for a program: "If someone who works with you also uses
  Pam as a member, you won't see their member activity."

## Tests (DB suite)

A new file covering a mixed account:

- Acting as member, it can't reach program-only data. Acting as program, it
  can, but only its own program's.
- `switch_role` refuses a role the account wasn't given; nobody can switch
  someone else.
- Their own program's lists leave them out, list by list; another program's
  lists include them.
- Points still come in as a member while acting as program.
- `can_message` still treats them as staff of their org, and as a member to
  everyone else.
- Redeeming a program invite on a member account adds the role; a case
  manager invite still refuses.
- Every existing single-role test passes unchanged, which shows the acting
  role reproduces today's behaviour.

## Order of work

1. Migration: `profile_roles` (backfilled from `profiles.role`),
   `switch_role`, the trigger, `is_staff_at`. DB tests first.
2. The seven "is" functions and the four display ones, each with tests.
3. Redeeming adds a role; the confirmation screen replaces the in-use page.
4. App: session roles, the "Use Pam as" switch, landing on the last role,
   notifications by role.
5. The transparency lines (Will approves wording), e2e, stories, flow map.

Roughly 2–3 sessions. The migration needs 0075, 0076 and 0077 live first.

## Open questions for Will

1. **Same city required for both roles in v1?** This is simpler: it avoids
   per-role regions. Recommend **yes** for v1.
2. **Can a staffer book a visit at their own program as a member?** If yes,
   their program won't see them coming (the hiding rule). Recommend
   **hide that program from their member side's booking**, so the case never
   arises.
3. **Where does the switch live?** Recommend the Profile row only, not a
   header control, so nobody switches by accident.
