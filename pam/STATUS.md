# PAM — where the project stands

Last updated 2026-09-17. The member-facing product is real now: signing up
and signing out, invite codes for all four kinds of account, saving, points,
badges, reporting a place, and a screen for the person running PAM. Every place
now says what it is and has a screen of its own. Notifications are readable —
a place or a person's name, not just "something happened" — and follow you
around the app rather than living only on Home. A demo/dummy-data layer now
fills every people list and notification feed for a first look at PAM before
real data exists. Locale is now a real, switchable preference — a language
icon on sign-in, an onboarding step, and account settings all read and write
`profiles.preferred_language` — and there is a shared, dismissible banner for
saying something happened outside a screen's own layout. A place's own screen
now returns to wherever it was opened from (Home, Places, or Saved) instead of
always to Places. The header is now content-consistent across every signed-in
screen — the same compact role-preview icon, the same merged area/edit
control, the same bell — though it still reloads on navigation (D-134); Home's
people preview for Case manager/Program/Super admin previews is now a
scrollable stories-style strip rather than a stacked list. Sign-in is now a
full-bleed photo hero — real commissioned illustrations, sourced via Google
Drive after Figma's own asset URLs proved unreachable from this sandbox
(D-135) — with the card riding up over its bottom edge. The hero now takes
about half the screen, runs flush to the top and every side (no corner
radius), and autoplays every 4 seconds by looping directly back to the
first slide rather than scrolling past the end (never under reduced
motion, D-136, D-137, D-138). Newest session log:
`docs/sessions/2026-09-17-hero-edge-to-edge.md`.

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
Philadelphia). Fifty-one migrations applied, through 0052. The database is real and reachable;
the app is not deployed anywhere yet.

**The text-message dispatcher is live and running** — the `dispatch-sms` function
is deployed and a database schedule calls it every five minutes. It sends
nothing, on purpose: no human has signed off the copy, so every message is
refused and the refusal is recorded on the message. Proved against the live
project with one real queued notice: `claimed 1, sent 0 — copy is not signed
off`. Quiet hours, the STOP list and atomic claiming are enforced in the
database, not in the function. Signing the copy and adding the Twilio
credentials is what turns it on; nothing needs redeploying. See
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

What is left before a real text sends, all of it a human's:

1. Twilio credentials into the `dispatch-sms` Edge Function secrets — use the
   **Messaging Service SID**, not a bare from-number: the A2P approval attaches
   to the service.
2. Somebody has to answer the reminders question. Every existing row has
   `sms_enabled = false` (0042 made consent opt-in), so nothing sends to anyone
   until they say yes — including Will's own account.
3. The HELP auto-reply on the Messaging Service, matching what was filed.

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
| `apps/web` | Next.js 15 + React 19, static export, Astryx themed and working, i18n, PWA manifest, Supabase client, runtime support-phone lookup | Foundation only — see gaps |
| `apps/native` | Capacitor 6 config wrapping the web export; native speech recogniser wired to `VoiceInput` | Config only, never built for a device |

---

## What is proven, and how

Numbers here are from the last run, not aspirations.

| Check | Result | What it actually proves |
|---|---|---|
| Typecheck | 5/5 packages | — |
| `@pam/config` tests | 202 pass | No SMS can send unreviewed, over 160 chars, with emoji, or with a term that reveals justice involvement. Locales are key-for-key. The transparency screen matches its contract. |
| `@pam/ui` tests | 66 pass | Every component is axe-clean. `PlaceCard` offers exactly three actions in a fixed order. Reduced motion is respected. The mic hides when unsupported. |
| Database suite | 152 checks pass | See below |
| Live RLS fingerprint | identical to local | The deployed policy set is provably the one that was penetration-tested: `ce9636c3b77e4827368e6575742b899c`, 73 policies on both |
| Live anonymous attack | 0 rows leaked | A signed-out caller reads no profiles, messages, invites or audit rows on the real database, while still reaching the support number and the public catalogue |
| Browser a11y + theme (Playwright, full suite) | 426 pass | No WCAG AA violations at 320px or iPhone SE. Every control clears 48px. No horizontal scroll. The Astryx theme really resolves. Runs in dark mode as well as light. |
| First-load JS | 501.1 kB of 500 kB — **1.1 kB over budget**, disclosed and unresolved | §12 budget, measured gzipped on what `index.html` actually loads; see 2026-09-16 session logs |

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

- **No map, no enrollment, no chat.** Sign-up exists — `/join/`, five steps —
  and an invite code is typed into its second step, or arrives as
  `/join/?code=`.
- **Nothing reviews `staff_requests`.** Sign-up records people who say they run
  a program or carry a caseload; the rows are there and a super admin can read
  them, but there is no screen and no notification. The screen promises a call
  within a day or two, so somebody has to be told to look.
- **What does exist and works:** sign-up, sign-in, home, saved places, points
  and badges, the places list, a screen per place at `/place/?id=…`, reporting
  a place, the notifications list, the
  reminders question, the case manager screen, the people directory, and the
  privacy and terms pages.
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
| 10a | **Who calls the people who ask to help?** | Program leads and case managers getting accounts | Sign-up collects them as requests in `staff_requests`, and the screen says somebody will call within a day or two. Nobody works that list yet, and nothing tells them there is one. The code they need can now be made from the people screen. |
| 9b | ~~754 places, and not one of them says what it is~~ **Done** | — | 0050, 16 September: all 754 carry a description of at most 200 characters, written from the city's own `service_type` / `park_name` / `asset_name` fields or, for the twelve hand-added places, from published sources. 230 have a website and 361 are marked `audience`. Verified live: 754 active, 754 described, 0 hidden for review, longest 152 characters. This reversed the screen half of 0017 and needed Will's word — see A11 and D-121. The words are sourced, not invented, but **no provider has read their own entry yet.** |
| 10c | **Confirm the Twilio account's state** | Anybody whose number is not verified | This row said the account was in trial. Will, 16 September: the Twilio console says it is active. That earlier claim came from a 13–14 September finding and was repeated afterwards without re-checking; this session did not verify it either way, so it stands as Will's word and unverified here. If it is active the trial concern is gone; if not, a code to an unverified number is not sent and nothing says so — the live logs on the 14th show one phone asking three times. Carrier registration is a separate question (row 10). |
| 10b | **A line about the PAM team on the transparency screen** | A promise already made | Members were told they would hear first if what is visible changes, and the directory now shows a super admin every account (name, role, region, status, last active; never messages or contact details). Proposed, for `packages/config/transparency.ts`: *"The PAM team can see your name, your city and the last day you used PAM. Never your messages."* It is a change to the contract, so it wants Will's word. |
| 10 | **Twilio credentials into the dispatcher's secrets** | Reminders and notices | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and either `TWILIO_MESSAGING_SERVICE_SID` or `TWILIO_FROM_NUMBER`, under Edge Functions → dispatch-sms. Until then the dispatcher records "Twilio is not configured" instead of sending. |

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
