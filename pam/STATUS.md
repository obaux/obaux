# PAM — where the project stands

Last updated 2026-09-21. The member-facing product is real now: signing up
and signing out, invite codes for all four kinds of account, saving, points,
badges, reporting a place, and a screen for the person running PAM. Every place
now says what it is and has a screen of its own. Notifications are readable —
a place or a person's name, not just "something happened" — and follow you
around the app rather than living only on Home. A demo/dummy-data layer now
fills every people list and notification feed for a first look at PAM before
real data exists. Locale is now a real, switchable preference — a language
icon on sign-in, an onboarding step, and account settings all read and write
`profiles.preferred_language`. A place's own screen now returns to wherever it
was opened from (Home, Places, or Saved) instead of always to Places. The
header is now content-consistent across every signed-in screen — the same
compact role-preview icon, the same merged area/edit control, the same bell —
though it still reloads on navigation (D-134); Home's people preview for Case
manager/Program/Super admin previews is now a scrollable stories-style strip
rather than a stacked list. Sign-in is a full-bleed photo hero — real
commissioned illustrations, sourced via Google Drive after Figma's own asset
URLs proved unreachable from this sandbox (D-135) — with the card riding up
over its bottom edge, an eased custom transition between slides that holds
each one two seconds longer (D-141), and image preloading behind a skeleton
so a slow connection doesn't jump the layout (D-142). The sign-in screen no
longer carries the STOP/rates sentence — it moved to the reminders screen,
which already had it and is where a member is actually choosing something
(D-139) — and a signed-out visitor lands straight on sign-in instead of a
splash screen first (D-146). The shared alert banner is now a solid-colour,
single-row, in-flow composition instead of Astryx's own translucent `Banner`,
fixing both a readability complaint and an overlap with the header (D-143,
D-144, D-145).

**A pending case-manager or program-lead request is now decided for
real, not just recorded**: a super admin reviews it at `/requests/`
(reached from the Everyone list, not from the notification itself — D-148),
approving creates the account immediately with the phone already on file
(D-149). A denial now texts the person too, at Will's explicit instruction to
skip the usual quiet-hours/STOP safety check for this one message and include
PAM's number (D-152) — both the approval and denial texts are signed off and
live (Will, 17 September). Approving a program lead who left their program's
details at sign-up (a new step in `/join/`, manual entry only — D-154) adds
the program straight to the catalogue (D-153). A super admin can grant any
account a demo view from the Everyone list, showing PAM's existing example
data everywhere that account looks rather than only when its own data
happens to be empty — wired into five of the screens that already had an
example-data fallback, not yet all of them (D-155). All of it — migrations
0054 through 0059 — is live on the real database (D-156). **PAM can text for
real now** (D-158): Twilio credentials are in place and proved with an actual
message sent end-to-end. Session log:
`docs/sessions/2026-09-17-everyone-list-and-program-requests.md`.

