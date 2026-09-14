# 2026-09-14 — Signing up, and the hole it found

**Phase:** 1 (member-facing) · **Sessions so far:** 8

Second log for the 14th. The first covered saving, points and the directory;
this one is sign-up, which was the last thing in Phase 1 that did not exist —
every account in PAM until now was made by the seeding script or by an invite
code, and somebody arriving at the front door without one was shown a sign-in
button that led back to where they started.

## The hole

Building sign-up meant writing the first code path where a browser creates a
profile. Reading the policies that would govern it:

```sql
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
```

`role` is an ordinary column on that table. So any signed-in account could run

```sql
update public.profiles set role = 'super_admin' where id = auth.uid();
```

and become the account that reads every account in PAM (0043), decides flagged
places (0033), and sees every caseload. Getting signed in requires a phone
number and nothing else. The same was true of `access_status` — a suspended
account could un-suspend itself — and of `region_id`, which is how an admin's
reach is scoped. `profiles_insert_self` had the same shape.

It was verified against the live database before it was fixed, by reading
`pg_policy` rather than by trusting the migration files. Nothing exploited it:
the only rows are seeded staff, and nothing in the product ever wrote those
columns from a browser. That is luck, not design.

**The fix is a column-level privilege, not a policy** (D-111). RLS decides which
*rows* a caller may touch and cannot say "this row, but not that column".
`revoke update (role)` can, and it holds for every future code path rather than
for the queries somebody remembered to guard. `security definer` functions run
as the owner and are unaffected, which is exactly right: role changes belong to
`redeem_invite`, to the admin RPCs that write `audit_log`, and to sign-up.

**The order matters, and the first version of the fix did not work.** A
table-wide UPDATE grant covers every column, and Postgres will not let a
column-level REVOKE carve a hole in one — the revoke succeeds, changes nothing,
and the promotion still works. The migration applied cleanly, the tests I had
written against it failed, and that is the only reason it was caught. The
table-wide grant goes first; what comes back is a named list of the fourteen
columns a person actually owns about themselves.

## What changed

**Sign-up exists**, at `/join/`, five steps with a bar across the top: phone,
name and city and which-one-fits-you, what others can see, text messages, and a
screen that counts the first points up. A member reaches home with 25 points and
the Returned badge already earned.

**The three sentences replace the word "role"** (Will, 14 September): "Someone
in need of support", "Someone willing to help", "Parole Officer or Case
Manager". A browser test asserts the word never appears on the screen, with word
boundaries — "Parole Officer" contains it, and that is not the jargon the rule
is about.

**The two staff answers create nothing.** They write a row in `staff_requests`
and the screen says somebody will call. Those roles read other people's
information, and a claim typed into a form is not a credential (D-112).

**A city PAM does not serve is a screen, not an error.** `start_membership`
raises P0002, and the screen says where PAM is, offers a text when it opens, and
records the city either way. The tick box is never pre-ticked, and a test
asserts that an untouched box sends `false` — that is the exact thing an A2P
audit looks for.

**The first points are real.** `POINTS_RULES.finish_setup` has said 25 points
since the config was written and nothing implemented it. 0047 does, as a trigger
on `onboarded_at`, once ever — the client writes the fact, the database decides
what it is worth.

**`served_cities()`** (0048) answers "where is PAM?" for somebody who has no
profile and therefore cannot read `regions` at all. Names only: an id is what
ties an account to a region.

**The phone card is one component now.** `/signin/` and step 1 of `/join/`
render the same `PhoneSignInCard`, including the consent sentence the carriers
reviewed. A second hand-written copy of that sentence is the thing most likely
to drift from the approved one.

**`StepHeader` is Astryx's ProgressBar**, not two nested boxes with a width and
a hand-written `role="progressbar"`. It also had `var(--astryx-color-accent,
currentColor)` doing its colouring, which is precisely the override
`apps/web/.claude/CLAUDE.md` forbids.

