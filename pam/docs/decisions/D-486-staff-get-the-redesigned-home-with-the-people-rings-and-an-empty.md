# D-486 — Staff get the redesigned Home with the people rings, and an empty row that starts an invite (Will's answer on a22)

**Date:** 2026-10-10 · **Branch:** `claude/pam-design-staff-home-live`

Will, 10 October, on card a22: "Rebuild into the new home for staff, create an empty
state with faint circle slots and the first circle is a (+) to invite someone."

**Decided.**

1. A case manager and a program lead get the redesigned Home, with the people
   rings (D-198, D-477) in their own row. The old staff Home (`LegacyHome` and
   the `HomePeople*` / `SavedStrip` lazies) is deleted; `/admin/` is the invite
   page again. Members are unchanged.
2. With nobody on their list, the row is faint dashed circles with a (+) first.
   The (+) is a link named "Invite someone" (`profile.menu.invite`, so no new
   words), 44px or more, going to each role's existing invite flow: a case
   manager to `/invite/new/?role=member`, a program lead to `/invite/`. The
   faint circles are decoration (`aria-hidden`), nothing is announced per slot.
3. **Example people are not shown to an account that just signed up**
   (`isFreshAccount()`, D-361). The demo (`USE_DUMMY_PEOPLE`, D-172) otherwise
   fills any empty list with examples, which would have made the empty state
   unreachable. Other accounts keep the examples, as before.

**Why the fresh-account rule.** It is the smallest change that makes the empty
state real for the person it is for, without switching the demo off for Will's
review. `ExamplePeopleProvider` overrides it so stories can show either state.

**A later session might reverse:** the fresh-account rule, once `USE_DUMMY_PEOPLE`
is switched off (the rule then goes with it); and the program lead's (+) going
to the choice list rather than straight to a member invite.