**There is now a first chat/messaging surface, staff-to-member, too**:
a case manager can message their caseload, a program admin can message
members enrolled in their program, and a member can see and reply within a
conversation staff already started — never member-to-member. `/messages/`
lists conversations plus, for staff, anyone eligible they haven't messaged
yet; `/messages/thread/` reads and sends within one. A first version of this
(17 September, same day) wrongly scoped it to member-to-member "connections"
and was corrected on Will's direction before anyone used it — see D-163,
superseding D-159/160/161. D-074's supervised-chat model still holds for
anyone *not* in a conversation (a case manager reads it only if it's
reported), and now explicitly covers the case of a case manager who *is* a
participant too — §4.1's transparency contract was widened to say so
(D-164). **A conversation partner reads a name and a role, nothing else** —
D-164's own first version handed back a whole `profiles` row, including
`last_active_at` and `phone`, to any conversation partner; replaced same day
with a column-limited function following 0043's `directory_people`
precedent (D-165), so a program admin (or anyone) never sees activity info
through this path. **"Program admins don't see activity, across the entire
app" is now a real, closed guarantee, not just a messaging-surface one**
(D-166, Will's confirmation and widening of D-165's closing note): the
older, pre-existing `profiles_select_provider_linked` policy — which let a
program admin read a member's `last_active_at` and `phone` through any
enrollment/appointment link, no conversation required — is gone, replaced
by `provider_linked_members()` (0062), the same column-limited-function
pattern. Case managers are unaffected throughout; this is provider-role-specific.
The §4.1 transparency screen was re-audited line by line, not just amended
again (D-167): it now says the program-activity guarantee plainly and
positively, and a stale, never-actually-true `canSee.chatMetadata` line
(predating all three of today's messaging sessions) was found and removed.
Who may *start* a conversation is still a client-side restraint, not a
database one — see D-163 for the gap and the migration that would close it.
**All of it is now actually verified, not just written**: `admin_visibility.test.ts`,
the test `transparency.ts` had claimed enforces this contract but which did
not exist (D-164), is built (`04_transparency_contract_test.sql`, D-168) —
and this sandbox turned out not to be permanently missing `postgis` after
all; installing it let `pnpm --filter @pam/db test` run for real against
every migration through `0062`. **221 checks pass, 0 failures.** `0060`,
`0061` and `0062` are all recorded as deployed to the live Supabase project
(`0060`'s policy was superseded by `0061` in the same deploy, the same way
it now is locally) and `get_advisors` came back clean. Deploying surfaced
real drift between this repo and the live schema — unrelated to messaging,
not caused by or fixed in that session — see the drift note under "What is
live" and D-169; `pam/CLAUDE.md` gained a "Working alongside another PAM
session" section as a direct result. Session log:
`docs/sessions/2026-09-17-deploy-and-concurrency-rules.md`.

**Both of the above were built by two concurrent PAM sessions working the
same day without knowing about each other**, which collided on the same
migration numbers (`0054`–`0056`) and the same decision numbers (D-148
through D-158) — reconciled by a merge that renumbered the messaging
session's migrations to `0060`–`0062` and its decisions to D-159–D-169,
in place, with every cross-reference updated to match (D-170). Newest
session log: `docs/sessions/2026-09-17-reconciling-a-concurrent-merge.md`.

**Messaging is previewable again, a super admin can demo-send a message, and
a caseload row now names a member's real program.** `/messages/`'s Home tile
and the screen itself had been gated on the real signed-in role only
(D-171), which meant they never appeared during any "Viewing as" preview —
inconsistent with `/admin/`, `/directory/` and `/interested/`, and flagged as
a bug (Will, 17 September). Now gated on the previewed role, matching those
three; real conversations and real "who can I message" data still only ever
run under the true, signed-in account's own permissions, never a previewed
one, and a preview's real gap is filled with non-interactive example
conversations (D-172). A super admin previewing a case manager or program
admin can also compose a message on `/person/` that visibly "arrives" on
`/messages/`'s example conversations once the preview switches to Member —
entirely client-side, sessionStorage only, never touching `messages` or
`conversations`, and explicitly not a reopening of D-171 (D-173). Home's own
greeting now reads an example name while a preview is active, reusing
`/account/`'s existing `DUMMY_SELF` substitution (D-174). Separately, a case
manager's caseload row now shows a clickable badge naming the program a
member is genuinely enrolled in (never a region-only match), opening that
program's own `/place/` screen — real data via existing RLS, no new
migration, plus a demo version on `/person/` (D-175). Session log:
`docs/sessions/2026-09-17-messaging-preview-and-demo-send.md`. One
verification gap: the Playwright a11y suite could not run in this sandbox —
`chromium_headless_shell` could not be downloaded (the agent proxy blocks
`cdn.playwright.dev`, not a missing-package problem) — so this session's UI
has not been checked against the 426-pass baseline in "What is proven"
below; a future session with a working browser download path should run it.

**The messenger is finished as a product surface (20 September, branch
`claude/pam-messenger`, D-176 through D-182).** The thread is drawn with
Astryx's Chat family, loaded only on that route; a member can start a
conversation with their own case manager or program, and staff with their
own people — and **who may message whom is a database rule now**
(`0063`: `open_direct_conversation()` is the only door, the direct insert
policies are gone, a super admin is refused there too). A message can be
reported from the thread with a fixed-list reason, and `/reports/` lists
what was reported to exactly D-074's audience — every super admin, plus
the case manager assigned to the sender or the reporter (`0065`, which
also narrows a policy that had let every case manager in every region read
every report). A new message lights the recipient's bell and the Home tile
shows an unread count; nothing about messages ever queues a text (`0064`).
**`0063`–`0065` are deployed** (Will, 20 September: merged to `main` and
applied to the live project after a `list_migrations` check; `get_advisors`
clean — `can_message()`/`notify_on_message()` are not callable by any role,
the four new RPCs by `authenticated` only).
Example conversations are one mirrored cast, and every example name — a
conversation row, a start row, "Message {name}" on `/person/` — opens the
example chat (D-183). DB suite: 272 checks pass. Session log:
`docs/sessions/2026-09-20-messenger.md`.

**21 September (branch `claude/pam-messenger-2`, D-184–D-189):** Messages
is rows, not cards; "New message" is one button that opens a picker with a
search box; a member sees "Case manager" or the program's name under a
name, staff see nothing under a member's. Reported messages moved into a
Reported section of Messages (case manager: beside Conversations; super
admin: Reported only), with an example set, and the `/reports/` screen and
Home tile are gone. Bell rows link to what they name. Places has a search
box (typo-tolerant, answered by `services_search`, `0066`) and a Reported
chip for reviewers with the decision on the card (`flagged_services`,
`0066`) — no reviewer screen for flags existed before. **`0066` is local
only — not deployed.** DB suite: 286 checks pass. Session log:
`docs/sessions/2026-09-21-messages-tidied-and-places-search.md`.

This is the handover document: what exists, what is proven, what is live, and
what the next person needs to know before touching anything.

**It is the only document that is always current.** `docs/sessions/` is the
history — one immutable log per build session, saying what changed and what the
session got wrong. `DECISIONS.md` is the reasoning behind each choice.
`CHANGELOG.md` is the user-visible record.

Start a session by reading this file and the newest session log. End one by
writing a new session log and updating this file. `CLAUDE.md` states the rule.

---

## In one paragraph

PAM connects people to people at services and facilities — for mentorship,
earning and learning. It serves returning citizens, the providers who run
programs, and the case managers who invite them in and introduce them to each
other. **Phase 0 (Foundation) is complete.** The data model, its access rules,
the design system, the shared product rules, and CI all exist and are verified.
No member-facing flow is built yet: that is Phase 1.

Every decision was measured against one question, from the SOP: *can a person
who hasn't used a phone in 8 years enroll in a program, get to it, and keep
going — without help?*

---

## What is live

**Supabase project `pam`** — `shobqzuhicoiymtumiaz`, us-east-1 (closest region to
Philadelphia). The database is real and reachable. **The web app is deployed
on Vercel** (project `web`, auto-deploys from `main`):
https://web-will-3199s-projects.vercel.app — production is `main` at `c0a6334`
as of 20 September.

**The "six unknown live migrations" this repo could not explain are now
explained: they were the other concurrent PAM session's own committed
work**, merged into this branch as `0054`–`0059` (`staff_review`,
`staff_denied_sms`, `program_submission`, `demo_view`,
`lock_notify_on_staff_request`, `staff_requests_indexes`) — see D-170 for
the merge that reconciled two independently-numbered sessions' migrations
and decisions in one pass. This session's own three messaging-privacy
migrations were renamed `0060`–`0062` to make room and are also deployed
and verified via `get_advisors` (clean); the live project still records
them under their original deploy-time names (`0054_conversation_partner_visibility`
etc. — a cosmetic mismatch, not a functional one, since Supabase tracks
migrations by timestamp, not the filename's number prefix — see D-169's
addendum).

**The `0052` gap is closed.** `0052_saved_places_say_what_they_are.sql` sat
committed but undeployed from 16 to 20 September — a genuine local-vs-live
gap, not a numbering collision. Applied on 20 September together with
`0063`–`0065`, after a `list_migrations` check found no new live-only drift.
As of that check, every file in `packages/db/migrations/` is on the live
project (this session's `0060`–`0062` under their deploy-time names — D-169
addendum). Keep running the check before any deploy; it is what found the
gap in the first place.

**The text-message dispatcher is live, running, and sending for real (17
September).** The `dispatch-sms` function is deployed and a database schedule
calls it every five minutes. Twilio credentials are in place and proved with a
real end-to-end test: a signed-off template queued to Will's own number came
back `status: sent`, no failure reason, picked up by the very next scheduled
run. Quiet hours, the STOP list and atomic claiming are enforced in the
database, not in the function. All sixteen templates in the catalogue are now
signed off — the original thirteen (13 September) plus the two built this
week, `staff_request_approved` and `staff_request_denied` (17 September) —
so nothing is currently held back at the `reviewedBy` gate; the next template
anyone adds still starts blank and stays refused until it is read. See
`docs/sms-setup.md`.

**Sign-in and sign-up work, and sign-out exists.** Supabase is pointed at
Twilio, and a real code reached a real phone on 13 September; a real member
signed themselves up on the 14th. One door for every role: what you see after
the code comes from the account, never from which link you followed. Every
signed-in screen carries the same button to `/account/`, which is the way out.

**How each kind of account gets in** (0049): a member signs up alone or with a
case manager's code; a program lead asks at sign-up and gets a code; a case
manager gets a code only a super admin can make, from the people screen, into a
named city; a super admin is made by the seeding script and nothing else.

**The Twilio account is still in trial.** Only numbers verified by hand in the
Twilio console receive a code. A tester with an unverified number sees "we
sent you a code" and nothing arrives — which is what the logs show happened on
the 14th.

**The carrier campaign was APPROVED on 13 September.** Two rejections got there:
the first submission declared no embedded links, which nine of the thirteen
messages carry; the second was rejected for implied consent (30925), which was
right — PAM now asks on a screen of its own, with nothing pre-selected, and the
agreement is the button's own words (D-085, D-086).

~~What was left before a real text sends~~ — **done, 17 September**: Twilio
credentials are in the `dispatch-sms` Edge Function secrets (the Messaging
Service SID, not a bare from-number, so the A2P approval carries through) and
proved with a real message. What is still open, neither of them a blocker on
sending in general:

1. Reminder-type texts specifically are opt-in per account (`sms_enabled =
   false` by default, 0042) — nothing about Twilio being configured changes
   that. Somebody still has to say yes on the reminders screen before PAM
   texts them one, including Will's own account.
2. The HELP auto-reply on the Messaging Service, matching what was filed with
   the carrier, is not yet confirmed set up.

The account is still in trial: only numbers verified by hand in the Twilio
console can receive a text. Setup and the known traps are in
`docs/sms-setup.md`; what was filed is in `docs/sms-campaign-samples.md`.

**The first admin exists** — Will, Philadelphia, created 12 September and proven
by generating a live invite code (`9T3YTVMT`, valid 30 days).

To create further admins from a machine with the service role key:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  pnpm --filter @pam/db seed:admin -- \
    --phone +1XXXXXXXXXX --name <first name> --region Philadelphia
```

**Pilot city: Philadelphia.** Region seeded, centred on City Hall.

---

## What is built

| Package | What it holds | State |
|---|---|---|
| `packages/config` | The product's rules as code: the three fixed categories and their subcategories, SMS templates with the §9 safety gates, the §4.1 transparency contract, points/levels/badges, the §0 dignity-language checks, en + es bundles | Complete for Phase 0 |
| `packages/db` | 13 migrations: full §4 model, RLS on every table, the admin layer, server-side RPCs, `app_settings`, the Philadelphia seed | Complete and deployed |
| `packages/ui` | The §2.4 components — `BigButton`, `PlaceCard`, `PersonCard`, `StepHeader`, `PointsBadge`, `HelpBar`, `VoiceInput` — plus the shared shell the screens stopped retyping: `Page`, `AppHeader`, `TextField`, `TextLink`, `Notice`, `NotificationBell`, `NotificationList`, `NavTile`, `OnboardingSlides`, `Loading`, the icon set and PAM's own tokens | Complete for Phase 0 |
| `apps/web` | Next.js 15 + React 19, static export, Astryx themed and working, i18n, PWA manifest, Supabase client, runtime support-phone lookup, staff-to-member messaging (`/messages/`, `/messages/thread/`) | Foundation, plus the first chat surface — see gaps |
| `apps/native` | Capacitor 6 config wrapping the web export; native speech recogniser wired to `VoiceInput` | Config only, never built for a device |

---

## What is proven, and how

Numbers here are from the last run, not aspirations.

| Check | Result | What it actually proves |
|---|---|---|
| Typecheck | 5/5 packages | — |
| `@pam/config` tests | 202 pass | No SMS can send unreviewed, over 160 chars, with emoji, or with a term that reveals justice involvement. Locales are key-for-key. The transparency screen matches its contract. |
| `@pam/ui` tests | 66 pass | Every component is axe-clean. `PlaceCard` offers exactly three actions in a fixed order. Reduced motion is respected. The mic hides when unsupported. |
| Database suite | 286 checks pass | See below. Grew from 152 across today's messaging sessions (to 221 — `0061`/`0062`'s own coverage plus `04_transparency_contract_test.sql`, D-168) and then to 235 once merged with the other concurrent session's own `staff_review`/`demo_view` coverage (D-170) — the combined migration set (`0001`–`0062`) run together for the first time, not each session's own subset in isolation |
| Live RLS fingerprint | **not re-verified since `0060`–`0062` deployed** | This row's last "identical to local" claim predates today. `0060`–`0062` (deployed under their original names, `0054`–`0056`) are now live and `get_advisors` came back clean, but the fingerprint comparison itself hasn't been re-run against the combined migration set — this repo and the other concurrent session's are now merged, but neither has been re-fingerprinted since (see D-169/D-170, and the drift note under "What is live") |
| Live anonymous attack | 0 rows leaked | A signed-out caller reads no profiles, messages, invites or audit rows on the real database, while still reaching the support number and the public catalogue |
| Browser a11y + theme (Playwright, full suite) | **471 pass** (20 September; `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` — the sandbox's own Chromium, no download needed) | No WCAG AA violations at 320px or iPhone SE. Every control clears 48px. No horizontal scroll. The Astryx theme really resolves. Runs in dark mode as well as light. Includes the new `e2e/messages.spec.ts` (thread, example thread, report, `/reports/`). The 17th's `admin.spec.ts` failures from D-175's unstubbed `enrollments` query are fixed in the spec. |
| First-load JS | 504.8 kB of 500 kB — **4.8 kB over budget**, disclosed and unresolved | §12 budget, measured gzipped on what `index.html` actually loads; `/signin` and `/gallery` carry `OnboardingSlides`' `framer-motion` weight on their own subpath export (D-140), every other route unaffected. Grew from 500.7 kB across the messaging sessions alone (1.0 kB, D-162), entirely new locale strings — irreducible without lazy-loading translations per route, which is out of scope. Grew a further 2.3 kB when merged with the other concurrent session's own additions (D-170). Grew 0.3 kB on the 17th (D-174), **and 1.0 kB on 20 September** (the messenger's locale strings and `Badge` in `NavTile`; `useConversations` and the whole Chat family were kept out of Home's first load — D-181, D-182) — the messaging-preview/demo-send/program-badge session's other additions (D-172, D-173, D-175) all landed off Home's own bundle and did not move this number, though D-175's `Token` component does add real weight to `/admin/`, `/person/` and `/directory/` individually (~4 kB each), not tracked by this check |

### The database suite is the one that matters

`pnpm --filter @pam/db test` stands up a throwaway Postgres, applies a shim for
the parts of Supabase the migrations need, runs every migration, then attacks the
result with one test user per role. It proves:

- members reach only their own rows
- `is_public = false` hides a member from all discovery; blocks are mutual
- an admin reaches their caseload and region, and **no other region**
- **an admin cannot read message bodies or buddy-feed posts** — the promise
  members are shown at onboarding
- providers reach a member only through an enrollment, appointment or connection
- `points_ledger` and `audit_log` reject UPDATE and DELETE *even from
  `service_role`*, which bypasses RLS
- a disabled feature is refused server-side, not merely hidden
- invite codes carry no ambiguous glyphs, are admin-only, region-scoped,
  single-use, and honour a phone prefill
- a signed-out visitor can still reach the support number and the catalogue

---

## What is deliberately not done

Phase 0 owns foundations. These are Phase 1–7 and their absence is not an
oversight:

- **No map, no enrollment.** Sign-up exists — `/join/`, five steps — and an
  invite code is typed into its second step, or arrives as `/join/?code=`.
- **Chat is a messenger now (20 September, D-176–D-182).** Both directions
  within a real relationship, enforced by `0063`; report from the thread;
  `/reports/` for review; unread on the tile and the bell. What is still
  not built: resolving a report (columns exist, no function), group or
  broadcast, member ↔ member (by design, forever), SMS for messages (by
  design). The paragraph below is the 17th's history of how it got here.
- **Chat exists now, staff-to-member.** `/messages/` and `/messages/thread/`
  (17 September, corrected same day — D-163) work against a case manager's
  real caseload (`admin_covers()`, the same relationship `/admin/` already
  uses) and a program admin's real enrolled members (`provider_linked_to()`),
  and against real conversations either has already started with a member. A
  member sees and replies but never starts one. Scoping who may *start* a
  conversation is a client-side choice today, not a database-enforced one —
  see D-163 for exactly what a follow-up migration should check. A member
  reading a staff person's name in a conversation needed a new `profiles`
  read policy, and a widened §4.1 transparency contract (D-164), because a
  case manager who is a real conversation participant reads more than the
  contract previously disclosed. That first read policy (0060) handed back
  the whole `profiles` row — `last_active_at`, `phone`, everything — to any
  conversation partner of any role; replaced same day (0061,
  `conversation_partners()`, D-165) with a two-column function so nobody,
  including a program admin, sees activity info through this path.
  **Closed app-wide, same day (0062, D-166)**: the older, pre-existing
  `profiles_select_provider_linked` policy — which let a program admin read
  a member's `last_active_at` and `phone` through any
  enrollment/appointment link, no conversation required — is gone too,
  replaced by `provider_linked_members()` (id, first name only). "Program
  admins don't see activity, across the entire app" is now true, not just
  true of messaging. Case managers are unaffected. The transparency screen
  was re-audited line by line (D-167) rather than amended piecemeal a
  fourth time. `admin_visibility.test.ts` — the test that comment claimed
  enforces the contract but did not exist — is now built and passing
  (`04_transparency_contract_test.sql`, D-168), part of the 221-check
  database suite that ran for real once this sandbox got `postgis`.
- **`staff_requests` is now reviewed, for real (17 September, D-148/D-149).**
  A pending claim notifies every super admin (a plain alert, not a clickable
  one — D-148) and is decided on a new screen, `/requests/`, linked from the
  Everyone list: approve creates the real account immediately, phone pulled
  from `auth.users`; deny records the decision and creates nothing. Both the
  approval and denial SMS are signed off and live (Will, 17 September) — the
  denial text skips the usual quiet-hours/STOP check by explicit instruction
  (D-150, D-152), a deliberate exception, not a general precedent.
- **What does exist and works:** sign-up, sign-in, home, saved places, points
  and badges, the places list, a screen per place at `/place/?id=…`, reporting
  a place, the notifications list, the
  reminders question, the case manager screen, the people directory, deciding
  a staff request, and the privacy and terms pages.
- **Home is a menu, and only a menu.** It lists where to go and what is waiting.
  No next step, no points, no plan: PAM has no real ones yet, and a home screen
  that invents its own content is worse than a short one (D-098). `/gallery/` is
  the workbench where every component is rendered in the states nobody can
  navigate to.
- **Notices exist but are not wired to real failures.** Every condition has
  plain-language copy and a component (D-035), and the demo renders three of
  them. Connecting them to actual query results is Phase 1.
- **The §12 budget has 0.4 kB left** — 499.6 kB gz against a 500 kB ceiling,
  plus a 36.5 kB animation chunk against its separate 40 kB one. The place
  screen fitted only because the lazy imports stopped going through package
  barrels: `import('@pam/ui')` pulls every component in the library, so a
  "lazy" chunk contained the whole thing and webpack hoisted the shared parts
  back into the first load (D-125). Packages now declare subpath exports, and
  `@pam/config/hours` is deliberately absent from that package's barrel. The
  next component on a shared screen still breaches the budget.
- **No five-tab member shell.** `AppShell` + `TabList` is the first UI task of
  Phase 1. The layout is settled and the pieces are ready: Help is now a compact
  item sized to share the bottom bar rather than a full-width row (D-039), and
  the five navigation icons exist. Only the dock itself is unbuilt.
- **Partial import, now described.** **754 active places** live in `services`
  — DBHIDS providers plus the city's recreation and facility feeds and twelve
  hand-added places. As of 0050 every one carries a `description_plain` of at
  most 200 characters, 230 carry a website, and 361 are marked with who may
  walk in. None is hidden for review. City Facilities (3,197 features) is
  verified and active but not yet fetched. Endpoints were confirmed through `pg_net` from the database, since the
  build sandbox blocks all external egress (D-030).
- **Opening hours are a stand-in, and the screen says so.** The Google Maps key
  is in Supabase Edge Function secrets, but `enrich-places` is not written —
  deferred by Will until nearer kick-off. Until then `USE_PLACEHOLDER_HOURS` in
  `@pam/config/hours` makes cards show open or closed from a deterministic
  stand-in, and the place screen prints "These are sample hours while PAM checks
  the real ones. Call before you go." Flipping that one boolean is the whole
  swap (D-122). Real phone numbers are still thin: 12 of 754.
- **The SMS copy is signed off** (13 September, Will) and the dispatcher is
  deployed with it. The only thing still stopping a real text is the Twilio
  credentials in the function's secrets — and, beyond that, the carrier
  registration. Blank `reviewedBy` still stops everything, and a new template
  starts blank.
- **Notifications have a screen of their own** at `/notifications/`, reached
  from a bell that is now on every signed-in screen (16 September) — it used
  to exist only on Home, the case manager screen and the directory, so
  leaving Home for anywhere else lost the way back to a flagged place. A row
  says the place or the person's name, not just that something happened, and
  is a log line rather than a button: nothing here is clicked, and nothing is
  marked read one at a time — the whole list is marked seen the moment it is
  opened, which is what clears the bell for next time.
- **A super admin's "Viewing as" preview now follows them off Home.** It used
  to be read only by the Home screen, so a super admin who picked "Program"
  there and then opened Places, Saved, the case manager screen or the
  directory fell straight back to their own role — the header said one thing
  and the next screen said another. Every screen that gates on role now reads
  the same stored preview, and the redundant sentence under the switcher
  ("This is what a Program sees...") is gone — the switcher's own chip
  ("Viewing as Program") already says it, in the header, on every screen.
- **No device build.** Capacitor is configured; `cap add ios/android` has never
  been run.
- **The top bar is content-consistent, not yet architecturally persistent.**
  Every signed-in screen now renders the same role-preview control, area
  chip, and bell (16 September), but each navigation is still a full page
  reload — Will chose the fuller "client-side routing everywhere" option over
  this lighter fix (D-134) and it has not been built.
- **Sharing a place with a case manager's people is not built.** Will chose a
  fully persisted version (real table, RLS, a notification to the recipient)
  over a UI-only stand-in (D-134); nothing exists yet — no migration, no UI.

---

## Five bugs worth remembering

Each of these passed a build, and most passed the tests too. They are recorded
because the *class* will recur.

**Reminders would have silently failed to send.** The Spanish 24-hour reminder
renders at 159 of 160 characters with a 31-character address. Any longer address
pushed it over, `renderSms` threw, and the reminder never went. Templates now
budget each variable and shorten at a word boundary. *A safety gate that throws
at send time is a feature that doesn't happen.*

**The design system was never applied.** All three Astryx stylesheets loaded with
200s and every component rendered unthemed, because Astryx applies its theme from
React via `<Theme>`. The build passed, axe passed, the unit tests passed on
accessible names. Only a screenshot showed it. *Some classes of wrong are
invisible to every check that isn't an eye.*

**`member_points(<any member>)` leaked every member's points.** The RLS was
correct; the leak was around it. PostgREST exposes every `public` function at
`/rest/v1/rpc/<name>`, so a `SECURITY DEFINER` helper taking a caller-supplied id
could be called with someone else's. *Row-level security does not cover the RPC
surface. Supabase's advisors caught this; the local suite could not.*

**Revoking a grant broke the signed-out catalogue.** The fix for the above —
revoking `EXECUTE` from `anon` — made a public read fail with "permission denied
for function", because a policy declared `for all` is evaluated on SELECT too.
Reading `services` evaluated the *provider's write policy*. A member not signed
in could not see the places that can help. *The guard inside the function was
always the boundary; the grant never was.*

---

**A message was marked sent that was never sent.** The dispatcher claims a
message as sent, then reports back if it fails. Reporting a failure called a
database function that returns nothing, and asking an empty answer for JSON
throws — so the report died and the row stayed marked sent. Every unit test
passed; none of them could see it, because they all tested rendering, which is
pure. What caught it was running the deployed function against the live database
with one real queued row. *The refusal path is the path that runs in production
while the copy is unsigned, so it earned the first live test, not the last.*

---

## What needs a human

| # | Needs | Blocks | Note |
|---|---|---|---|
| 1 | ~~Create the first admin~~ **Done** | — | Will, Philadelphia, created 12 Sept and verified by generating a live invite code. Sign-in still needs an SMS provider configured in Supabase — see row 9. |
| 2 | **Review the SMS copy** and record a name in `reviewedBy` | Phase 2 | Nothing can text a member until someone signs off against §9. **A review sheet is prepared and waiting**: all twelve messages rendered as lock-screen notifications in both languages, with the two open questions — https://claude.ai/code/artifact/f1dfb8d4-f64d-47c4-97d3-6a67f4c0eb09 |
| 3 | **Get the PA 211 export URL** from the 211 contact | 211 data only | Licence cleared and the host reachable, but it serves a consumer search UI rather than a feed. Philadelphia's own datasets are verified and active. |
| 4 | ~~A Google Places API key~~ **Done — but `enrich-places` is not written** | Real hours and phone numbers | Will added the key to Supabase Edge Function secrets on 16 September, and deferred building `enrich-places` until nearer kick-off. Until it runs, `place_id` is null on every imported row, hours are the stand-in described above, and only 12 of 754 places have a phone. |
| 5 | ~~Brand colours and logo~~ **Logo done** | Phase 6 | Category pins use Astryx palette defaults chosen for hue separation at AAA contrast. |
| 6 | Whether points redeem for real rewards | Phase 3 | Built behind a flag, shipped off. |
| 7 | Retention: missed-appointment history beyond 90 days | Phase 5 | No purge job. Keeping this data indefinitely is the wrong default for this population. |
| 8 | Pilot partner orgs and usability test scheduling | Phase 7 | Five members, three providers, two admins. |
| 9 | ~~Point Supabase at Twilio~~ **Done** | — | Verified on 14 September from the auth logs: a real code, a real `user_signedup` with `provider: phone`, and a member profile a minute later. This row read "the single thing blocking the product" until 16 September, when the logs said otherwise. |
| 10a | ~~Who calls the people who ask to help?~~ **Done** | — | Resolved by the other concurrent session's `/requests/` screen (D-148/D-149): a super admin is notified when a claim arrives and reviews it there, approving or denying for real. Sign-up still collects the request in `staff_requests`; it is now worked, not just recorded. |
| 9b | ~~754 places, and not one of them says what it is~~ **Done** | — | 0050, 16 September: all 754 carry a description of at most 200 characters, written from the city's own `service_type` / `park_name` / `asset_name` fields or, for the twelve hand-added places, from published sources. 230 have a website and 361 are marked `audience`. Verified live: 754 active, 754 described, 0 hidden for review, longest 152 characters. This reversed the screen half of 0017 and needed Will's word — see A11 and D-121. The words are sourced, not invented, but **no provider has read their own entry yet.** |
| 10c | **Confirm the Twilio account's state** | Anybody whose number is not verified | This row said the account was in trial. Will, 16 September: the Twilio console says it is active. That earlier claim came from a 13–14 September finding and was repeated afterwards without re-checking; this session did not verify it either way, so it stands as Will's word and unverified here. If it is active the trial concern is gone; if not, a code to an unverified number is not sent and nothing says so — the live logs on the 14th show one phone asking three times. Carrier registration is a separate question (row 10). |
| 10b | **A line about the PAM team on the transparency screen** | A promise already made | Members were told they would hear first if what is visible changes, and the directory now shows a super admin every account (name, role, region, status, last active; never messages or contact details). Proposed, for `packages/config/transparency.ts`: *"The PAM team can see your name, your city and the last day you used PAM. Never your messages."* It is a change to the contract, so it wants Will's word. |
| 10 | ~~Twilio credentials into the dispatcher's secrets~~ **Done** | — | Will, 17 September. Confirmed with a real end-to-end test: a `staff_request_denied` text queued to Will's own number was picked up by the 5-minute dispatcher cycle and sent successfully (`status: sent`, no failure reason). PAM can now text for real. |
| 11 | ~~Sign off `staff_request_approved`'s wording~~ **Done** | — | Will, 17 September. `pnpm --filter @pam/config test` is green. |
| 12 | ~~Migrations 0054 through 0057 are local only~~ **Done** | — | Applied to the live Supabase project 17 September, along with two follow-ups `get_advisors` surfaced: `notify_on_staff_request` (0058) was callable directly via PostgREST, unlike its two siblings in 0038 — its own migration run never got the schema-level default-privileges lockdown 0038's did; and `staff_requests` had two foreign keys with no covering index (0059). `/requests/`, `/join/`'s program step, and the demo view all work against the real database now. |
| 13 | ~~Sign off `staff_request_denied`'s wording too~~ **Done** | — | Will, 17 September. Still sent with quiet-hours/STOP enforcement deliberately skipped, at Will's own instruction (D-152) — that was never what this row was about. |
| 14 | **The demo view is not wired into every screen yet** | An account granted it still sees real data on `place`, `person`, `HomePeoplePreview`, and the saved-places dummy path | The mechanism (`useDemoView`) is built and proven on five screens (D-155); finishing the rest is the same pattern repeated, not new design. |
| 15 | ~~Confirm client-side caseload/enrollment scoping in `/messages/` is an acceptable interim state (D-163)~~ **Closed at the database layer (0063, D-176)** | Staff-to-member messaging | RLS lets a client create a conversation with any profile id; only `useMessageableMembers`'s own restraint (a case manager's real caseload, a program admin's real enrolled members) keeps this screen scoped to real relationships. A follow-up migration should enforce it at the database layer — see D-163 for exactly what to check. Shipped now, conservatively, rather than blocked on that migration; flagged for Will's word on whether that trade is right, given it now involves staff accounts with real caseload access rather than peers. |
| 16 | ~~Wire `report_message()` (0034) to a UI action in the thread view~~ **Done (D-177), plus `/reports/` (D-178)** | Member safety | The RPC is complete and correct at the database layer; nothing in `/messages/thread/` calls it yet. D-074's whole premise is that a report is the *only* route a case manager who is **not** a participant ever has into message content — a chat surface with no way to file one is a real gap, not a nice-to-have. |
| 17 | ~~Run `pnpm --filter @pam/db test` against migrations 0060, 0061 and 0062~~ **Done (D-168); now also deployed live (D-169)** | — | This sandbox turned out not to be permanently missing `postgis` — `apt-get install postgresql-16-postgis-3` closed the gap. `pnpm --filter @pam/db test` ran for real: **221 checks pass, 0 failures.** `0060` was superseded (locally) before deploy but is still recorded live under its deploy-time name; `0061` and `0062` are also applied to the live Supabase project, and `get_advisors` (security) came back clean. Deploying also surfaced live/repo drift unrelated to this work — see the "What is live" drift note and D-169 — left for Will to reconcile. Deployed and merged under different numbers than they were built with — see D-170. |
| 18 | ~~`profiles_select_provider_linked` grants activity info~~ **Done — closed app-wide (0062, D-166)** | — | Was: a program admin could read `last_active_at`/`phone` for any enrolled member with no conversation required. Replaced with `provider_linked_members()` (id, first name only). Will confirmed this needed to be a blanket rule, not just a messaging-surface one, and the transparency screen now says so (D-167). Case managers unaffected. |
| 19 | **Decide whether `profiles.phone` needs a column-level `REVOKE` more broadly still** | Staff/member privacy | The provider-role exposure is now closed everywhere it was found (D-165, D-166 — `conversation_partners()` and `provider_linked_members()` both return name/role only). `profiles_select_admin_caseload` (case managers) still exposes the whole row, including `phone`, for a caseload/region member — untouched, since every instruction so far has been explicitly provider-role-specific, not about case managers. The `bidder_contact`-style column grant pattern used elsewhere in this repo would close it if Will wants that too. |
| 20 | ~~Build `admin_visibility.test.ts`~~ **Done, as `04_transparency_contract_test.sql` (D-168)** | — | `transparency.ts`'s own file comment used to claim a test by that name enforces `ADMIN_CAN_SEE` against live RLS; it never existed (D-164, D-167). Built and run: `packages/db/test/04_transparency_contract_test.sql`, covering the four contract lines that changed today (case-manager participation, non-participation, program-admin activity via both read paths, and total visibility) against a real database, not just documentation. Passes, per row 17. |
| 21 | ~~Can a super admin send messages?~~ **Confirmed: no (D-171)** | — | A super admin gets no "Messages" tile and `/messages/` reads "not for your role" for that account — this is correct, confirmed by Will, not a bug. Testing on the live deployment also found the live database has **zero `admin` and zero `provider` accounts** — only Will's `super_admin` and two plain members — so the caseload/enrollment messaging paths need a real case-manager or program-admin account (invite-created, with an actual caseload assignment or enrollment) before `/messages/`'s "Start a conversation" section will show anyone. |
| 22 | ~~Messaging never appeared during a role preview~~ **Fixed (D-172)** | — | Was gating `canMessage`/`isStaff` and the Home tile on the real role only, so a preview never showed them for any role — a bug, not the restriction D-171 actually called for. Now gates visibility on `viewedRole`, matching `/admin/`/`/directory/`/`/interested/`; real data/writes still only ever follow `trueRole`. |
| 23 | ~~Run the Playwright a11y suite against this session's changes~~ **Done 20 September** with `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` | Confidence in the new `DummyConversations`/`DummyStartable`/`DemoMessageComposer`/`ProgramBadge` UI | Could not run in this sandbox: `playwright install` fails downloading `chromium_headless_shell` (`cdn.playwright.dev` blocked by the agent proxy — a network-policy gap, not a missing-package one the way `postgis` was). The 426-pass figure in "What is proven" predates this session's changes. |
| 24 | ~~Deploy `0063`, `0064`, `0065`~~ **Done, with `0052` (Will, 20 September)** | — | `list_migrations` checked first: no new live-only drift since the 17th. All four applied in order; `get_advisors` (security) clean. `0052` closes the saved-places gap that had been open since the 16th. The live ledger records this session's earlier three under their deploy-time names (`0054_…`–`0056_…`, D-169 addendum) and these four under their real names. |
| 25 | **D-178's audience** | Who reads a reported message | The reporter's case manager is included alongside the sender's. Say if it should be the sender's only. |
| 26 | ~~Deploy `0066`~~ **Done (Will, 21 September)** | — | `list_migrations` first: no drift since the 20th. Applied; `get_advisors` (security) clean — `flagged_services()` and the recreated `conversation_partners()` are `authenticated`-only, `services_search()` is security invoker and so not even listed. `pg_trgm` now lives in `extensions`. Case managers keep the Reported places list read-only — Will's call, recorded as D-190. |

---

## Looking at it

```bash
node scripts/journeys.mjs     # every screen, every role, both themes
```

Writes `docs/journeys/index.html` — 130 screenshots of the built app against
stubbed data. Open it in a browser to review the whole product at once, which is
the only way to see the class of problem no test catches (D-091).

## Picking it up

```bash
cd pam && pnpm install
pnpm dev                                # web app on :3000

pnpm -r typecheck
pnpm --filter @pam/config test          # SMS safety, copy rules, points
pnpm --filter @pam/ui test              # components + axe
pnpm --filter @pam/db test              # migrations + RLS penetration suite
pnpm --filter @pam/web build
pnpm --filter @pam/web test:a11y        # browser: contrast, target size, 320px
node scripts/check-bundle-budget.mjs    # §12 first-load budget
```

The database suite needs `postgresql-16`, `postgresql-16-postgis-3` and
`pgcrypto`. It creates a throwaway cluster and cleans up after itself.

### Read these before changing anything

- `apps/web/.claude/CLAUDE.md` — Astryx's own conventions, generated by its CLI.
  They override default instincts, and ignoring them is what produced the
  unthemed build.
- `packages/config/transparency.ts` — a promise made to people with little reason
  to trust promises. Widening it fails tests by design; change the contract
  first and tell members before it ships.
- `DECISIONS.md` — 110 decisions with their reasoning, and the open questions.
- `docs/sop-amendments.md` — ten changes to the SOP since handover, several of
  which contradict it. Read before trusting a rule you remember from the SOP.
  A8 and A9 are the two screens that deliberately carry no help link; A10 is why
  the waiting state carries no words.

---

## Next

Phase 1: invite redemption (generation works, and sign-up covers the person who
has no code), the map and list with three-category filters, and the Philadelphia
importer. The first UI task is the five-tab member shell on `AppShell` +
`TabList`.

Two pieces of security groundwork carry into it, both in `DECISIONS.md`:
move the internal RLS helpers into a `private` schema PostgREST does not expose
(D-025), and split write policies off `for all` so a read never evaluates a
write rule (D-026).

Two pieces follow directly from the messaging work now that verification has
caught up with it: the migration that closes D-163's gap (who may start a
conversation — a case manager's caseload, a program admin's enrolled
members — should be a database rule, not just this screen's own restraint),
and wiring `report_message()` to a visible action in the thread view.
`admin_visibility.test.ts` is built and passing (D-168); this session's four
migrations (`0060` onward through `0062`) are deployed and verified
(D-169), and reconciled with the other concurrent session's own `0054`–`0059`
by the merge that renumbered them (D-170). What is still genuinely
undone: `0052_saved_places_say_what_they_are.sql` has never reached the
live project, and the live RLS fingerprint has not been re-verified since
either session's migrations deployed — see the drift note under "What is
live" and the "Live RLS fingerprint" row under "What is proven."