## What was wrong, and what missed it

**The lockdown's first version was decoration.** Covered above: a column REVOKE
under a table-wide grant is a no-op. Every migration lints clean; the tests are
what said so.

**Sign-in sent a new member to a screen offering them the door they had just
walked through.** `no-profile` — verified phone, no PAM record — was treated as
signed-out everywhere. It now routes into the flow.

**The flow lost track of who was signed in, silently.** `useSession` answers
`no-profile` for exactly the person sign-up is for, and does not re-ask after
step 2 creates a profile, so the last two steps had nobody to write for and did
nothing at all — no error, no notice, a button that looked broken. The id comes
from the sign-in system now, where it has been true since step 1. *A state
machine that reads its identity from a cache keyed on the thing it is about to
change will do nothing, politely.*

**The progress bar came out blue over green buttons.** Its fill does read
`--color-accent` — but the base theme re-points that token *inside* the
component: `.astryx-progressbar[data-variant="accent"] { --color-accent: <the
neutral status blue> }`. So the brand never reached it, and the theme's token
list was not where the answer lived. Third time this shape has cost a
screenshot, after the button hover states and the unthemed build: *the property
a theme sets is not always the property the component draws with — read the
generated CSS, not the token list.*

**A hidden label is still text.** The progress bar's accessible name repeated
the line above it, which is a stutter for a screen reader and a strict-mode
violation for a test. The eye gets the text, the bar carries the name.

## Decisions

D-111 (column privileges, not a policy), D-112 (a staff role is a claim),
D-113 (the flow is one route with a bar), D-114 (the first points are awarded by
the database).

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | clean, 5/5 |
| `pnpm --filter @pam/config test` | 202 tests; en/es parity at 465 keys |
| `pnpm --filter @pam/ui test` | 63 tests, axe clean |
| `pnpm --filter @pam/db test` | all checks pass, including 19 new ones on 0046–0048 |
| `pnpm --filter @pam/web test:a11y` | 354 browser tests across 3 viewports |
| `node scripts/check-bundle-budget.mjs` | 498.3 kB first load, animation 36.5 kB of its own 40 kB |
| `node scripts/journeys.mjs` | 140 screenshots, reviewed by eye in both themes |

Migrations applied live: 0046 (the lockdown, plus sign-up's tables and
functions), 0047 (points for finishing setup), 0048 (served cities). Supabase
advisors: no new warning classes — the three new functions appear in the
existing "signed-in users can execute a definer function" list, which is what
they are for.

## Left undone

- **The bundle has 1.7 kB of headroom**, down from 4.4. Sign-up pulled
  ProgressBar, CheckboxInput and RadioList into the shared chunk. The next
  component on a shared screen breaches §12; splitting the Astryx imports is
  now the next infrastructure task rather than a someday one.
- **Nothing reviews `staff_requests`.** The rows are written and a super admin
  can read them; there is no screen, and no notification fires. A person who
  says "somebody will call you" has to be told to look.
- **The five-tab member shell** is still unbuilt.
- **The journeys sheet is still laptop-only.**

## Needs a human

1. Twilio credentials into the Edge Function secrets, and somebody has to answer
   the reminders question — every row is `sms_enabled = false`.
2. **The dark-mode wordmark is coral while every button is now green.** Still
   open from yesterday.
3. **The transparency screen says nothing about the PAM team.** Members were
   promised they would be told first if what is visible changes, and the
   directory shows a super admin every account — name, role, region, status,
   last active; never messages or contact details. Proposed line, for
   `packages/config/transparency.ts` rather than for a screen: *"The PAM team
   can see your name, your city and the last day you used PAM. Never your
   messages."* It is a change to the contract, so it wants Will's word, not a
   commit.
4. **Who calls the people who ask to help?** Sign-up now collects program leads
   and case managers as requests. Somebody has to work that list, and the screen
   promises a day or two.
