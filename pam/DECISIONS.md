# PAM — Decisions log

Per SOP §15: everything not marked `[ASK WILL]` was decided here and logged.
The rule applied throughout, from §15: **when in doubt, choose the option that
is simpler for a first-time phone user.**

Newest first within each section.

---

## Open — need Will

These block nothing in Phase 0 but will block later phases. Defaults are in
place so work continues either way.

| # | Question | SOP | Blocks | Default in place |
|---|---|---|---|---|
| W-1b | **The PA 211 export URL** | §5.2 | 211 data only | Licence cleared and the host is reachable, but it serves a search UI, not a feed. Ask the 211 contact for the HSDS/Open Referral URL — the importer already supports the format. Philadelphia's own datasets are verified and active (D-030). |
| W-2 | **Final brand colours and logo** | §2.5, §15 | Phase 6 polish | Category pins use Astryx palette `blue` / `green` / `purple`, chosen for hue separation at AAA contrast. |
| W-3 | **Do points redeem for real rewards?** | §8, §15 | Phase 3 | `REWARDS_ENABLED = false`. Table and flow to be built behind the flag, shipped off. |
| W-4 | **Additional languages beyond English and Spanish** | §2.3, §15 | Phase 6 | `SUPPORTED_LOCALES = ['en', 'es']`. Adding one is a locale file plus a constant. |
| W-5 | **Pilot partner orgs and test scheduling** | §13, §15 | Phase 7 | — |
| W-6 | **Missed-appointment history retention beyond 90 days** | §15 | Phase 5 | No purge job yet. Data is kept indefinitely, which is the wrong default for this population — needs an answer before pilot. |
| W-8 | **Who reviews SMS copy?** | §9 | Phase 2 | Every template ships with `reviewedBy: ''` and `renderSms` refuses to send an unreviewed one. Nothing can text a member until a person signs off. |

---

## Answered by Will — 2026-09-12

- **Target city: Philadelphia.** Region seeded, four import sources registered
  (D-028).
- **PA 211 is cleared for use.** The licence blocker is gone; the endpoint is
  still unverified, so the source stays inactive (D-028).
- **Support line: +1 267 309 5265**, and it will change over time — so it is a
  row in `app_settings`, not a constant (D-027).
- **Provision Supabase: yes.** Project `pam` (`shobqzuhicoiymtumiaz`), us-east-1,
  all 12 migrations applied and verified (D-003).

---

## Decided

### D-001 — PAM lives in `pam/`, not at the repository root
The repository already hosts Will's garage sale site in `site/`, deployed by
`.github/workflows/pages.yml` on pushes touching `site/**`. Putting the monorepo
at the root would have meant restructuring a live, working deployment for an
unrelated project. `pam/` keeps both intact, and `pam-ci.yml` is path-scoped to
`pam/**` so neither workflow can trigger the other.

### D-002 — Versions pinned to the SOP's majors, not to latest
§1 says the stack is fixed. Where the SOP names a major that is no longer
current, the SOP wins:

| Package | Pinned | Latest available | Why |
|---|---|---|---|
| Next.js | 15.5.25 | 16.3.5 | §1 says Next.js 15 |
| Capacitor | 6.2.x | 8.5.2 | §1 says Capacitor 6 |
| React | 19.x | 19.3.0 | §1; also Astryx's floor |
| Astryx | 0.6.0 | 0.6.0 | current |
| StyleX | 0.19.0 | 0.19.0 | Astryx peer requirement |

Worth revisiting with Will before the pilot: Capacitor 6 is two majors behind,
which will matter for iOS/Android SDK support at store-submission time.

### D-003 — Supabase project `pam` is live *(updated 2026-09-12)*
Will approved provisioning. Project `pam` (`shobqzuhicoiymtumiaz`), us-east-1 —
the closest region to Philadelphia. All 12 migrations are applied.

The RLS was verified rather than assumed: the applied policy set was fingerprinted
against the locally-tested one and they match exactly —
`ce9636c3b77e4827368e6575742b899c`, 73 policies on both. A signed-out caller was
then attacked directly on the live database and reads zero profiles, messages,
invites or audit rows, while still reaching the support number and the public
catalogue.

The first admin still needs creating — `pnpm --filter @pam/db seed:admin`, which
needs the service role key. No admin exists yet, so no invite can be issued yet.

The database tests still do **not** need the project: they stand up a throwaway
Postgres, apply a small shim reproducing the parts of Supabase the migrations
depend on (`auth.users`, `auth.uid()`, the three roles), and run the real
migrations and policies against it. Every change below was proved there first.

### D-004 — RLS lives in one migration, not beside each table
`0007_rls.sql` holds every policy. Co-locating policies with their tables reads
better file by file and worse as a set — and a policy set is what §13 Phase 7
asks a reviewer to attack. One file is one read.

### D-005 — `points_ledger` and `audit_log` are protected by triggers, not only by absent policies
Omitting UPDATE/DELETE policies stops clients. It does not stop `service_role`,
which bypasses RLS and is what Edge Functions run as. Since §8 makes the ledger
append-only and §4.1 makes admin actions auditable, both tables carry a trigger
that rejects UPDATE and DELETE outright. The test suite asserts this *as*
`service_role`.

### D-006 — Subcategories are rows, not an enum
§2.5: "Subcategory list is editable by admins in the admin panel; changes
require a migration entry, not a code change." A Postgres enum cannot be edited
by an admin panel. `service_subcategories` is a table, seeded with the SOP's
list; the compile-time union in `@pam/config` mirrors it, and a test asserts the
two agree.

### D-007 — Category colour is defined once, in `@pam/config`
The map pin colour and the chip colour are the same fact. `CATEGORY_DEFINITIONS`
owns it and `PlaceCard` reads it, so a member who learns "blue means school"
never sees the two disagree.

### D-008 — The 48px touch-target floor is a global rule in the `pam` cascade layer
Astryx is built for dense desktop UI: its `TextInput` renders a 20px inner
`<input>` and its default `Button` is 32px. Both fail §2.5's 48px minimum. The
floor is applied once, system-wide, in the `pam` layer rather than component by
component — a component added next month should clear it without anyone
remembering. The Playwright suite measures every interactive control on the page
and fails the build if one slips under.

§2.5 describes the eventual home for this as the copied theme's tokens
(`astryx theme add neutral`). That is the right Phase 6 refactor; the CSS rule
is the honest Phase 0 version.

### D-009 — Phone entry needs a dedicated `PhoneInput` in Phase 1
Astryx's `TextInput` accepts `type` of `'text' | 'password' | 'email'` only.
§10 step 4 needs a numeric keypad and E.164 formatting, so `VoiceInput` is typed
to what Astryx actually supports and phone entry gets its own component built on
`NumberInput` or a masked field.

### D-010 — Next.js builds with Babel, not SWC
StyleX has no SWC transform at 0.19, and §1 fixes StyleX as the styling layer.
Adding a Babel config switches this app off SWC, which costs build speed.
Correctness of the design system beats build time here. Revisit when StyleX
ships an SWC plugin.

### D-011 — `@stylex;` needs the StyleX Babel plugin listed in `babelConfig`
Recorded because it cost real time and fails silently. `@stylexjs/postcss-plugin`
defaults to the project's Babel config; passing a custom `babelConfig` replaces
it wholesale. Without `@stylexjs/babel-plugin` in that object, the plugin parses
every file, extracts nothing, and substitutes `@stylex;` with an empty string —
producing an app whose components carry correct class names and no rules behind
them. It builds clean and looks broken.

A custom `babelConfig` is needed at all because `.babelrc.js` is file-relative
and does not apply to `packages/ui`, which lives outside the app directory.

### D-012 — The web app is a static export
§1 has Capacitor wrapping the Next.js export. Keeping the web build static from
day one means the native shells never diverge from what the browser gets.
Server-side work belongs in Supabase Edge Functions, not Next route handlers.

### D-013 — SMS templates carry per-variable length budgets
The Spanish `appointment_24h` renders at 159 of 160 characters with a
31-character address. An ordinary longer address pushed it over and made
`renderSms` throw, which would have silently killed the reminder. Templates now
declare a budget per variable and over-long values are shortened at a word
boundary. A reminder that arrives with a clipped address beats one that never
arrives; the maps link in the same message carries the exact destination.

### D-014 — `transparency.ts` is the contract, and tests hold it to that
§4.1 requires the onboarding screen to match the SOP word for word. Two copies
of that text would drift, so the English source lives in `transparency.ts`,
`en.json` must match it exactly, and a test fails on any divergence. A second
test asserts that no policy on `messages` or `activities` mentions `is_admin` or
`admin_covers` — if someone later grants admins read access to chat, the build
fails and names the promise being broken.

### D-015 — Readability is reported, not gated
§14 asks for a readability check targeting Flesch-Kincaid ≤ 5. The metric is
rough on proper nouns and unavoidable words ("mentor", "connect"), so the test
prints every string over target and asserts only that the median stays at or
below it. Two transparency strings were rewritten because of this check.

### D-016 — Playwright runs Chromium only
CI images commonly ship Chromium alone, and what these tests measure — contrast,
target size, overflow at 320px — does not depend on the engine. Both projects
use Chromium at the two viewport extremes §12 names (320px and iPhone SE).
`PLAYWRIGHT_CHROMIUM_PATH` points at a pre-installed binary when the image's
build does not match. Add a WebKit project wherever a full matrix is available.

### D-017 — First-load budget measures what `index.html` actually loads
Summing every chunk in the output directory counts code that only loads on other
routes. The check parses the exported entry page and gzips exactly the scripts
it references.

**Current: 455 kB of the 500 kB budget, 45 kB to spare** — and that is a demo
page on an app with one route. Google Maps arrives in Phase 1. This will need
attention before it needs celebrating; the `15edc7c2` chunk alone (React plus
Astryx) is 217 kB gzipped.

### D-018 — `is_public` defaults to **false**
§4 says `is_public = false` hides a member from all discovery but does not say
which way the column defaults. For a population where being findable can be a
safety risk, the safe default is invisible, with visibility as a choice the
member makes. Mentors opt in by completing a mentor profile.

### D-019 — Invite redemption is a `SECURITY DEFINER` RPC
Clients never select from `invites`, so a wrong guess cannot enumerate pending
codes. The RPC distinguishes not-found, already-used, expired and phone-mismatch
for the logs; §10 step 3 shows the member the same plain sentence either way.

This was caught by a test that appeared to pass for the wrong reason — a
mismatched phone was refused because the row was invisible, not because the
phone check ran. The test now asserts the specific error.

### D-020 — Invite code alphabet excludes ambiguous glyphs
`34679ACDEFGHJKMNPQRTUVWXY` — no `0/O`, `1/I/L`, `2/Z`, `5/S`, `8/B`. §4.1 has
admins reading codes aloud in person, and these are the pairs that get misheard
and mistyped. A test generates 200 codes and asserts none contains one.

### D-021 — Attendance records how it was verified
`appointments.attendance_method` is required whenever status is `attended`,
enforced by a check constraint. §8 pays 100 points for a provider check-in and
60 for an SMS "YES"; without the method stored, the difference is unauditable
after the fact.

### D-022 — Appointments store the member's timezone
§7.2 schedules an 8am morning-of reminder. That has to be 8am where the member
is, not where the server is, so `appointments.timezone` is captured at creation
and reminder `send_at` is computed from it.

### D-023 — A blocked pair is mutually invisible, enforced in RLS
§6.2: "Block ends the connection and hides both users from each other
permanently." `is_blocked_between` is consulted by every discovery policy in
both directions, and tested from both sides.

### D-024 — Forbidden-term lists are enforced in code, not documented
§0 and §9 both forbid language that reveals justice involvement.
`assertSmsIsSafe` runs on every outbound message and `findDignityViolations`
runs over every locale string in CI. A reviewer can miss a word; a test does not.

### D-024 — Astryx is applied by a provider, not by importing its CSS
Will flagged that the first build did not look like Astryx. It did not, and the
cause was that `<Theme theme={neutralTheme}>` was never wrapped around the app.
The three stylesheets loaded with 200s and every component still rendered
unthemed, in browser-default serif, because Astryx puts its theme class on the
subtree from React. The `/built` theme import pairs with the precompiled CSS and
skips runtime injection, which is what makes it work under static export.

Three setup faults came out with it:

- `@import '…' layer(reset)` was rewritten by Next's CSS pipeline into an
  invalid `@media layer(reset)` block, silently dropping the entire reset. The
  Astryx sheets declare their own layers, so they are now plain JS imports from
  the app entry — the form Astryx's own agent docs prescribe — with the layer
  order declared up front in `layers.css`.
- `@astryxdesign/core` was in `transpilePackages`, which re-ran the StyleX
  transform over its source and minted class names the shipped stylesheet does
  not contain.
- theme-neutral asks for Figtree and nothing loaded it.

Underneath all of it: I skipped `astryx init` and built against guessed APIs.
The CLI is now a dependency and its generated conventions are committed at
`apps/web/.claude/CLAUDE.md`. Reading them is what found the provider.

Three browser tests now assert the theme is really applied — computed typography
is not a browser default, the theme tokens resolve on the document, and the
webfont returns 200. Nothing caught this before: the build passed, axe passed,
and the unit tests passed on accessible names.

### D-025 — SECURITY DEFINER helpers are guarded, not just granted
Supabase's security advisors, run against the live project, flagged something the
local suite could not see: PostgREST exposes every `public` function at
`/rest/v1/rpc/<name>`, so a definer helper taking a caller-supplied id can be
invoked directly with somebody else's. The RLS policies were correct; the leak
was around them.

`member_points(<any member>)` returned that member's balance to anyone.
`are_buddies`, `is_blocked_between` and `feature_allowed` let a caller probe the
social graph and another user's access controls.

Each now carries a self-participation guard. Every policy already passes
`auth.uid()` as one argument, so RLS evaluation is unchanged — only a direct
call with someone else's id is affected. Eight tests assert both halves: the
probe fails, and the legitimate reader still gets their answer.

The thorough fix is to move internal helpers into a `private` schema PostgREST
does not expose. That means recreating all 73 policies to reference it, so it is
Phase 1 work rather than a same-sitting change to a live database.

### D-026 — `for all` policies are evaluated on SELECT, and that bit
Revoking EXECUTE from `anon` on those helpers (0011) looked like the tidy fix and
broke signed-out reads: a policy declared `for all` covers SELECT too, so reading
`services` evaluated the provider's *write* policy, called `feature_allowed`, and
failed with "permission denied for function" instead of returning the catalogue.
A member who is not signed in could not see the places that can help — the §0
failure this product cannot have.

0012 restores the grants and states the real boundary: after D-025 every one of
these helpers is anchored to `auth.uid()`, which is null for a signed-out caller,
so each returns false or the harmless default. **The guard is the boundary; the
grant never was.** Revoking only broke legitimate reads.

What stays off the anonymous surface is the set with no signed-out use:
`member_points`, `create_invite`, `admin_set_*`, `redeem_invite`, and
`generate_invite_code` (callable by nobody — `create_invite` uses it internally
as definer).

Splitting write policies off `for all` so a read never evaluates a write rule is
the structural improvement, and is Phase 1 work.

### D-027 — The support number is a database row, not a constant
Will gave the number as +1 267 309 5265 and said it will change. It appears in
the HelpBar on every screen, so a redeploy to change it is how a wrong number
stays live for a week. It lives in `app_settings.support_phone`, which an admin
can edit, and is readable by signed-out visitors — someone who cannot get into
the app still has to be able to call.

`useSupportPhone()` paints the env fallback immediately and swaps if the database
has a newer value. If the fetch fails — offline, the normal case for this
audience — the fallback stands. There is no state in which the HelpBar has no
number.

### D-028 — Philadelphia sources are registered but inactive
Four sources are seeded against the Philadelphia region: the OpenDataPhilly
health and human services catalogue, its Health Centers dataset, the City's
ArcGIS open data portal, and PA 211 Southeast.

Every one is `is_active = false`, and `source_url` points at a catalogue page a
human can open rather than a FeatureServer endpoint. The build environment's
egress proxy blocks all four hosts, so no endpoint could be verified — and an
invented URL in a source registry is worse than an absent one, because the
importer would appear to be configured. Resolving the real endpoints is the first
task of the Phase 1 importer, and the nightly job skips inactive sources.

PA 211's licence was cleared by Will on 2026-09-12, so the only thing left on
that row is the endpoint. It is the widest source of family services in the
region and the one most worth having — worth resolving first.

### D-029 — Help is merged into the bottom dock, above the five tabs
*(Will, 2026-09-12)*

Two SOP requirements want the same 60 pixels at the bottom of a phone: §3.1's
five member tabs and §2.4's persistent `HelpBar`. Two separately-positioned fixed
bars is the worst outcome — they stack unpredictably, each needs its own
safe-area handling, and on a short screen one hides the other.

Will's call: merge them. One fixed dock, rendered once.

**Shape:** a full-width Help row sitting directly above the five tabs, inside the
same container, separated by a divider.

**Why not a sixth tab**, which is the more literal reading of "merge":

- §3.1 caps the member app at five tabs, and Help is an action, not a
  destination — it dials a phone. Sitting it among five navigation targets as a
  visual peer invites the mis-tap.
- A mis-tap here places a real phone call to a real support line. That is
  disruptive for the member and costly for whoever staffs the line, and it is
  the kind of error this audience is most likely to make.
- Six items at 320px is 53px each, which forces a label small enough to exclude
  the people least able to read it. A full-width row keeps "Need help? Call PAM"
  legible at full size.

**Cost:** roughly 44px of vertical space on every screen, about 7% of an
iPhone SE. Paid deliberately — §0 makes a visible way to get help
non-negotiable on every screen, and the alternative was hiding it behind a menu,
which for a first-time phone user is the same as not having it.

`HelpBar` stays a component in its own right (§2.4 names it), and `TabBar`
composes it rather than duplicating it. Nothing else in the app positions a
fixed element at the bottom.

If this proves too heavy in usability testing (§13 Phase 7), the fallback is a
Help affordance in the top bar — not a sixth tab.

### D-030 — Blocked hosts are reached from the database, not the sandbox
*(2026-09-12)*

Will asked how we reach the 211 host. The build sandbox denies **all** external
egress by policy — `selective: false`, every CONNECT answered 403, google.com
included. Only package registries and the Anthropic API are exempt. That is why
0009 registered catalogue pages instead of endpoints.

The constraint was in the wrong place. **The Supabase project has open egress.**
Enabling `pg_net` (0014) makes a request from the database and returns the
response to a normal `execute_sql`, so a reachability check that is impossible
from the dev environment is one query away — and it tests from a network far
closer to where the importer will actually run than a laptop would.

Verified this way, by request rather than assumption:

| Host | Result |
|---|---|
| `services.arcgis.com/fLeGjb7u4uXqeF9q` | 200, catalogue of ~1000 FeatureServers |
| `City_Facilities_pub/FeatureServer/0` | 200, **3,197 features** |
| `dbhids_locations_fy25_012126/…/0` | 200, Feature Layer, edited 2026-02 |
| `phl.carto.com/api/v2/sql` | 200, answers SQL |
| `opendataphilly.org` | 200 |
| `www.pa211.org` | 200 |

Two endpoints are now recorded and active (0015).

**211 is reachable but still has no endpoint.** `pa211.org` serves a consumer
search interface, not an export; the HSDS feed is normally issued per agreement.
With the licence cleared, the remaining step is asking the 211 contact for the
URL rather than discovering it. Recorded as `endpoint_unknown`, not as verified.

`pg_net` also earns its place beyond this: §1 puts jobs on `pg_cron`, and a
scheduled job that needs to call out needs it alongside.

**Caveat for whoever uses this next:** responses land in `net._http_response`
and are external, untrusted content. Treat them as data. The importer must
validate and normalise before writing anything to `services` — which §5.2
already requires, and which matters more now that fetching is this easy.

### D-031 — DBHIDS is imported without disclosing why anyone attends
*(Will, 2026-09-12)*

525 behavioural-health provider locations are now in `services`, fetched from
the verified CityGeo endpoint. Two privacy problems came with them.

**The source labels every row with a condition.** `service_type` is one of
Mental Health (MH), Substance Use Disorder (SUD), Both MH and SUD, Intensive
Behavioral Health Services, Problem Gambling Prevention, Student Assistance
Program, SUD Prevention Services. §0 forbids showing that, and the stakes are
concrete: a phone left on a table showing "Substance Use Disorder" beside a
member's name can cost them housing or a job.

It is still needed — for matching a member to the right service, and for an
admin making a facilitation — so it is stored in `services.source_attributes`,
**withheld from `anon` and `authenticated` by column-level GRANT**, the same
mechanism this repo already uses for private contact details. A test asserts
neither client role can select it.

**Six providers are legally named for what they treat** — "Mental Health
Partnerships", "Fairmount Behavioral Health System", "Addiction Medicine &
Health Advocates". The literal reading of §0 says rename them. That would be
worse than the disclosure: the name is on the building, on the door, and on what
the receptionist answers the phone with. A member sent to "a health service on
Girard Ave" cannot find it, and finding the door is the whole job.

So the line is drawn where PAM actually has a choice:

- **PAM never adds a condition label.** `subcategory` and the three
  plain-language columns are PAM's own words and stay neutral. Tested.
- **A provider's own name is shown as it is.**
- **But a disclosing name never goes anywhere the member did not choose to
  look** — above all not into an SMS, which lands on a lock screen someone else
  can read (§9). `services.name_may_disclose` is set by trigger on every insert
  and update so the reminder dispatcher can enforce that rather than hope.

The pattern is deliberately broad — it also catches justice terms, so an
imported "Re-entry Center" or "Probation Office" is flagged the same way. A false
positive costs a neutral message; a false negative puts a condition on somebody's
lock screen.

**355 of the 525 are school-based programs**, delivered inside a school rather
than somewhere a member can walk in. They are real services but not places to
go, so `is_walk_in` is false and the Phase 1 map should exclude them. 170 remain
as walk-in locations. Every row is `needs_review = true` — none reaches a member
before the §5.2 plain-language pass and a human approval.

### D-032 — Hours come from Google, in the slot a dead Call button would occupy
*(Will, 2026-09-12)*

Will asked that these providers map to Google so members can get hours. The
imported data has no hours and no phone numbers at all — 525 addresses and
nothing else — so without this they would be pins a member cannot act on.

`googlePlaceHref(name, address, placeId)` builds a Google Maps place link, which
opens the listing carrying hours and usually the phone number, kept current by
the business. It needs no API key.

**Where it goes matters more than that it exists.** §5.1 fixes PlaceCard at
exactly three actions in a fixed order, and a member learns that order once. So
rather than adding a fourth button, the first slot adapts: with a phone number it
is **Call**, a real `tel:` link; without one it becomes **Hours**. A permanently
greyed-out Call button teaches a member that the app does not work, which is the
more expensive outcome.

`place_id` makes the match exact and is filled in by the importer once a Google
Places key exists — **that key is the real unlock**: it would give phone numbers
and structured hours for all 525, letting PAM show "Open now" natively (§5.1)
instead of sending people to Google. Until then, name plus address resolves
correctly for a named organisation at a street address.

### D-033 — The Google link exists twice, and a test keeps the two identical
*(2026-09-12)*

`googlePlaceHref` in `@pam/ui` builds the member's link. `public.google_place_url`
builds the same string in SQL, because it is needed server-side too: the Phase 5
admin CSV export, the importer once it has a Places key, and anyone checking by
hand whether a row resolves.

Two implementations of one string is how they drift, so a database test asserts
they are **byte-identical** — including the UTF-8 percent-encoding of accents and
ampersands, checked against values Node's `encodeURIComponent` produced. Postgres
has no `encodeURIComponent`, so `url_encode_component` reproduces its unreserved
set exactly (`A-Z a-z 0-9 - _ . ! ~ * ' ( )`).

**What was verified, and what was not.** The URLs are well-formed, Google returns
200, and each response echoes the query it was given. That proves the link is
accepted and carries the right search. It does **not** prove each one lands on
the correct listing — Google Maps renders client-side, so the server HTML never
contains the resolved place. Confirming that needs the Places API or a human
tapping a few. Recorded as unverified rather than counted as working.

### D-034 — Display name and lookup name are different fields
*(2026-09-12)*

The DBHIDS feed is entirely uppercase, and shouting at a member is not plain
language (§0), so the ingest runs `initcap`. Generating the real URLs exposed the
cost: `initcap` turns the acronym **"APM" into "Apm"** and "CATCH" into "Catch".

That is right for the card and wrong for the lookup. "Apm" is a worse query for
Google and is not what is written on the building — and the sign is what a member
matches against when they arrive.

So the two names are now two columns: `name` is normalised for reading,
`lookup_name` keeps the organisation's own spelling and is used only to build the
Google link. The original was already in `source_attributes`, but that column is
withheld from client roles (0016) so a browser could not reach it; `lookup_name`
is visible, because a business name is not a condition.

A Places key supersedes all of this — `place_id` makes the match exact and
neither spelling matters.

### D-035 — Every dead end gets a message that explains itself
*(Will, 2026-09-12)*

Will's example: an admin opens a member in another region, `admin_covers()`
returns false, every query comes back null, and the screen is blank. On screen
that is indistinguishable from a bug, and §0 forbids it: "Never dead-end."

`@pam/config/notices` now holds every condition PAM can land in — out of region,
suspended, limited, feature turned off, the four invite failures, empty
searches, offline, and a catch-all. Each says what happened, why when the reason
is safe to give, and what to do next, which is usually a phone number.

Three rules, all enforced by tests:

- **Never blame the reader.** "You do not have permission" says they did
  something wrong. "This person is in a different area" says what is true.
- **Never leak more than the reader is entitled to.** The out-of-region notice
  tells an admin about their own scope and deliberately does not confirm whether
  that person exists — otherwise the screen becomes a way to enumerate members
  across every region.
- **Never dead-end.** Every notice either offers the support line or names a
  next step. The catch-all always offers the phone, because everything
  unhandled lands there.

The four invite failures keep separate keys so they are distinguishable in logs
and to an admin, while §10 step 3 still shows one plain sentence per case.

### D-036 — Notices are built from Card, not Astryx's Banner
Astryx's `Banner` is the right component by design and the wrong one by weight:
its dismiss control carries a tooltip, so importing it pulls the whole
overlay/layer subsystem. A message that must work when everything else has
failed is the wrong place to spend that.

What Banner offered that matters — the alert role, the status colour, the icon —
is a few lines on `Card`. `EmptyState` is kept as-is; it is light.

Nothing is dismissable, which is also Astryx's own guidance for errors: a member
should not be able to swipe away the reason their account is paused.

### D-037 — Lazy load what is optional, never what is needed when the network fails
*(Will, 2026-09-12)*

The §12 budget is 500 kB of first-load JS, and the build went 70 kB over. Two
causes, and neither was the one I first assumed — I twice removed a component I
suspected and the number barely moved.

The real cause was **the Supabase client, statically imported by
`useSupportPhone`**: roughly 86 kB gzipped, in the first load of every route, for
a lookup that is pure enhancement. The support number is already on screen from
the env value before that code runs.

Will asked whether lazy loading would help. It did: importing the client inside
the effect brought the page from 568 kB to **481.6 kB**, back under budget.

The rule this establishes, which matters more than the saving:

- **Lazy load** anything optional or route-specific — the map, chat, provider
  and admin surfaces, and any enhancement over a working fallback.
- **Never lazy load** anything a member needs when the network has *already*
  failed: the error notices, the help bar, the offline banner. A chunk that
  cannot download is a blank screen at the exact moment someone is most stuck —
  it manufactures the dead end §0 forbids. Two browser tests now assert the help
  path is in the server-rendered HTML and works with JavaScript disabled.

**The margin is thin: 18.4 kB.** The next target is Astryx's i18n message
catalogue, which ships strings for every component in the library —
`@astryx.alertDialog.*`, `@astryx.avatarGroup.*` — not just the ones PAM uses.

### D-038 — One place to find help, not one per screen
*(Will, 2026-09-12)*

The out-of-region notice carried its own "Call PAM for help" button. Removed.

Help is persistent and one tap away in the bottom bar, and a second call button
on an individual screen teaches a member two places to look for the same thing.
It is also not an emergency: the admin simply cannot see someone outside their
area, and the notice still names the next step in words ("ask PAM support to
move them").

The exception is a screen the member cannot get *past*. `account_suspended`
keeps its own call button, because someone stuck at sign-in never reaches the
bottom bar at all. That distinction — is the persistent Help reachable from
here? — is what decides whether a notice carries its own call.

### D-039 — Help is a screen, and takes one slot in the bottom bar
*(Will, 2026-09-12)*

`HelpBar` was a full-width row pinned to the bottom that dialled straight out.
Two things were wrong with that once the five member tabs (§3.1) needed the same
space:

- **It took the whole row.** It is now a compact item sized to sit alongside the
  tabs, so the bottom bar has room for the rest of the navigation.
- **It answered only one question.** It now leads to `/help`, which can say what
  PAM support does, when someone answers, and what to do if nobody does — and
  can grow a second route later without finding new space at the bottom of a
  phone.

The cost is one extra tap before dialling, and one extra page load. Both are
paid deliberately; the tap is cheap and the page is 1 kB.

**What was protected while changing it.** §0's guarantee is that help works when
nothing else does, so the whole path stays real anchors: the Help control is an
`<a>`, the help screen renders the phone number into static HTML from the env
value, and a browser test walks the entire route — tap Help, reach a `tel:`
link, find a way back — **with JavaScript disabled**.

**A deployment bug this surfaced.** The static export was emitting `help.html`
rather than `help/index.html`, so `/help` would 404 on any static host without
extensionless rewrites — and inside the Capacitor bundle, which is served off
the filesystem with no server at all. `trailingSlash: true` fixes it. The one
screen that must never fail was the one that would have.

### D-040 — Demo labels describe the component, not its implementation
The Points section was captioned "PointsBadge · respects prefers-reduced-motion".
Removed at Will's request. Honouring reduced motion is a requirement (§8, §12)
enforced by a unit test, not a feature to advertise on the screen.

### D-041 — PAM was illegible in dark mode, and every test passed
*(Will, 2026-09-12)*

Will opened a review build and said the text and background lacked contrast. He
was right, and it was a real bug in the app rather than the review vehicle.

Astryx's reset deliberately leaves the body background and colour to the
application, and nothing set them. That is invisible in light mode and breaks
dark mode outright: the theme's colours are `light-dark()` pairs, so in dark
mode the text resolved to near-white while the page stayed on the browser's
default white canvas. Secondary text measured **2.67:1** against 4.5:1 required.

theme-neutral ships the right token — `--color-background-body`,
`light-dark(#f1f1f1, #1b1b1b)`. It simply had to be used.

**Why nothing caught it.** Every accessibility check ran in the default colour
scheme, which is light. axe has a colour-contrast rule and it passed, because in
light mode the page genuinely is fine. The suite now runs a third project,
`dark-320`, at the same narrow width with `colorScheme: 'dark'`, and two tests
assert the body paints an explicit background rather than compositing against
whatever the browser decides.

The general lesson, which is worth more than the fix: **a passing accessibility
suite only covers the conditions it runs under.** §2.2 asks for light and dark
from the start; the tests only ever saw one of them.

### D-042 — The review build is static, and that was the right trade
The published review is the real export — real theme, real components, real copy
— with the React hydration bundle stripped. Next hydrates the whole document,
and inside an artifact's own `<head>`/`<body>` wrapper that mismatch makes React
clear the DOM to blank.

Re-hydrating inside an artifact is possible but means fighting Next's
document-level hydration and its root-relative asset paths. The right vehicle
for a genuinely interactive URL is an ordinary static host; GitHub Pages for this
repository is already taken by the garage sale, so that is a Vercel or Netlify
decision when it is wanted.

What the static build costs is interaction — the points counter, the save
toggle. What it kept is everything a visual review is for, and it earned its
place immediately: it is how D-041 was found.

### D-043 — Distance is formatted in one place, and rounds honestly
`distanceLabel()` in `@pam/config` is the only way a distance reaches a screen.
It returns a locale key and its variables, not a finished string, so Spanish
keeps its decimal comma and its own plural rule, and the copy stays in the
bundles.

It rounds to one decimal and picks singular or plural from the *rounded* value,
so "1 mile" and "1.1 miles" can never disagree with the number beside them.
Below a tenth of a mile it says "Less than 0.1 miles": a straight-line GPS
distance cannot tell one storefront from the next, and a card that claims
"0.03 miles" is claiming precision PAM does not have. A distance that is NaN,
infinite or negative returns `null` — the chip is omitted. No distance is better
than a wrong one.

The bug that prompted this: `(2 + 1) * 0.6` is `1.7999999999999998` in IEEE 754,
and the demo interpolated it straight into `{count} miles`. Will read it on a
card. A regression test now pins that exact expression.

### D-044 — PAM does not say a place is open until it knows the hours
The demo cards carried a hard-coded "Open now" chip. Will checked one against
Google, which said closed. Nothing in PAM knew either way: all 525 imported
DBHIDS providers have `hours = null`, which is the whole reason the Hours action
sends people to the Google listing (D-032).

`isOpenNow` is now documented as derivable only from real hours, and the demo
passes nothing. The card sits next to a Google link, so a wrong "Open now" sends
someone across town to a locked door — the worst failure mode this product has.
Populating hours needs a Google Places key, which is still a needs-a-human item.

The sample cards were also renamed to "Example Learning Center" and the like,
and the section is labelled as sample data. The previous names were plausible
enough that the first reviewer went looking for them in Google Maps — reasonably,
since the card offers exactly that link.

### D-045 — An import adds no condition label of its own
The DBHIDS ingest was writing `subcategory = 'health_counseling'` on all 525
rows. §0 draws a careful line and 0017 already sat on it: a provider's own name
is theirs and is shown as it is, because a member has to be able to find the
door. But `subcategory` is **PAM's** word. Applying a health label to every
imported row is PAM saying out loud why somebody is at a place.

The feed gives no honest basis for one anyway. The only field that would
distinguish these rows is `service_type`, which is exactly the column withheld
from client roles because every one of its values discloses. So imported rows
now carry no subcategory. `category = 'family_services'` stays — it is neutral,
and it is what colours the pin.

A database invariant fails the build if any `city_import` row has a subcategory.
It has to be reintroduced by a human with a real reason, one row at a time.

### D-046 — The review queue guards PAM's words, not the city's facts
Every imported row was flagged `needs_review`, and the public-catalogue policy
hides flagged rows, so the catalogue was empty to every member — 525 real places
that nobody could see.

§5.2 is about not putting an unapproved plain-language rewrite in front of a
member. These rows contain no PAM-authored prose at all: no description, no
eligibility, no enrolment steps. With the invented subcategory gone (D-045)
there is nothing in them awaiting anyone's approval — a name, an address, a
point on a map, and a neutral category, all straight from the city.

So the flag is cleared for exactly those rows, and a trigger raises it again the
moment any plain-language column is written, whoever writes it and whether or
not they remember to. Clearing it stays a deliberate act: an admin approving
words.

What a member gets is thin and true — a real place, how far it is, how to get
there, a link to its Google listing for hours. The description arrives with the
Phase 1 rewrite step, and `needs_review` will be doing its real job then.

### D-047 — One RPC, `security invoker`, is how the app reads the catalogue
`services_near(lat, lon, category, limit, max_meters)` is the only query the
places screen makes.

It is a function rather than a PostgREST filter because distance is the whole
point and `geo` is a geography column: a browser cannot sort by proximity
without either PostGIS or downloading the table. `p_limit` is clamped to 50 so
it is not a bulk export either.

It is `security invoker`, which matters more than the convenience. RLS decides
what comes back — the same policy set that was penetration-tested — so the app
cannot widen its own access by asking differently, and a future signed-in
version of this screen needs no second code path. It returns metres and lets the
caller format them (D-043), and it returns `has_hours` as a boolean rather than
the hours themselves, so a screen can tell that it must fall back to Google
without ever being handed something it might render as an open/closed claim
(D-044).

### D-048 — CI builds against a stub Supabase URL, not the real project
The browser checks stub the RPC response, so the client only has to construct.
Pointing CI at the live database would make the suite depend on a network and a
key, and would tell us nothing the stub does not — while making a red build the
normal state whenever the project sleeps.

The two `NEXT_PUBLIC_` values in CI are therefore deliberate nonsense. What is
being tested is the screen's contract with a payload, and the payload in the
spec is the exact one the live RPC returned as the `anon` role.

### D-049 — The allow-list is the import
`City_Facilities_pub` is 3,197 rows and almost none of them are services:
playgrounds, statues, salt sheds, fuel pumps, police stations, and `Detention
Center Adult`. A source that broad cannot be imported and then filtered in the
UI — one missed filter and a product built for people leaving prison shows
somebody a prison.

So `city_facility_map` names the seven facility types PAM is willing to call a
service, and anything not in it is skipped at import. It is a table rather than
a `CASE` for two reasons: adding a type is then a migration a human can read and
argue with, and the whole set is reviewable in one query. A database invariant
asserts a detention centre never becomes a place.

What is in it: Free Library branches (regional and specialized included), which
are the entire Education category on day one — free, walk-in, no enrolment, and
the best answer PAM has to "I need a GED, a computer, or to apply for a job and
I have no money"; city health centres; and staffed recreation and older adult
centres, as distinct from the playground equipment and basketball courts that
make up most of this layer's "recreation".

### D-050 — Directions are built from the point, not from the address
`The Rosenbach Museum & Library` imported with geometry on Delancey Street,
which is right, and an `asset_addr` of "3001 E Allegheny Ave", which is five
miles away. The city keeps its geometry current and lets the address text rot,
and nothing in the row says which to believe.

PAM was building the Go link from the address, so a row like that walks somebody
across the city to a building that is not there. That is worse than a blank
screen, because the person acts on it.

`destination=lat,lng` routes to the point. It also means the directions and the
map pin cannot disagree, since both read the same column — the same "one source
of truth" rule already applied to category colour. The address stays for the
Google listing *search*, where being wrong costs a worse search result rather
than a wasted journey, and remains the fallback for a place with no geometry.

### D-051 — All three category filters are always shown, including empty ones
Workforce has no places. The filter still offers it, and a member who taps it
gets the "nothing here" notice explaining why rather than a button that was
never there. A control that appears and disappears with the data teaches nobody
anything, and §0 already requires that an empty result explain itself.

### D-052 — Libraries only, from the city facilities layer
Will's call, and the right one. 205 recreation centres and 8 older adult centres
under "Home and family" crowded out the things somebody leaving prison is
actually looking for — food, housing, ID, legal help — none of which PAM has
yet. A category that is nine-tenths rec centres teaches a member that the
category is not worth opening.

The allow-list table and the ingest are unchanged; only the rows in the table
went. Re-adding a facility type is one INSERT, and the machinery around it —
the exclusions, the dedupe, the tests — is what took the work.

### D-053 — OIC Philadelphia is curated, not imported, and gets a row per programme
Will named the source. It is one nonprofit's website, not a feed, so the entry
is `source = 'manual'` and every fact was read off the organisation's own pages,
including the schema.org `LocalBusiness` block that carries its phone number and
opening hours.

Six rows at one address is not duplication. A member scanning "Work and money"
is choosing between culinary and IT, not between buildings, and the card shows a
name — so a single "OIC Philadelphia" row would hide the only thing that helps
somebody choose.

Subcategories *are* set here, which 0022 refused to do. That is not a
contradiction of D-045: the rule forbids PAM inventing a label the source cannot
support, and here the organisation names its own programmes.

This also brings the first opening hours into the database. The shape is
documented in the migration. It still licenses no "Open now" chip (D-044) —
evaluating one needs the member's timezone and a holiday calendar, and being
wrong sends somebody to a locked door.

"OIC Reentry Support Services" carries the organisation's own name for its
programme, so the 0017 trigger flags it as disclosing. That is correct and
nothing overrides it: the name is shown, because a member has to be able to ask
for the right programme at the desk, and it never goes into an SMS (§9).

### D-054 — The area picker asks the city, and PAM remembers nothing
Two layers. The ZIP codes live in `public.areas` and always answer — they need
no network beyond Supabase, and a ZIP is the one location a person can type from
memory, which is what §10's onboarding step already asks for. A street address
is looked up live against the City of Philadelphia's public property API, which
needs no key and sends `access-control-allow-origin: *`, so the browser asks it
directly.

Two things follow, and both are deliberate:

**PAM never sees the typed address.** It goes to the city's public address list
and nowhere else — not to PAM's server, not into a log, not into a table. Where
somebody is staying is exactly the fact this audience has the most reason to
guard, and the safest way to hold it is not to. The chosen area is kept in
`localStorage` on that device. A database invariant asserts `areas` has not
grown a column naming a person.

**The address lookup is an enhancement, never a dependency.** If the city API is
slow, blocked or offline, the ZIP list still answers and the screen says nothing
about the failure, because there is nothing a member could do with that.

The centroid of a ZIP is the mean of the city's own property points in it, not
the centre of its polygon: it is where people live, which is the right centre
for "what is near me".

### D-055 — The area is the button
Closed, the picker is a button labelled "Showing places near City Hall", with a
short "Change" beside it. The area itself is the control, so a member can see
that it is theirs to set without reading anything.

Open, it is a text input and a list of ordinary buttons — not a combobox widget.
This has to work with a screen reader, with a thumb, and at 200% text (§12), and
every one of those is easier to get right with real buttons than with a custom
listbox. The list is populated before anything is typed, so somebody who does
not know what to enter is not left staring at an empty box.

### D-056 — Rec centres come back, from the department's own list
0022 imported rec centres from the City Facilities asset register and 0024 threw
them out, because that layer counts basketball courts and playground equipment
as "recreation" and 205 rows arrived with most of them not being places with
anyone in them.

Parks & Recreation publishes its own list of *program sites*: 168 points, 157
staffed recreation centres, 6 older adult centres, 3 environmental education
centres, 2 pools. That is the thing a member can walk into, and it is what the
department's own locations page is built on.

Pools are left out of the allow-list: two seasonal outdoor pools are not
something to plan around, and PAM has no way to say "closed until June".

### D-057 — An address is only borrowed when the match is safe to believe
The program sites carry no address; the properties layer does. Matching them by
name gets 87 of 168, because the two layers punctuate differently — "Joseph F
Vogt Playground" against "Joseph F. Vogt Playground".

So the match is spatial with a name check as the guard: nearest property
centroid within 400m, accepted only if the names agree once punctuation is
stripped, or the centroid is within 60m. 161 of 168 get an address.

The guard is the point. Without it "Wissinoming Park" matches the centroid of
Margaret Tartaglione Park 102m away and inherits its address — and an address on
a card is something a person acts on. The 7 sites that fail the guard get no
address at all: directions come from the point (D-050), so they still work, and
the Google lookup falls back to the name, which is a worse search rather than a
wrong journey.

### D-058 — Three more words that give somebody away
The disclosure list in 0017 was drawn entirely from behavioural health
providers. Two new sources bring names that clear it and disclose just as badly:
"Juvenile Justice Center", "Support for incarcerated parents", "Get help with
domestic violence".

The last is the sharpest. A notification naming a domestic violence service can
reach the person somebody is trying to get away from — that is a safety
question, not a privacy one. `juvenile`, `incarcerat` and `domestic violence`
are added; plain `justice` is left out, because it would catch Justice Bell Park
and every civic building.

Every row already in the catalogue is re-flagged, not left at whatever the rule
said when it arrived.

### D-059 — DHS gave six places and a gap worth naming
The Department of Human Services' "For families" page is mostly citywide
programmes with no address: housing help, parenting classes, support for
incarcerated parents, domestic violence help. PAM's model is "a place you can
walk into", so those cannot be cards without pretending they are somewhere, and
attaching them to a department office would send somebody to the wrong building.

What is place-based is the six Community Evening Resource Centers — one per part
of the city, open in the evening as an alternative to a young person being taken
into custody. For a parent who has just come home that is the difference between
a phone call at 10pm and a court date. They are entered by hand with their
addresses and phone numbers.

The gap is now the most valuable thing PAM could build next: a way to list a
service that is not a place. It is written up in STATUS rather than worked
around.

### D-060 — OIC is verified, with no admin to sign it
Will verified OIC Philadelphia, so `verified` is true and the badge shows.
`verified_by` stays null: there is still no admin account to point at, and
inventing a profile id to fill the column would make the audit trail worse
rather than better. The timestamp and the migration are the record.

### D-061 — The SMS review is a page, not a pull request
The twelve message drafts are the one thing in this project that cannot ship
without a person, and the person is not a developer. Asking Will to read
`sms-templates.ts` would have made the sign-off harder than the thing it gates.

The review sheet renders each message the way it actually arrives — as a
notification on a lock screen, in both languages — because that is the whole
safety argument: assume somebody else is holding the phone. It lives at
https://claude.ai/code/artifact/f1dfb8d4-f64d-47c4-97d3-6a67f4c0eb09 and is
pinned. Do not rebuild it; update it in place if the copy changes.

Reading the drafts back for that page found one defect worth recording here, in
case the page is ever lost: the Spanish copy drops accents to stay inside the
cheaper GSM-7 encoding, which is right for `codigo` and `pagina` — but **ñ is in
the GSM-7 basic set and costs nothing**, so `manana` in `appointment_24h` is a
misspelling with no upside, in the message a member is most likely to act on.
Two open questions are Will's: whether the Spanish check-in should accept SÍ/NO
rather than the English YES/NO the parser listens for, and whether a case
manager's first name belongs in a text at all.

### D-062 — A facilitation text names the person, not the role
Will's call, from the review sheet. When an admin introduces a member to a
programme, the text says "Katherine connected you with a program that can help"
rather than "Someone connected you...".

The argument against was that a first name is the one place a message hints
somebody official is involved. The argument for, which won: a text from a
stranger about a programme reads like spam, and a member who cannot tell whether
to trust it does not tap. A first name is also the least identifying thing the
sender has — never a title, never a surname, never the agency, all of which stay
forbidden by the §9 word list.

So the draft stands as written. What this decision really fixes is that it
cannot drift: "Katherine" is a variable, and the code that fills it must pass a
first name and nothing else.

### D-063 — Spanish stays in the cheap encoding, and a test holds the line
One character outside GSM-7 halves an SMS from 160 characters to 70 and splits
it into two — a doubled bill on every reminder, which on a pilot budget is the
difference between reminding everybody and reminding half of them. That is why
the Spanish copy reads `codigo` and `pagina`.

`ñ` is the exception: it is *in* the GSM-7 basic set, so it costs nothing, and
`manana` was simply a misspelling in the message a member is most likely to act
on. Fixed.

`isGsm7()` and a test over every template now hold the line, because the obvious
next contribution to this file is somebody helpfully restoring the other
accents.

### D-064 — The Spanish check-in keeps the English YES and NO
`attendance_check` asks "Pudo ir hoy? Responda YES or NO." Those two words are
what the reply parser matches. Accepting SÍ as well is a better message and a
change in two places at once — and `SÍ` is outside GSM-7, so it also costs.
Will's call: keep YES/NO for the pilot. A test asserts the copy and the parser
agree, so they cannot drift apart silently.

### D-065 — The case manager screen does two things, and the invite code is the product
`/admin` shows a caseload and makes an invite. Everything else an admin can do —
turning a feature off, pausing an account, making an introduction — hangs off a
single member, and belongs on a member's own screen rather than as controls
scattered across a list.

The invite code is set at 40px, which a test asserts. It is read down a phone
line or written on a card; that is also why its alphabet drops 0/O, 1/I/L, 2/Z,
5/S and 8/B. "Legible across a room" is the requirement, and a stylesheet edit
could quietly undo it.

The §4.1 transparency contract is on this page, in the same words members agree
to at onboarding. A promise only the person taking it on faith can see is a
weaker promise. A test reads the member cards for the two things §4.1 forbids,
which is what would catch a careless `select('*')`.

### D-066 — Plain supabase-js, not the SSR client
The app was built on `@supabase/ssr`'s browser client, which keeps the session
in a cookie so a server can read it. PAM has no server: it is a static export,
wrapped by Capacitor into an app served from a local file scheme where cookie
behaviour is a coin toss.

A session that quietly fails to persist signs somebody out mid-enrolment, which
is the exact failure §12's 90-day rule exists to prevent. `supabase-js` with
localStorage is the store that works in a browser and in the shell.

It surfaced from the test side: a browser test could not seed a session at all,
because the client was looking somewhere the test had not thought to put one.
That is worth remembering — the awkward test was describing a real defect.

### D-067 — Amendments to the SOP are recorded, not absorbed
The build SOP came as a document rather than a file, so there was nowhere to
write a change to it down. `docs/sop-amendments.md` is that place, and it exists
because the SOP's rules are load-bearing: several are enforced by tests, and a
new requirement that quietly reverses one is how a safety property disappears
without anybody deciding to remove it.

Each amendment names the section it touches and says whether it **contradicts**
the original. Two of the first four do.

### D-068 — Two of the new admin requirements are not built, deliberately
Will asked for four things: a super admin role, role pills at sign-up, a full
database view, and program admin chat. Two are straightforward and two are not.

**Role pills at sign-up contradict §10 step 6** — "role is set by invite type and
never self-selected" — which is the rule that stops a stranger signing up as a
parole officer and watching returning citizens. Member and program admin are
safe to self-select; supervising admin is not, and super admin is not listed at
all (Will's own instruction). Built as proposed in A2, this works. Built
literally, it does not. It needs his confirmation in writing rather than my
inference from a sentence.

**"View the full database" is in tension with the transparency contract.** PAM
tells members, in the app, that the person who invited them cannot read their
messages or their buddy posts. A super admin with unrestricted access can. The
recommendation is a super admin who sees everything except those two things,
enforced in the database — the promise stays literally true and nothing
operational is lost. The alternative is full access with the transparency screen
rewritten to say so, before it ships. What is not an option is full access with
the screen unchanged.

Neither is a refusal. Both are decisions whose cost lands on people with very
little margin, and they should be made on purpose.

### D-069 — Case managers and program managers register themselves; members and super admins do not
Will's decision, made after the concern was put to him twice.

| Role | By invite | Creates their own account |
|---|---|---|
| member | yes, from their case manager | no |
| program manager | yes | yes |
| case manager | yes | yes |
| super admin | only from an existing super admin | no |

This reverses §10 step 6 and the reversal is recorded in
`docs/sop-amendments.md` A2, because the next person to read the SOP should not
assume a rule that is gone.

**One role, not two.** An earlier draft of this entry invented a "supervising
admin" separate from a case manager. There is one account type for whoever
oversees a returning citizen, whatever their job title, and it is called case
manager — the phrase a member recognises and the one the app's copy already
uses.

What makes self-registration survivable is not the sign-up screen, it is two
things already in the database that must now be treated as load-bearing rather
than incidental: a case manager's caseload comes only from people who redeemed
*their* invite, so a new account sees nobody and cannot go looking; and the
member is shown who invited them, by name, before they accept.

One addition is not optional. A self-registered case manager is **unverified**
until a super admin verifies them, and the member deciding whether to redeem is
shown that — the same pattern already used for organisations (§6.4). It costs a
genuine case manager a badge and nothing else. It is the difference between
somebody saying they are a case manager and PAM saying so, and the person
carrying the cost of that difference is the one with the least room to absorb
it.

### D-070 — A status chip names what is switched off
"Some things turned off" is the member's wording. On a caseload it answers
nothing an admin can act on: off how, which, since when? The chip now names the
features from the access rows themselves, and becomes a count past two, where
names stop fitting and the detail belongs on the member's own screen.

The general rule this is an instance of: member-facing copy is written to spare
somebody, and admin-facing copy is written so somebody can act. Reusing one for
the other reads as tidy and loses the thing the screen exists for.

### D-071 — Anyone can flag a place, and it hides before anybody reviews it
Will's design. PAM's catalogue is 800 places scraped from city feeds that go
stale quietly: a programme closes, a building changes hands, and the feed keeps
listing it for a year. The people who find out first are the ones who walked
there — a member, a program manager, a case manager — so any of them can flag a
place, and the flag hides it **immediately**, before a super admin looks at it.

That asymmetry is the decision. Hiding a live place for a few days costs
somebody one wasted search. Leaving a closed one up costs somebody a bus fare,
an afternoon, and some of the small amount of faith they have left in being told
the truth. The queue runs in the direction of the cheaper mistake.

A super admin then keeps it or removes it, and both are recorded with a note.

### D-072 — "Remove from the database" is a column, not a DELETE
Will asked for removal to mean gone. It does, and the mechanism is `removed_at`
rather than `delete from services`, for two reasons that would each break the
feature:

1. **`enrollments.service_id` cascades.** Deleting a service erases the record
   that somebody signed up for it. That is their history, not ours to drop.
2. **The importers upsert on `(source, source_ref)`.** A deleted row returns on
   the next import run and the super admin's decision is silently undone.
   `removed_at` is a decision the importer cannot overwrite — there is a test
   that runs an import against a removed row and checks it stays removed.

A hard delete is still available to somebody with the service key who knows what
cascades. It is not a button in the product.

### D-073 — A super admin is a case manager with more, not a different role
`is_admin()` answers true for both, so not one of the 73 existing policies
changes meaning, and `is_super_admin()` is the new narrower question. A super
admin keeps a caseload; they are not a separate kind of person with a separate
copy of the app.

Adding the enum value and using it have to be separate migrations — Postgres
refuses to use a new enum value in the transaction that added it. That is why
0032 and 0033 are split, and the split is load-bearing rather than tidiness.

### D-074 — A case manager sees a message only when it is reported, and the database writes the quote
Will's choice, from three options put to him: not supervised chat, not
super-admin-only reading, but the narrow path the §4.1 contract already
promised — "a message only if someone says it is not safe".

It is the option that costs nothing in honesty, because the transparency screen
members agree to already says exactly this. Nothing had to be rewritten.

Most of it was already built, and built well: `messages` has **no admin policy
at all**, so a case manager cannot read that table under any circumstance, and
`reports.target_excerpt` is the single route by which message text ever reaches
one. The absence of a policy is what makes the promise true, rather than a
convention somebody could relax.

**What was missing was who writes the excerpt.** `reports_insert_reporter`
checked only that the reporter was the caller, so a member could file a report
against any message id with a `target_excerpt` they had typed themselves — words
the other person never wrote — and a case manager would read fabricated text as
the evidence. For this population that is not theoretical griefing: an
accusation with a quote attached, reviewed by somebody with power over you, is a
way to do real harm using the safety feature.

`report_message()` now copies the excerpt from the message row, checks the
caller is in the conversation, and refuses a report on your own message. The
direct insert route is closed for message reports. A report about a profile, a
place or a post carries no quote and is unchanged.

### D-075 — Delete looks like a delete and behaves like a column
Will's call on the super admin's button: present it as an ordinary delete —
confirm, gone, off the list — while the mechanism stays `removed_at` (D-072).
The two are not in tension. A person should not have to understand a soft-delete
to take a closed programme out of a catalogue; they should press Delete and have
it be gone. What the column buys is that it stays gone when the importer next
runs, and that somebody's enrolment history survives.

The one place the difference must show is a super admin's own view, which can
list removed places and put one back. A delete a person cannot undo is a worse
delete, not a purer one.

### D-076 — Removing a place texts the people who saved it, and never names it
Somebody saves a place because they mean to go there. When it is removed, the
member who saved it is the person the removal is actually about — and until now
they would have found out by walking there.

**The notice never names the place.** Will's call, and it is better and smaller
at once. Naming it adds nothing a member needs — they saved it, and the app
shows them which one when they open it — while making every message a disclosure
question. An earlier version of this had two templates, the second one nameless,
for the eleven places whose own names give somebody away (`name_may_disclose`,
0017 and 0028). Naming none of them deleted the branch, the flag lookup and the
risk together. The safest version of a message is the one that carries nothing
it does not need.

So the message says what is wrong and offers a way on:

> PAM: A place you saved is closed, so there is no need to go. Find others in PAM: …

**It never says the place was "not useful".** Will asked for that wording and I
did not write it, for reasons worth recording rather than quietly acting on: a
flag means somebody reported the place as gone, which is not a judgement of its
quality, and putting a verdict on an organisation into a member's messages
publishes something PAM has not checked and could not defend. Where that belongs
is the resolution note on the flag, which stays internal.

### D-077 — An outbox that carries a template key, never a body
`reminders` is bound to an appointment by a not-null foreign key and cannot
carry anything else, so `outbound_messages` is the general queue.

A queued row holds a template key and its variables — never rendered text. The
body is built at send time from a template with a human's name on it, so a row
sitting in the queue cannot carry words nobody signed off, and a copy change
reaches messages that are already queued. A test asserts the table has not grown
a `body` column.

Nothing dispatches yet: no SMS provider is configured. Rows queue and wait,
which is the right behaviour for messages that must not send until the copy is
reviewed.

### D-078 — Four reasons, chosen from a list, all the way to the message
Will: standardise the reasons and have the person pick one.

    closed          the place has shut
    moved           it is somewhere else now
    not_accepting   still there, not taking new people
    wrong_info      what PAM says about it is wrong

Free text was the wrong shape for all of it. The reason survives into a text
message, and §9 copy has to be reviewed and translated — nobody can review a
sentence a stranger will type next week. Four fixed keys can be written once,
translated once, and signed off once.

Three consequences worth keeping:

- **The phrases live in `@pam/config`, not the locale bundles.** They end up
  inside an SMS, so they are subject to every §9 gate and belong in the same
  review pass as the templates. A test checks each one is plain, lowercase,
  unpunctuated, inside GSM-7, and free of any word that judges the place.
- **The queue carries the key, never the phrase.** The dispatcher renders it in
  the member's own language at send time, so a wording change reaches messages
  that are already waiting, and a queued row can never hold words nobody signed
  off.
- **Spanish uses verb phrases, not adjectives.** "cerrado" has to agree with the
  gender of a noun the database does not know.

The free-text note stays, beside the reason, and stays internal: it goes to the
super admin deciding and never into a message.

### D-079 — The super admin can correct the reason before members are told
The flagger reports what they saw from the pavement; the super admin is the one
who checks. `resolve_service_flag` takes an optional reason that overrides the
flagger's, and that is the one members are told.

The alternative — texting the unverified claim — means PAM repeats an
accusation about an organisation to everybody who saved it, on the word of one
passer-by. The flag is a signal to look, not a finding.

### D-080 — A flag is routed to the people it is about, not broadcast
Will, this session: a flag has to reach the case manager too, not only the
super admin. But "notify every admin" turns a caseload notice into a staff-wide
bulletin about somebody's day, which is exactly what §4.1 exists to prevent. So
each of the two events has a named audience:

| What happened | Who hears about it |
| --- | --- |
| **A place is flagged** | every super admin — they decide whether it stays or goes — **and** the case managers of the members who saved it, because their person was planning to go there |
| **A message is reported** | every super admin **and** the case manager of the member the report is *about* — the sender of the reported message, not the person who reported it |

Two consequences worth keeping in mind:

- A case manager with nobody affected hears nothing. That is the feature. The
  audience is derived from `saved_places` for a place and from the message's
  sender for a report, so it is the relationship that decides, never a role
  list.
- The reporter is not notified as a reporter. Reporting is not a status, and a
  notice back to the reporter would tell the rest of the room who spoke up.

The notification itself carries a locale key and variables, never a sentence and
never a line of somebody's message (0038). A case manager who needs the words
reads them through the review screen, behind the sensitive-information warning
(D-074). A notification is a nudge to look, not a copy of the thing.

Routed by database triggers on `service_flags` and `reports` rather than by the
RPCs, so a second code path cannot quietly stop the notices.

### D-081 — The SMS copy is signed off, and the gate now points the other way
Will read all thirteen messages on 13 September 2026 and approved them, so
`reviewedBy` carries his name and the dispatcher will send once Twilio
credentials exist.

The tests that asserted "nothing is reviewed" were not deleted, they were
turned around: they now assert every template has a name, and a second test
blanks one deliberately to prove the refusal still works. A gate nothing
exercises is a gate nobody notices has broken.

What has not changed: **a new template starts empty**, and rewording an existing
one means asking again. An agent must never fill this field in on its own
authority — the field exists precisely because code cannot judge whether a
sentence is safe to send to somebody whose phone is shared.

### D-082 — A field is drawn as big as its touch target
Will: "the touch target is larger than the input field frame."

Astryx draws its largest text input at 36px. PAM's floor is a 48px target, which
the field met by extending the hit area past its own border — so the area you
could hit was larger than the area you could see. On a phone a person aims at
the drawing, and then believes they missed when they did not.

`TextField` in `@pam/ui` raises the frame to 56px and is used everywhere instead
of Astryx's `TextInput` directly. A browser test measures the drawn box rather
than the target, because the target was never the thing that was wrong.

### D-083 — The notification list is a bell, and one line per row
The first version was a full-width bar with a "Notifications" button and
two-line rows. Will: use a bell, make the rows smaller.

Both were right for a reason worth keeping: this is a list to *scan*, and the
first version was built at the size of the thing it sits next to — the caseload
— rather than at the size of its own job. The bell now sits in the header row
where somebody looks to find out whether anything needs them, and the panel
opens over the page instead of pushing the caseload down, so checking costs
nothing.

The count stays a word ("2 new") rather than a dot: it survives being read
aloud, and it does not depend on seeing a colour.

The glyph is PAM's own, because Astryx's registry has no bell and its `Icon`
takes a component for exactly this case. That is not a second icon system — the
drawing is handed to Astryx's `IconButton`, and colour and size come from the
theme.

### D-084 — The notification list is a screen, not a panel
Will: notifications need their own screen with a back button.

A panel is right for a glance and wrong for the job that follows. This is a list
somebody works through one item at a time, leaving to look at a person or a
place and coming back — and on a phone a panel covers the thing it is about and
closes if you breathe on it.

So the bell is a real link to `/notifications/`. That also buys three things a
panel cannot have: the list has an address, the browser's own Back works, and it
survives a dropped connection.

### D-085 — Reminders are a separate yes, and it starts as no
The carrier rejected PAM's campaign with 30925: "opt-in must be unchecked by
default; active consent required." That is a product problem, not a wording one,
and the rejection was correct.

Two kinds of message, two answers:

- **The sign-in code.** PAM has no passwords, so asking for a code is asking to
  be texted one. Nobody is surprised by it and nothing else works without it.
- **Reminders and notices.** They arrive days later, unprompted, on a phone
  somebody else may be holding. Wanting help finding a food pantry is not
  agreeing to be texted about it next Tuesday.

So the sign-in screen carries a tick box that starts unticked, `sms_enabled`
now defaults to false (0042), and a member who never ticks it gets every code
they ask for and nothing else. **Sign-in works either way** — which is the other
half of the rule (30923: consent cannot be required for service use), and is
what stops consent becoming a toll on getting help.

Anybody already in `notification_preferences` was switched off rather than
grandfathered in. They predate the box and never agreed to anything.

### D-086 — The reminders question is a screen, and only members are asked
Will: the sign-in screen was carrying too much, and not all of it applies to
everybody — a case manager or a program lead does not need reminders about
visits they are not making.

Both halves are right, and they point the same way. Sign-in went back to one
job: a number, a button, and the one line the code itself needs. The question
"may PAM text you about the things you plan?" moved to `/reminders/`, shown to a
**member** once, right after their first sign-in. Staff never meet it; they can
reach the same screen later if they want it.

The carrier requirement (30925: unticked by default, active consent) is met
better by the screen than by the box on the front door, because a screen has
room to say what is actually sent, how often, never at night, STOP, HELP and
rates — without any of it shrinking to fine print. That page is the screenshot
filed with the registration.

Three things this design gets that a checkbox on sign-in did not:

- **No row means nobody has asked yet**, which is not the same as a no. That is
  what lets the app show the screen exactly once.
- **"Not now" writes the decline.** A decision is never inferred from silence,
  and nobody is asked twice.
- **Sign-in still works either way**, which is the other half of the rule (30923:
  consent cannot be required for service use) and the thing PAM would want
  regardless: nobody should have to accept texts to get help.

### D-087 — The wordmark is two files, chosen by the browser
The real PAM mark arrived on 13 September as two SVGs: lime green for dark
grounds, deep green for light ones. Neither survives the other's background, so
picking one would have meant a mark that disappears for half the people using
it.

`<picture>` with a `prefers-color-scheme` source does the choosing. No
JavaScript, no flash of the wrong artwork on load, and only the `<img>` carries
the `alt`, so a screen reader says "PAM" once rather than once per file.

**Static files, not inlined SVG.** The two marks are 40 kB of path data between
them. As cached assets beside the page that is unremarkable; inside the
JavaScript bundle it would have eaten five times the headroom left under the
500 kB budget in §12. Coordinates were rounded to two decimals on the way in,
which took about 20% off without a visible difference on a 26px mark.

What this does not yet handle: an in-app theme toggle. `mode` on the Astryx
theme is "system" today, so the browser's scheme and the app's always agree.
When Settings gains a manual light/dark switch, this has to switch with it —
`<picture>` cannot see an app-level choice.

### D-088 — Consent is a button, not a box
The reminders screen had a tick box *and* a button. Will: the box is redundant —
drop it.

It was. A box beside a button is either missed (leaving somebody who wanted
reminders without them, which is the failure that matters) or ticked and then
confirmed, which is the same decision made twice. What earns its place is the
one control somebody actually presses.

So the screen offers two buttons, **Agree to receive texts** and **Not now**,
and the words being agreed to are on the control itself. For the carrier this
is stronger than the box, not weaker: 30925 asks for an unambiguous affirmative
act, and nothing on the screen can arrive pre-selected because nothing is
selectable. For a member it is one less thing to decode.

The ordering rule if both are somehow used: the button pressed is the answer.

### D-089 — The project is configured in code, not in a dashboard
Will: the Vercel/Supabase linking is too complicated. It was, and the complexity
bought nothing.

The Supabase URL, the publishable key and the public address are now checked in
at `apps/web/src/lib/project.ts`. **PAM needs no configuration to run.** Clone
and `pnpm dev` works. Connect the repo to Vercel and the deploy works. Wrap it
with Capacitor and the app works. An environment variable still overrides any of
them, for a staging project or a fork.

The failure this removes is the one that actually happened: those values are
compiled into the bundle at build time, they lived only in a gitignored
`.env.local`, and the first real deploy went out without them. The site looked
perfect and failed silently on the one screen every person starts on, with an
error message written to reassure a member rather than to diagnose anything.

**Why committing the key is safe, since it will look alarming in a public repo.**
The publishable key is designed to ship inside client JavaScript — it is already
in the bundle of every deployed copy, readable with View Source, as it is on
every Supabase project in the world. It grants nothing by itself: the access
rules in `packages/db` are the boundary, and `pnpm --filter @pam/db test` attacks
them with one test user per role. If publishing this key mattered, that suite
would be what was broken.

What must never join it: the service role key, which bypasses every policy, and
any Twilio credential. Those live in Edge Function secrets. `project.test.ts`
fails the build if something shaped like one appears in that file.

One link between the two services still has to be made by hand — the app's URL
in Supabase → Authentication → URL Configuration — because only Supabase can be
told which addresses it trusts.

### D-090 — Everybody is asked about texts, and the examples match the role
Will, after signing in as a super admin and not seeing the reminders screen:
staff are texted too. They are — an introduction to their programme, a change to
their account — and an account that was never asked has consent off, so the
dispatcher cancels those messages rather than sending them. Safe, silent, and a
feature that quietly does not work.

So the screen is shown to anybody who has never answered, and the examples
change with the role: a member sees visits and saved places, staff see
introductions and account changes. Showing a member's examples to a programme
lead would be asking somebody to agree to messages that never arrive, which
teaches people that a consent screen is noise.

### D-091 — The whole product is photographed, for looking at
PAM has four roles, and Twilio will text exactly one verified number until the
carrier registration clears — so "sign in as a program manager and look" is not
available, and will not be for weeks. Even afterwards, walking seven screens in
five states by hand is twenty minutes nobody spends before a copy change.

`node scripts/journeys.mjs` builds the app, photographs every screen for every
role in both themes against stubbed data, and writes `docs/journeys/index.html`
— 70 images, the whole product on one page.

It asserts nothing. `e2e/` does that, and the one failure this project has had
that mattered most (D-008, every component rendering unthemed) passed every
check it had and was caught by a screenshot. This exists for the thing no
assertion replaces.

The output is gitignored: 14 MB of PNGs regenerated on demand does not belong in
a public repository's history.

### D-092 — A field says what it is for, and the rest follows
Will: the phone field should offer the person's own number, and it should be
easy.

Getting a keypad and an autofill suggestion out of a browser takes four
attributes that have to agree — `type`, `autoComplete`, `inputMode` and a stable
`name` — and every one is easy to get subtly wrong in a way nobody notices until
somebody is typing their own number on a QWERTY keyboard with one thumb.

So `TextField` takes a `purpose` (`phone`, `code`, `address`, `name`) and sets
all four. A screen says what the field is; the design system decides how. Adding
a purpose fixes every screen that uses it, which is the property that makes this
a system rather than a folder of components.

`code` matters as much as `phone`: `autocomplete="one-time-code"` is what makes
iOS offer the code from Messages above the keyboard and Android fill it in — the
difference between one tap and leaving the app to memorise six digits.

`inputMode` is the one attribute Astryx deliberately omits from its props, and
`type="tel"` is outside its allowed set. Both reach the input through the same
spread as everything else, so the cast in that file is about the type
definition, not the behaviour.

### D-093 — The focus ring goes on the frame, not the input
The `<input>` is 48px tall inside a 56px frame, so focusing it drew a second
rectangle floating inside the first — and at the top of the sign-in screen that
ring collided with the label above it.

The ring is not weakened, only moved: same 3px, on the box a person can actually
see, following its corner radius. Done in `globals.css` so it is true of every
field in the app rather than of the one that was complained about, with a
browser test asserting the input has no ring and the frame does.

### D-094 — A repeated style block is a component nobody wrote yet
Five screens each declared `link: { minHeight: '48px', fontSize: '17px' }`, and
six declared their own page width and padding with the numbers slightly
different in each — 520 here, 560 there, 720 on the legal pages. Nobody notices
that on any one screen. Everybody notices the day the padding changes and one
screen does not follow.

The giveaway was the 48px: that is PAM's touch-target rule (§2.5), which should
be stated once and obeyed, not retyped by whoever writes the next screen.

So `Page` and `TextLink` now live in `@pam/ui`, with the measurements as tokens.
A screen says what it is, not how wide it is. `Page` keeps a `width` because two
kinds of screen legitimately differ — a form and a long legal document — and
that is a choice worth naming rather than a number worth copying.

### D-095 — The components have a page of their own
`/gallery/` renders every `@pam/ui` component in the states that matter,
including the ones nobody can navigate to: an empty list, a failure notice, a
disabled button, a person with no photo. Those are most of what somebody on a
bad connection actually sees.

It is photographed by `scripts/journeys.mjs` alongside the real screens, so a
component that changed shows up in the sheet next to the screens it would have
broken. Not linked from the app: a member has no reason to land there, and it is
a workbench rather than a secret.

### D-096 — The way in explains itself before it asks for anything
Sign-in used to open with a title and a field. Somebody arriving has been handed
a link by a case manager and has no idea what PAM is; the number is the first
thing asked and the last thing they should have to give on faith.

Three slides now sit above the card — a place to look, a person to ask, a
reminder so it does not get missed — one idea each, swipeable, with dots saying
there are three. Every slide's words are in the page whether or not anybody
swipes, so nothing about the explanation depends on a gesture.

Two attempts failed on a real phone before this one. A slide asking for `width:
100%` sizes itself against the flex item Astryx wraps it in, which has no width
of its own, so the sentence ran off the side of the screen; the region is now a
container and the slide is `100cqw`. Letting the next slide peek in at the edge
as the "there is more" signal cut a sentence mid-word, which reads as a
rendering fault rather than an invitation — hence dots.

### D-097 — No "Get help" on the way in
The second deliberate exception to §0's "every screen has a visible way to get
help", after `/reminders/` (A7). Will asked for it removed: between the slides
and the card it read as a fourth thing to decide before anybody had decided the
first.

The path it guarded is not closed. Every failure on that screen renders a notice
carrying PAM's number — which is where somebody stuck actually is — and help is
one tap away on every screen they reach next. A browser test asserts the link is
absent, so its return is a decision rather than a drift.

### D-098 — The home screen is a menu, and says nothing it does not know
`/` was the Phase 0 demo: every component rendered once against sample places, a
points counter wired to a `+100` button, and placeholder names chosen to be
unmistakably fake. It proved the foundation, and then stayed up long enough to be
the first thing a member would have seen.

What replaces it is a short menu — where to go, named in the member's own words,
with what is waiting shown as a readable count. It carries no next step, no
points and no plan, because PAM does not have real ones yet, and a home screen
that invents its own content is worse than a short one. Role decides the tiles:
a case manager's list starts with their people.

Every piece comes from `@pam/ui`, and the one thing the library did not have —
a whole-card link to somewhere else — was added to it as `NavTile` rather than
assembled on the page. A tile built on the page is a tile the next screen builds
again, slightly differently.

### D-099 — PAM's own colour is a token, not a hex
**Superseded by D-101 the same day.** The token was the right instinct and the
wrong home: the brand belongs in the Astryx theme, where every component reads
it, not in PAM's own sizing tokens where only the components that remembered to
look would. `pam.brandMark` no longer exists.

The wordmark is deep green on light grounds and coral on dark ones, and the
onboarding illustrations are drawn in the same pair. That pair now lives once,
as `pam.brandMark`, beside the sizing floor.

It is deliberately not an Astryx theme colour. The theme carries accent, text and
surface — the roles a component reasons about — and this is artwork. What it
needs is to move in one edit the day the brand does.

### D-100 — The buttons wear the logo, in a real theme
PAM's primary buttons were the neutral theme's near-black in light and
near-white in dark, because that is what "accent" meant. The mark is deep green
(`#0F5847`) on light grounds and the bright green Will supplied (`#DCE068`) on
dark ones, and the buttons are now the same two colours.

Done as an Astryx theme (`apps/web/src/theme/pam.theme.ts`), not as CSS
overrides, so every component that reads the accent follows — badges, links,
focus rings, the icons on the home tiles — rather than buttons alone.

The two greens are not a light/dark pair of one hue and were never meant to be:
one is a deep ground carrying white text, the other a bright fill carrying
near-black. That inversion is why every state is named per mode rather than left
to a generic tint. Measured, worst case 7.1:1, against a 4.5 floor.

**The states are set on the overlay tokens, not on `background-color`.** Astryx
paints hover and pressed as a translucent layer over the fill, so a theme's
`:hover { backgroundColor }` loses silently — the first version looked correct
in review and did nothing at all.

**The source is `pam.theme.ts`, not `pam.ts`.** With both present, an import of
`./pam.js` resolves to the TypeScript source and drags the theme compiler into
the browser bundle: 4 kB of §12's budget spent on a build tool.

### D-101 — The brand lives in one place, and it is the theme
`pam.brandMark` (D-099) lasted a day. Once the theme carried the greens, a
second definition in `@pam/ui`'s tokens was a copy that would drift the first
time one of them moved. Components use `--color-accent` and
`--color-icon-accent`.

Still true, and the reason D-099 existed: the wordmark artwork is not a theme
colour. It is two SVG files, picked by `prefers-color-scheme`, and it is the one
place PAM's colour is a picture rather than a role.

### D-102 — Saving a place writes it down
`saved_places` existed from 0003 and nothing ever wrote to it: Save changed the
button's own label and forgot by the next screen. That is fine in a demo and a
betrayal to somebody standing at a bus stop trying to remember an address.

The write is optimistic and rolls back on failure. A tap that waits 800ms on a
bad connection is a tap somebody repeats, and a card that says "Saved" when the
row never landed is worse than one that visibly failed.

`saved_places_mine()` (0044) returns the same columns as `services_near`, so one
card component reads both. A plain select could not: `services.geo` is a
geography column, and a card builds its directions link from the point.

### D-103 — One way back, beside the title
The back arrow had been landing wherever each screen felt like putting it — top
left on notifications, at the foot of the page on Places and the caseload,
nowhere at all on several. `PageTitle` owns it now, and it is a real link rather
than `history.back()`: it survives a cold open from a text message, where there
is no history to go back through.

It goes home rather than to whichever screen opened this one. A member, a case
manager and a super admin all reach the notifications list, and home is the one
place all three of them can carry on from.

The mark in the header is also a link home — except on the way in, where there
is nowhere to go and the 48px target a link needs costs 22px of the height the
consent sentence is fighting for.

### D-104 — Animation is separately budgeted, and optional
Framer Motion is behind a dynamic import (`motion-runtime.tsx` is the only
module that imports it), so it is a chunk of its own that is never part of the
first load. The budget check measures it against its own 40 kB ceiling and fails
the build if it ever leaks into the app's bundle.

It is fetched only when the connection can carry it: no Data Saver, better than
2G. On a $40 prepaid plan, 37 kB of easing curves is not a trade PAM gets to
make on somebody's behalf — and a member who never gets it loses nothing but
motion.

**The page fade and the button press are CSS, deliberately.** Both wrap things a
member may be touching, and swapping the wrapper when the chunk lands remounts
them — a tap in that window hits a node being replaced and does nothing. A
dropped tap on the one button somebody came to press is not worth 120ms of
scale. What is left for the library wraps cards and list rows, where a swap is
invisible.

### D-105 — The §12 budget counts what a phone downloads
The check was counting Next's legacy polyfill chunk, which carries `noModule` —
every browser that can run PAM (the design system needs `light-dark()` and
container queries) skips it entirely. That was 38 kB of the 500 kB budget spent
on bytes no member has ever received.

Not a loophole: the budget exists to protect a member on a throttled connection,
and it now measures what that member actually fetches.

### D-106 — A super admin has a screen, and it is a function not a policy
The role existed from 0032 with nowhere to go: `admin_covers()` requires
`is_admin()`, which is `role = 'admin'` exactly, so the person operating PAM
opened the case manager screen and was told it was not for them.

`/directory/` is that screen. The access behind it is `directory_people()`
(0043) rather than a policy, because a policy widening `profiles` for super
admins widens every query in the product at once, forever. This widens one call
with a fixed column list: name, role, region, status, last active — the same
five facts the caseload already shows. No phone, no goals, no messages.

The guard is inside the function: PostgREST exposes everything in `public`, so a
member or case manager calling it directly gets zero rows rather than an error,
and there is nothing to probe. The database suite proves both refusals and that
the phone column cannot come back.

**Open for Will:** the transparency screen tells a member what the person who
invited them can see and says "if this changes, we will tell you first". It says
nothing about the PAM team. A directory of accounts does not contradict it, but
it sits close enough to deserve a line.

### D-107 — Five points for keeping a place, awarded by the database
`POINTS_RULES.save_place` had said `{ points: 5, verification: 'automatic' }`
since the config was written and nothing implemented it. A trigger on
`saved_places` does (0045), not the browser: a client that can award itself
points is a score nobody can believe, and §8's premise is that points mean
something.

Once per place, forever — `subject_id` plus a unique index closes the
save/unsave/save farm. Unsaving does not take the points back: the ledger is
append-only by design, and clawing back points somebody earned for a real thing
they did teaches them the app is playing games with them. Staff earn nothing;
points are a member mechanic.

`subject_id` is deliberately not a foreign key. The ledger is history, and a
place leaving the catalogue does not make it untrue that somebody once saved it.

### D-108 — A super admin can switch the view, and it changes only the view
One codebase serves four very different screens, and the person running PAM had
only ever seen one of them. The role chip in the header is now a switcher.

**It changes what is drawn and nothing else.** Every query still runs as the
signed-in person, under the same row-level rules; the database does not know the
setting exists. The chip reads "Viewing as Member" while it is switched and the
screen carries a notice saying it is still their own account. A browser test
asserts every id asked for is their own — the day that stops being true, this
has become impersonation, which is a different product and one that would have
to be argued in front of the people it is about.

Kept in `sessionStorage`, not the URL: a shared link should never put somebody
in a view they did not choose.

### D-109 — Badge names come from the village, not the gym
Returned, Rooted, Builder, Provider, Pillar, Elder, Chief — then the category
pairs (Scholar/Griot, Craftsman/Cornerstone, Anchor/Steward) and the one-offs.
Will's names, and they are the decision: the vocabulary a system uses about
somebody becomes the vocabulary they use about themselves, and for a returning
citizen that is not a small thing.

Two specifics worth keeping. **Sankofa** — the Akan symbol for going back to
fetch what was left — names a return after a gap, so a lapse reads as coming
back rather than failing; for this population that distinction is the difference
between opening the app again and not. **Steward**, not Patriarch: not every
member is a man, and Steward says the same thing about somebody holding a
household together.

Elder, Chief and Drum carry `blockedBy` and show "Coming later" on the screen:
they need a buddy system PAM does not have — member/mentor and member/case
manager are the only relationships modelled. Defined now because the names are
the decision; hidden badges appear from nowhere the day they ship.

### D-110 — Two tiles came off the home screen
Notifications is the bell in the header, now a filled button rather than an
outline: it is the only route to the things that need somebody, and a menu that
offers the same destination twice is a menu arguing with itself. Text reminders
belongs to signing up — it is asked once, and a permanent tile invites somebody
to re-answer a decision already made.

### D-111 — What a person may change about themselves is a grant, not a policy
`profiles_update_self` checked `id = auth.uid()` and nothing else, and `role` is
an ordinary column, so any signed-in account could write itself `super_admin`.
RLS chooses rows; it cannot choose columns. So the fix is column-level
privilege: UPDATE is revoked table-wide from `anon` and `authenticated`, and
comes back as a named list of the fourteen columns a person actually owns.
Declarative, and it holds for code paths nobody has written yet.

The order is the trap. A table-wide grant covers every column and a column-level
REVOKE cannot carve a hole in one — the first version of 0046 applied cleanly
and the promotion still worked. Revoke the table grant first.

`security definer` functions are unaffected, which is the point: role changes
belong to `redeem_invite`, to the admin RPCs that write `audit_log`, and to
`start_membership`, whose role is a literal with no parameter to pass.

### D-112 — A staff role is a claim, not a choice
"Someone willing to help" and "Parole Officer or Case Manager" write a row in
`staff_requests` and create no account. Those roles read other people's
information; a claim typed into a form is not a credential, and the alternative
is a sign-up screen that hands out the ability to see members to anybody who
picks the third radio button. A human verifies and sends an invite.

### D-113 — Sign-up is one route with a bar across the top
`/join/` holds all five steps rather than five routes, so the progress bar is
one component's state rather than a number each screen has to know about itself,
and a step can be added without renumbering anything. `/signin/` stays its own
door for people who already have an account, and both render the same
`PhoneSignInCard` — the consent sentence on it is what the carriers reviewed,
and two copies of it would drift.

The bar is not decoration: somebody deciding whether they have time for this
needs a number, and the honest number here is small.

### D-114 — The first points are awarded by the database
25 for finishing setup, from a trigger on `onboarded_at` (0047), once ever. The
client writes the fact that setup finished; the database decides what it is
worth. Same reasoning as D-107, and it matters more here: the first number a
member ever sees is the worst one to have made up.

### D-115 — One account screen, one way out, in the same corner everywhere
`/account/` is the only place that signs anybody out, and every signed-in
screen carries the same button to it at the end of the header. Not a link at
the foot of one screen (which is what there was, on the case manager's screen
only) and not a menu: a person on a borrowed phone needs to find the way out
without knowing the app, and the way to make that true is to put it in the
same place on every screen and nowhere else. Sign-out lands on the sign-in
screen and says so — a sign-out that reloads the current page shows a
signed-out version of it and leaves somebody wondering whether anything
happened.

### D-116 — Four kinds of people, four doors, and nobody picks their own role
member: self-serve, or a case manager's code. provider: asks at sign-up, then a
code. admin: a code only a super admin can make, into a named city. super
admin: the seeding script. The line that holds across all four is that a role
which can see other people's rows is handed out by a person who is answerable
for it, and the invite carries the role. A super admin's member invite lands
on nobody's caseload, because a super admin has none — a case manager picks
them up from the directory. Nobody is invited to run PAM.

### D-117 — The invite code is optional, and it replaces the question
Step 2 has a code field above the three "which one fits you" sentences, and
the sentences disappear the moment the field has anything in it. A person with
a code was told what they are by whoever gave it to them; asking again invites
a contradiction the screen cannot resolve. `/join/?code=` prefills it so a
code can travel as a link.

### D-118 — Thirty seconds between codes, counted on the screen
The live logs show what happens without it: three requests in eight minutes,
no sign-in. Verification services rate-limit on their side, silently; the
screen says "Send it again in 24s" so the person is told to wait rather than
quietly refused. Enforced in the hook, not just disabled on the link, so a
second tap during the wait does nothing at all.

### D-119 — Waiting is a spinner, not a sentence
Every screen said "Finding places nearby..." while it worked out who was signed
in, including the ones that were not finding places. Moving between tabs is a
full page load in a static export, so that was the sentence on the way to the
account screen, the saved list and the caseload (Will, 16 September).

A spinner says the one true thing — something is happening — in every language
and at every reading level, which is the reason to prefer it here over copy that
has to be right four different ways. §2.4's plain-language rule is about
explaining, and this state has nothing to explain: it resolves in under a
second or it becomes an error notice that does explain.

The label is announced and never drawn, and the help bar stays on the home
screen's waiting state: a screen with nothing on it but a ring is the dead end
§0 forbids, and this state is what a dying connection actually shows somebody.
Astryx's Spinner slows to a third of its speed under `prefers-reduced-motion`
rather than stopping — a still ring reads as a broken image, and the promise
made to somebody who asked for less motion was less, not none.

### D-120 — A place gets a screen of its own, and the card answers one question
The card carried Call, Go and Save, plus share and report behind a "⋯" in the
corner. That is five decisions per card and twenty in a screenful, all of them
about *how to get there* — a question nobody asks until they have chosen the
place. Will, 16 September: the card should show only what decides whether to
go.

So the card is name, distance, open or shut, one sentence, and Save. Everything
else moved to `/place/?id=…`, where the way there is the one primary action
(§2.5) and calling, the hours, the website, share and report are full-width
labelled rows. A corner menu is where a feature goes to be unused, and
reporting a place that has closed is the single most valuable thing a member
can tell PAM.

The whole card is the link, not a "More" affordance in the corner: a 48px
target on a 300px card is the one the member this app is for will miss. The
heading carries the real anchor and a pseudo-element on it covers the card, so
there is exactly one link in the accessibility tree, named for the place, with
Save layered above it. `/place/?id=…` is also shareable, which is the point of
it having an address at all — a case manager can text a member a place.

### D-121 — PAM says what a place does, in PAM's own words (supersedes part of 0017)
0017 said PAM adds no words of its own to a provider's listing, and D-045 said
an import invents no label. Both were about not putting a condition on somebody
else's name. But 754 places reached members as a name and an address, and "J J
Peters" tells a member nothing — the neutrality rule was protecting providers
by failing members.

Put to Will as the one blocking product decision of the session, with the
behavioural-health places named as the hard case. His answer: **say what it
does, everywhere.** 0050 writes `description_plain` for all 754, capped at 200
characters by a check constraint, sourced from the city's own service_type /
park_name / asset_name fields and, for the twelve hand-added places, from
published sources.

The SMS half of 0017 stands untouched: `name_may_disclose` still governs what
may go in a text, and a description may never be sent in one. A screen somebody
chose to open is not a message that arrives on a lock screen. Recorded as
amendment A11.

### D-122 — Opening hours are a stand-in behind one flag, and the screen says so
D-044 said PAM never claims a place is open, because it had no hours. That
still holds for real data — nothing invents an "Open now" out of nothing. But
Will asked for a demo that shows open and closed, with `enrich-places` deferred
until nearer kick-off, so `USE_PLACEHOLDER_HOURS` in `@pam/config/hours` is the
one line to flip when the real hours land.

`hoursFor()` returns real hours when the row has them and a deterministic
stand-in (four shapes, chosen by a hash of the id, so a place does not change
its hours between screens) when it does not, flagged `isReal: false`. Nothing
downstream can confuse the two: the detail screen prints "These are sample
hours while PAM checks the real ones. Call before you go." whenever the flag is
false, and an unknown answer is `unknown`, never `closed` — a place wrongly
called closed is a member who does not set off.

The clock is read once per screen and re-read every minute, and is null until
the browser runs: this is a static export, so anything derived from "now" at
build time is either wrong by months or a hydration mismatch.

`hours.ts` is deliberately **not** re-exported from `@pam/config`'s barrel.
Through the barrel it landed in the first load of every screen and cost the
last kilobyte of §12's budget.

### D-123 — Who may actually walk in is a badge, above everything else
Some places in the catalogue are inside a school, and the evening centres are
for 10 to 17 year olds. An adult who reads the description, works out the bus
and then finds a door that is not for them has been failed by the screen, not
by the place. 0050 adds `audience` (`students` or `youth`, constrained), and it
renders as a badge — above the phone number on the detail screen, and on the
card — because somebody scanning a list does not read sentences (Will, 16
September). Will: "Mark if inside a school", then "Make it visible to users".

A new column on `services` is invisible until it is named in the column-level
GRANT 0016 introduced. That is the trap this schema sets, and 0050 grants
`audience` explicitly.

### D-124 — `services_near` never returned the point it sorted by
Found while wiring the detail screen: the RPC took a member's location,
ordered by distance, returned `meters` — and never returned `lat`/`lon`. So
every "Go" link in the product had been silently falling back to the address
string, which 0023 records as the field the city feeds let rot while keeping
the geometry current. The card looked right and routed to a stale address.
0051 returns the point from both `services_near` and `service_detail`; 0052
does the same for `saved_places_mine` so the saved list draws the same card as
the search rather than a lesser one.

`create or replace function` cannot change a return type, so both migrations
drop the function first. A migration that only replaces will fail in an
environment where the old signature exists — which is every environment that
matters.

### D-125 — A subpath export, not a barrel, is what makes a lazy chunk lazy
`SavedStripLazy` was loading `import('@pam/ui')`, which pulls the barrel, which
imports every component in the library. Measured: the split did nothing at all
— webpack hoisted the shared parts straight back into the first load. Packages
now declare subpath exports (`@pam/ui/SavedStrip`, `@pam/ui/RoleSwitch`,
`@pam/config/hours`) and the lazy imports name the module, not the package.
That, plus keeping `hours.ts` out of the config barrel, is what put the build
back under §12's 500 kB with room to spare.

### D-126 — The bell is filled only when there is something new
The brand fill on the notification bell was permanent (D-084ish, 14 September)
— it stayed lit whether or not anything was waiting, on the logic that it was
the only route to the list. Will, 16 September: don't make the alert button
primary unless new alerts exist. A caught-up caseload and an ignored one had
been wearing the same colour; the fill is now the news itself; a quiet bell is
bordered like the account button beside it (ghost, `--color-border`), and only
turns primary — filled, brand-coloured — while `unreadCount > 0`. The
accessible name still carries the count either way, so nothing here depends on
seeing the fill.

Both header icons are now drawn filled (a new `MeIconFilled`, matching
`BellIcon`'s existing solid style) and sized to match each other — they used to
be two different weights of icon sharing a corner. The account button also
carries the light border Will asked for; the bell picks up the same border in
its quiet state, for the same reason (see the file comment): two icons in one
corner reading as one system, not one important-looking control and one
afterthought.

### D-127 — A notification is a log line, not a task
`NotificationList` used to wrap every row in a ghost `Button` with an
`onSelect` callback — and nothing in the app ever passed one. Every row looked
clickable and did nothing. Each row also carried its own "Mark as read"
button. Will, 16 September: don't make alert items clickable, they're just
logs, and there's no need to mark them read — it creates unnecessary tasks.

Both are gone. Rows are plain text. What used to be `read_at`'s job — deciding
whether to show the "Mark as read" button — is now purely "did this arrive
since the list was last opened", drawn as a small "New" label with no control
attached. The bell still needs to go quiet on its own, so `useNotifications`
gained `markAllSeen()`: one write, everything currently unread, fired once by
the notifications screen the moment its list is actually on screen — never by
a tap, and never touching the list already rendered, so the "New" labels
somebody is looking at do not flicker away under them. Only the *next* visit,
and the bell before it, see the cleared count.

### D-128 — Notifications say the place, or the person (reverses part of A7's silence on names)
"Someone reported a place: closed" and "Someone said a message is not safe"
told a case manager that something had happened and made them open the list to
learn what. Will, 16 September: "the alert should be more descriptive, saying
the place name, or person's name." 0053 adds `place` to `service_flagged`'s
`body_vars` (the flagged service's own `services.name`) and `name` to
`message_reported`'s (the reported message's sender — `profiles.first_name`,
looked up server-side, in the trigger, same as the routing itself).

A7 never said a notification could not carry a name — it said no message text
travels with it, which still holds exactly as written (0053's comment quotes
it). A name is one of the five facts a case manager and a super admin are
already entitled to read about their own people, the same five §4.1 names
anywhere else in the product (the caseload card, the directory row). This puts
one of those five facts on the notification a screen earlier than it already
was, not on a screen it had never been on.

`notify.service_flagged`'s `{reason}` is translated at render time through the
existing `flag.reason.*` keys — it always carried the raw database enum
('closed') before this session, untranslated, which is a bug this session
found and fixed while it was already in the file, not something 0053 changed.

### D-129 — A super admin's role preview now follows them off Home
`useViewAs` already existed and was already correct — a rendering choice
stored in `sessionStorage`, never touching which rows a query is allowed to
see. What was missing is that only Home ever asked it the question. Every
other screen that gates content by role — the case manager screen, the
directory — asked `session.session.role` directly, so choosing "Viewing as
Program" on Home and then opening Places or the case manager screen silently
reverted to the real role the instant Home was left (Will, 16 September: "on
the top of alerts, it seems like I can't view it from the view of different
users" — the *notifications bell*, present only on three screens before this
session, made this the easiest place to notice it, but the bug was general).

`useViewedRole(trueRole)` is the fix, shared by every screen: it reads the same
`useViewAs` a page already had access to and returns the previewed role when
one is set, the real one otherwise. `admin/page.tsx` and `directory/page.tsx`
now gate `isAdmin` / `isSuperAdmin` on the *viewed* role rather than the real
one — so a super admin previewing "Case manager" sees the case manager screen
(their own, typically empty, caseload, drawn as a case manager's screen — the
same "layout, not identity" principle Home's tiles already used), and,
symmetrically, a super admin previewing "Program" meets the same closed door a
program actually would. Nothing about *whose data* a query can reach changed —
every affected query still runs, unconditionally, as the real `auth.uid()`.

One link on `admin`'s closed-door screen — "your list is at the directory" —
stays keyed to the *real* role, deliberately: a super admin previewing
"Member" still has their own people list to get back to, and that link is
about what they can actually do, not what they are currently looking at.

### D-130 — The redundant "Viewing as" sentence is gone
The switcher's own chip already says "Viewing as Program" while a preview is
active (D-108) — in the header, on every screen, now that D-129 threads the
preview everywhere. Home also carried a separate `Notice` card underneath
repeating the same fact in a full sentence: *"This is what a Program sees. It
is your own account — nobody else's information is shown."* Will, 16
September: no need to show text saying which user, since the top bar does the
communicating — that's redundant. The card is removed; `view.notice` is
removed from both locale bundles as dead copy. The privacy guarantee itself
(nobody else's information is shown) was already true and stays true — it was
never load-bearing prose, just a restatement of what D-108's own comment
already argues at length.

### D-131 — Astryx's `Button` floors a `<button>` at 48px tall, but not an `<a>`
The Places category chips (`variant="ghost"`, no `size` prop set to anything
small) rendered 8px taller than the same chips on Saved, despite identical
props on paper. Size, padding, icon presence and `aria-pressed` were all ruled
out one at a time by reading computed styles directly; the actual cause was
tag choice — Astryx enforces a 48px `min-height` on `<button>`-tag rendering
specifically, with no matching rule found anywhere in the stylesheet, layers,
or adopted style sheets (it appears to be in the component's own JS, not
CSS). The same component rendered as `<a>` (passing `href`) does not carry
the floor. Fixed by giving every chip a real `href="/places/"` plus
`onClick={(e) => { e.preventDefault(); ... }}`, paired with explicit
`role="button"` and `aria-pressed` so an anchor still announces as a toggle
button rather than a link (a bare `<a aria-pressed>` fails axe's
`aria-allowed-attr`). Worth knowing before reaching for a `size` prop or a
custom `minHeight` override next time a control is shorter than expected.

### D-132 — A widely-fanned-out lazy component can leak its dependencies into the shared bundle
`RoleSwitch` went from one dynamic-import call site to eleven (Will, 16
September: "should be present on all views"). Adding
`DropdownMenuRadioGroup`/`DropdownMenuRadioItem` to it — previously used only
by `LanguageSwitcher`, which is statically imported — pushed Home's first-load
JS from 0.9 kB to 3.2 kB over the §12 budget, even though `RoleSwitch` itself
stayed a deferred chunk. Confirmed by grepping the built chunk contents for
`DropdownMenuRadio`: it had been promoted into the "loads on every route"
vendor chunk by webpack's automatic splitting, because enough different pages
now pulled it in. Fixed by reverting `RoleSwitch` to `DropdownMenu`'s plain
`items` array with a `✓` `endContent` instead of the radio-group compound
components, landing at 1.1 kB over instead of 3.2 kB. The general shape:
before adding a new shared dependency to a component that many pages
dynamically import, check whether that dependency is otherwise unused
elsewhere — widening its user base is what gets it hoisted.

### D-133 — Dummy places resolve locally, the same "real data wins silently" pattern as dummy people
The Family Services example place saved on a member's profile threw when
opened, because `/place/?id=…`'s `useServiceDetail` only ever queried
`services_near`/`service_by_id` over the network, and a `dummy-place-*` id
matches no row there. `DUMMY_PLACES_BY_ID` (built from the three
`EXAMPLE_*` places already in `dummy-places.ts`) is checked first, resolving
synchronously with no network call; a real id still falls through to the
real query exactly as before. Mirrors the same rule dummy people, dummy
notifications, and dummy interested-people lists already follow: dummy data
only ever fills a genuine gap, never overrides or races a real answer.

### D-134 — Two large pieces of Will's 16 September request are deferred, not done
Asked which of two approaches to take for two parts of a longer list, Will
chose the fuller option both times — client-side routing everywhere (for a
genuinely non-reloading top bar) and a full persisted share-places feature
(table, RLS, notification) rather than UI-only stand-ins. Neither is started.
This session limited itself to making header *content* consistent across
screens (the same role control, area chip, and bell everywhere) within the
existing per-page-reload navigation, and did not touch routing architecture
or add any share-related schema. Recorded here rather than left implicit so
the gap is visible in the decisions log, not only in a session note that
could go unread.

### D-135 — The sign-in hero's illustrations came in over Google Drive, resized on the way
The Figma MCP server's own asset URLs were unreachable from this sandbox (its
network policy blocks every request to figma.com, confirmed both via `curl`
and via the MCP server's own returned URLs), so real photography for
`OnboardingSlides` could not be pulled from the Figma file directly — see
D-134's session and the one this closes. Will shared the three source files
(city crowd, a two-way flip-phone image, sneakers) through Google Drive
instead. Each arrived around 600 kB; resized to 900px wide and re-encoded as
WebP at quality 68 (`sharp`, installed as a throwaway dev dependency, not
committed to the repo), landing at 29-73 kB apiece — comfortably clear of
`next/image`'s absence here (this is a static export with no image
optimizer, so the file on disk *is* what ships) and nowhere close to the §12
budget it doesn't count against (these are `public/` assets, not bundled
JS). Filenames describe content (`hero-city.webp`, `hero-phone.webp`,
`hero-sneakers.webp`), not slide position, after the source files' own Drive
names ("Slide 1/2/3") turned out not to match the order their content best
paired with `onboarding.1`/`.2`/`.3`'s copy — a maintainer swapping one
image for another later should not have to guess which "slide N" a filename
meant.

### D-136 — The sign-in hero autoplays, but never against `prefers-reduced-motion`
Will, 17 September: make the hero take roughly half the page and autoplay
every 4 seconds. Autoplay is exactly the kind of unrequested, recurring
motion §8/§12 exist to let somebody turn off — so it is gated behind the
same `prefers-reduced-motion` check `PointsBadge` already makes for its own
count-up, not just skipped under a spinner or a one-time entrance animation.
Under reduced motion the carousel still swipes by hand; it simply never
advances on its own. A manual swipe resets the 4-second timer rather than
racing it, so a slide somebody is mid-read on does not get pulled out from
under them.

Growing the hero back up (from the `clamp(220px, 38vh, 420px)` D-134/D-135's
session had shrunk it to, fixing a real carrier-consent regression) to
`clamp(280px, 50vh, 520px)` was re-verified against `consent.spec.ts`
directly rather than assumed safe — it still passes on the shortest
supported viewport, with room to spare, because the card's own content
(padding, gaps, the consent line's tightened type) had already been trimmed
in that earlier pass. A future height increase should re-run that spec
before shipping, not after.

### D-137 — Looping is an explicit `scrollTo(0)`, not `Carousel`'s own `hasLoop`
Will, 17 September, reported the autoplay wrap showed "a blank gap" going
from the last slide back to the first. `Carousel`'s built-in `hasLoop` wraps
by continuing to scroll past the last real item, which — with nothing
there to scroll into — shows empty track before it corrects itself. There
was never anything to actually wrap around: all three slides already exist
at indices 0-2, so looping is just "go back to a slide that's already
there," the same as a manual dot-tap would do. Fixed by dropping `hasLoop`
and driving both autoplay and the loop-back with `carousel.current
.scrollTo((here + 1) % slides.length)` directly.

### D-138 — The hero runs flush to the real top and sides of the viewport
Two related reports, same session: the hero "isn't touching top of screen,"
and its corner radius should go. Both were consequences of the hero
inheriting layout meant for a screen with content stacked in a column, not
a full-bleed photo: `Page`'s own 24px top padding pushed the hero down from
the true top (cancelled with a matching `-24px` margin on the hero's own
wrapping group — the same negative-margin technique the hero's *sides*
already used), and the bottom corner radius, meant to read against a screen
that had visible page background around it, had nothing left to read
against once the hero reached every edge. The hero's internal header
(mark, badge, globe) moved from `top: 16px` to `top: 24px` to compensate —
without the page's own padding above it, 16px alone sat too close to a
phone's own status bar.

Fixing "touching top" also revealed the dots bug below it (D-137's sibling,
same report): dots positioned `bottom: 24px` inside the hero were sitting
inside the sign-in card's own 32px overlap band, covered by the card's
opaque white surface. Not missing — covered. Moved to `bottom: 48px`,
clear of the overlap.

### D-139 — The STOP/rates line moves off sign-in, onto reminders
Will, 17 September, asked to drop "Reply STOP to stop texts. Rates may
apply." from under the sign-in button. Flagged first rather than done on
request: `consent.spec.ts` guards this exact text with a docblock warning
that carrier registration reviews it. Checked before implementing —
`docs/sms-campaign-samples.md` already says the screenshot filed with the
campaign was always the **reminders** screen, not sign-in, so this removal
does not touch what carriers approved. Will's reasoning for removing it
anyway: sign-in codes are not optional the way reminders are (§9), so the
room to be honest about STOP, HELP and rates belongs on `/reminders/`,
where a member is actually choosing something — it already carries all
three. Sign-in keeps only the line the code itself needs: "PAM texts you a
code to sign in. No password to remember." Both `consent.spec.ts` and
`join.spec.ts` (step 1 of sign-up reuses the same card) updated to match.

### D-140 — `OnboardingSlides` gets a subpath export, not a barrel one
Adding `framer-motion`'s `animate()` to `OnboardingSlides` (D-141) leaked
~30kB into every route's bundle — confirmed via `check-bundle-budget.mjs`
showing `/account`, `/points`, `/privacy` and other routes that never
render the hero jumping ~30kB each. Root cause is the same one D-125/D-132
already named: `packages/ui/src/index.ts` is a barrel, nearly every page
imports something from `@pam/ui`, and StyleX/webpack cannot separate "this
route uses `OnboardingSlides`" from "this route imports anything at all
from this package." Fixed the same way those two were: removed
`OnboardingSlides` from the main barrel, added a
`"./OnboardingSlides": "./src/OnboardingSlides.tsx"` entry to
`packages/ui/package.json`'s `exports`, and pointed both actual consumers
(`/signin/`, `/gallery/`) at `@pam/ui/OnboardingSlides` directly. Only those
two routes now carry the weight (`/signin` 529kB, `/gallery` 507kB); every
other route is back to its pre-change size.

### D-141 — The carousel's own transition is hand-driven, not the browser's
Will, 17 September: the slide transition was "too abrupt," and each slide
should hold two seconds longer. `Carousel`'s `scrollTo()` calls the native
`scrollTo({behavior: 'smooth'})`, which has no way to set an easing curve
or duration — so a custom ease needs to drive `scrollLeft` by hand.
`framer-motion` was already a `packages/ui` dependency, so `scrollToEased()`
uses its value-based `animate(from, to, {duration, ease, onUpdate})` to walk
the scroll container's `scrollLeft` over 600ms with a standard ease-in-out
curve, replacing the direct `carousel.current.scrollTo()` calls from D-137.
`AUTOPLAY_MS` moved from 4000 to 6000. Fully skipped under
`prefers-reduced-motion`, matching D-136 — reduced-motion users still get
instant jumps via swipe or a dot tap, just no animated glide and no
autoplay.

### D-142 — Slide images preload behind a skeleton, not a blank frame
Same request as D-141: on a slow connection, an unloaded slide image was an
empty frame that made the layout jump into place once it arrived. Each
slide now tracks its own `loaded` state via a `new Image()` probe with an
`onload` handler, and renders Astryx's own `Skeleton` at the slide's full
size until its image reports ready — sized identically to the real art so
nothing reflows when it swaps in.

### D-143 — `AlertBannerHost` is a custom composition, not Astryx's `Banner`
Will, 17 September: the sign-out banner "is transparent and makes it hard
to read" over the sign-in hero photo, and separately asked for it to sit
above the page rather than overlapping the nav or logo. Investigated
Astryx's `Banner` source directly rather than guessing: its four status
colours (`info`/`warning`/`error`/`success`) resolve to the `-muted` token
variants, which are deliberately ~20% alpha — exactly the "transparent"
complaint, and by design, not a bug, so no prop on `Banner` fixes it.
Separately, `Banner`'s own `xstyle` prop only reaches its outer root frame,
never the inner `.header` where padding and icon size live, which also
blocked the later "make it thinner" request (D-145) from being done through
`Banner` at all. Replaced with a small custom composition in
`AlertBannerHost.tsx` using Astryx's own `HStack`/`Text`/`Button`/`IconButton`
primitives directly, styled with the *solid* semantic colour tokens
(`--color-accent`/`-on-accent` etc., the same pairing a filled `Button`
variant uses) instead of the muted ones. `TextLink` was tried first for the
action slot and dropped — it has no `xstyle` escape hatch by design, so
Astryx's own `Button` (`variant="ghost"`) is used instead, matching the
established "reach for the primitive when the wrapper doesn't fit" pattern
already used by `Notice`/`AreaChip`/`PeopleStrip`.

### D-144 — `AlertBannerHost` is in-flow, not `position: fixed`
The second half of the same report: the banner should sit "on top of the
page" without overlapping the nav or logo below it. `AlertBannerProvider`
already renders its `Host` as a normal sibling immediately before
`children` — the fixed positioning was the only thing making it float over
content instead of pushing it down. Removed, so the banner now occupies
real layout space above whatever screen is showing, the same way any other
block element would.

### D-145 — The banner shrinks to a single compact row
Will, 17 September, a follow-up on the same component: "too tall," and its
buttons too large. `Banner`'s `.header` padding is unreachable via `xstyle`
(D-143), which is moot now that `AlertBannerHost` is its own composition —
rebuilt as one `HStack` (title, optional description, optional action, and
a dismiss `IconButton`) at `paddingBlock: 10px`, `fontSize: 15px` title /
`14px` description, instead of `Banner`'s multi-line stacked layout. Both
buttons still clear the 48px §2.5 floor (`minHeight`/`minWidth: 48px`) —
the row got shorter by trimming padding and font size, not by shrinking a
touch target below the rule that exists for it.

### D-146 — Home redirects a signed-out visitor straight to `/signin/`
Will, 17 September, with a screenshot of Home's dark splash screen ("PAM
helps you find people and places...", a Sign in button, a Help button):
kill that screen for anyone signed out, and go straight to sign-in. Added a
`useEffect` on Home that calls `router.replace('/signin/')` the moment
`session.status === 'signed-out'`, rendering the same `Loading` state the
screen already shows while session status is still resolving — so there is
no flash of the old splash before the redirect fires. The splash content
itself still exists and still renders for the other two states that use it
(`no-profile`, `suspended`), which are real states a signed-out redirect
must not swallow. `a11y.spec.ts`'s 64px-primary-button test moved from `/`
to `/account/`, which still shows its own inline "Sign in" link for a
signed-out visitor landing there directly — Home no longer has one to find.

### D-147 — The neutral theme's `--color-on-warning` needed its own override
Surfaced as a genuinely confusing regression: after D-140/D-143's changes,
`admin.spec.ts`'s WCAG check started failing at 320px, light mode only, on
the case manager screen's "Messages off" badge — 1.69:1 contrast, nowhere
near the tests that were passing minutes earlier on the same code.
Bisected by reverting files one at a time and rebuilding between each
(`git stash push -- <file>`, rebuild, re-run, `git stash pop`) rather than
guessing from the diff — reverting `AlertBannerHost.tsx` alone made it pass
again, which was the wrong lead: nothing in that file touches the admin
screen or its Badge. Reading the actual generated CSS (`--color-warning:
light-dark(#4b3900, #f8d36a)` paired with a *flat*, non-`light-dark`,
`--color-on-warning: #111111`) showed the real bug: `@astryxdesign/theme-
neutral`, the vendor theme `pam.theme.ts` extends, ships that pair
unconditionally. In dark mode, `#111111` text on `#f8d36a` reads fine; in
light mode, the same `#111111` sits on `#4b3900` — dark text on a dark
fill, 1.69:1. This was always latent; the module-loading change from moving
`OnboardingSlides` off the barrel (D-140) evidently shifted a CSS chunk's
load order enough to newly surface it in Playwright, but the defect itself
predates this session and had nothing to do with the file bisection first
implicated. Fixed at the one place PAM already overrides individual
neutral-theme tokens for exactly this reason: added
`'--color-on-warning': ['#FFFFFF', '#111111']` to `pam.theme.ts`'s own
`tokens`, regenerating `pam.css`/`pam.js` via `astryx theme build`. White on
`#4b3900` measures 11.1:1; the dark-mode pairing is unchanged. *A revert
that fixes a test is a lead, not a diagnosis — the actual defect was three
files away from the one that made the symptom disappear.*

### D-148 — Member-to-member chat is scoped to accepted connections, and that scope is enforced by the client, not the database — flagged for Will

**Superseded by D-152, same day.** Will corrected the whole premise: PAM's
messaging is staff-to-member (a case manager with their caseload, a program
admin with their enrolled members), never member-to-member. Everything below
about *how* to scope eligibility client-side and flag the RLS gap honestly
turned out to be the right instinct applied to the wrong relationship — D-152
keeps the shape of this reasoning and replaces `connections` with the
caseload/enrollment relationships that already existed for other screens.
Left in place, unedited below, as the record of what was actually built and
why it was wrong; do not use the `connections`-based scoping described here.

Built the first chat/messaging UI (`/messages/`, `/messages/thread/`): a
conversation list and a thread view, reading and writing `conversations`,
`conversation_members` and `messages` exactly as RLS already allows.

The open question was who a member may message at all. `messages` and
`conversations` carry no column that says "these two people are allowed to
talk" — the only relationship table is `connections` (`kind`: `mentor` |
`buddy`, `status`: `accepted` once both sides agree), and A1's own reasoning
about program-admin chat says the quiet part outright: *"Direct chat has to
keep that gate or it becomes a way for any registered organisation to message
any member."* The same logic applies to member-to-member chat. So the UI
only ever offers "start a conversation" for people with an `accepted` row in
`connections` — `useConnectablePeople` reads exactly that and nothing else.

**This is enforced by the client, not by Postgres, and that gap is real.**
Read every relevant policy in `0007_rls.sql` before assuming otherwise:

- `conversations_insert_participant` only checks `is_active_account()` and
  `my_feature_allowed('chat')` (permanently true, 0031) — nothing about who
  the other member is.
- `conversation_members_insert` allows adding yourself
  (`profile_id = auth.uid()`), and once you are a member, adding *anyone
  else* (`in_conversation(conversation_id)` — true the moment you added
  yourself first).

So today, a client that skipped `useConnectablePeople` and called
`openConversation()` with an arbitrary profile id would succeed: RLS would
let it create the conversation and message a stranger. Nothing in the schema
stops that; only this build's own restraint does. `messages_insert_sender`
does at least require `in_conversation(conversation_id)`, so a *third* party
still cannot inject messages into someone else's conversation — the gap is
specifically "who can start one," not "who can read or write once inside
one."

Given the choice between shipping this now and blocking on a migration, I
took the conservative option Will's own standing instruction favours (narrow
scope, more privacy) and shipped the client-side gate, documented exactly
here. **This needs a follow-up migration** — a trigger on
`conversation_members` (or `conversations`) that checks an accepted
`connections` row exists between the two members before the second insert
succeeds, mirroring how `messages_insert_sender` already gates on
`in_conversation`. Until that lands, the guarantee "a member can only be
messaged by someone they are connected to" is a property of this one screen,
not of the database — exactly the RPC-surface class of bug `packages/db`'s
own README already warns about (row-level security does not cover every
write path; a client that skips the intended screen skips the gate too).

### D-149 — `conversations.last_message_at` is written by nothing; the conversation list derives recency from `messages` directly

**Unaffected by D-152's correction** — this is a fact about the schema, not
about who is allowed to message whom, and `useConversations` (which this
entry describes) still works the same way for staff-to-member conversations
as it did for the wrong member-to-member ones.

Read `0005_people.sql` expecting a trigger to keep `conversations.last_message_at`
current, the way `notifications` and `saved_places` are each kept current by
something. There is none — grepped every migration for `last_message_at` and
the only hit is the column's own definition. The column has existed since
0005 and has read `null` on every row ever since.

`conversations` also has no `UPDATE` policy at all (only `_select_member` and
`_insert_participant`), so a client could not have been expected to keep it
current either, even if one had tried.

`useConversations` works around this rather than trusting the column: it
pulls the most recent `RECENCY_SCAN_LIMIT` (500) messages across every
conversation the member is in, reduces to one "latest" row per conversation
client-side, and derives both the sort order and the unread flag from that.
This is correct today and does not scale — a member with a handful of
long-running conversations is fine; thousands of messages across many
conversations would mean re-scanning all of them on every visit to the list.
The honest fix is a trigger that updates `conversations.last_message_at` (and,
ideally, a denormalised `conversations.last_message_preview`) on `messages`
insert, the same shape `notifications`' routing triggers already use — left
for a follow-up rather than done as a drive-by inside a UI session, since it
touches RLS review and the db test suite's own migration count.

### D-150 — Messages is real member functionality and does not honour a super admin's role preview

**Extended by D-152, same day**, not superseded: the reasoning below is
unchanged, only the set of roles it applies to grew from "member" to
"member, case manager, program admin" once messaging was corrected from
member-to-member to staff-to-member. Read this entry for the *why*; D-152
for the corrected scope.

Every other screen that gates on role reads `useViewedRole`/`useRoleView`, so
a super admin's "Viewing as X" choice (D-108/D-129) follows them to Places,
Saved, the caseload screen and the directory. Messages does not: it gates on
`session.session.role` — the account's actual, signed-in role — and ignores
`viewAs` entirely, on Home (the `NavTile` only appears when `me.role ===
'member'`, not `viewed`) and on both `/messages/` screens.

The reason is that every other preview is either read-only (the directory,
the caseload) or backed by a genuine per-role demo layer (`useSavedPlaces`'s
`demoRole` branch writes to `sessionStorage`, never Supabase, while
previewing). Messages has no demo layer, and building one was out of scope
for this session. Without either safeguard, a super admin previewing
"Member" on this screen would be reading and sending *real* messages under
their own real account, indistinguishable in the data from an ordinary
member's conversations — the wrong failure mode for a feature whose whole
premise (D-074) is that nobody but the two people in it reads what is said.
Excluding it from the preview system entirely is the conservative choice;
giving it a proper demo layer, if a super admin ever needs to see what this
screen looks like, is future work.

### D-151 — A small, disclosed bundle-budget regression from this session's new locale strings

§12's budget was already 0.7 kB over (500.7 kB gz, D-140's session).
Building this feature's UI added roughly 20 new keys to `en.json`/`es.json`
for text that has to exist somewhere the moment any screen shows it — "No
conversations yet," the empty/error/not-found copy, and so on. `useI18n`
statically imports both locale bundles into every route (`import en from
'@pam/config/locales/en.json'`), so *any* new UI copy anywhere in the
product adds a few bytes to the shared first load, not just to the routes
that use it. Measured before and after, isolating each change:

- Adding a `MessageIcon` to `packages/ui`'s icon set and using it on Home
  cost about 0.2 kB — reverted. Home's new "Messages" tile reuses the
  already-shared `PeopleIcon` instead (see the comment on that `NavTile`).
  At the time this was written a member never saw it duplicated on their own
  screen; D-152's correction to staff-to-member messaging means a case
  manager or program admin now does see it twice (their caseload/interested
  tile and the Messages tile both use `PeopleIcon`) — noted there as an
  accepted small cosmetic cost, not fixed here.
- The locale-bundle growth itself costs about 0.1 kB and could not be
  avoided without lazy-loading translations per route — a real architecture
  change, out of scope here. Measured: 500.7 kB → 500.8 kB gz, budget check
  now reports "over by 0.8 kB" instead of "0.7 kB."

Flagged rather than hidden: this is a real, if tiny, regression past an
already-disclosed overage, and the honest fix (splitting locale bundles so a
route only loads the keys it uses) is bigger than this session's scope. The
`/messages/` and `/messages/thread/` routes themselves add nothing to the
*shared* chunk `check-bundle-budget.mjs` measures — their own route-specific
code (6.3 kB and 6.2 kB per the build's own "Size" column) is code-split
the ordinary Next.js way, since nothing else in the app imports from them.

**Updated by D-152's correction, same day**: the rescoped copy (new
`messages.empty.body.member`/`.staff`, `messages.start.empty.*`, a widened
`messages.notForRole.*`, and the two new transparency-contract lines) added
another ~0.2 kB. Measured after the correction: 501.0 kB gz, "over by 1.0
kB." Same trade as above, same reasoning, not re-litigated per kilobyte.

### D-152 — Messaging corrected to staff-to-member (case manager/program admin ↔ member), not member-to-member — supersedes D-148

Will's correction, same day as D-148/149/150: PAM's messaging is a case
manager or a program admin reaching a member they are actually responsible
for, never a member reaching another member. The earlier build's whole
"accepted mentor/buddy connection" eligibility model (D-148) was the wrong
relationship — A1's own reasoning about program-admin chat already said the
right one out loud: *"Direct chat has to keep that gate or it becomes a way
for any registered organisation to message any member"* — and the "gate" it
meant was always the staff relationship (caseload, enrollment), never a peer
one.

**Who can start a conversation now, and how it's queried** — reusing
existing relationships rather than inventing a new one, per instruction:

- A **case manager** (`role: 'admin'`) sees the same "caseload" `/admin/`'s
  "Your people" screen already shows: `useMessageableMembers` runs the exact
  broad-then-narrow query `useCaseload` established (`profiles where role =
  'member'`, unfiltered client-side), and `admin_covers()` — assignment or
  region, the same either/or `/admin/` already relies on — decides what comes
  back. Not a new caseload concept; the one that already ships.
- A **program admin** (`role: 'provider'`) sees members enrolled in a service
  under their own `org_id`, via the existing `profiles_select_provider_linked`
  policy (`provider_linked_to()`). Will confirmed PAM has one program admin
  per org today — multiple staff per program is a later feature — so this is
  deliberately an org-wide query, not a per-staff-row one. It happens to be
  written in a way that would keep working if that changes (nothing filters
  by a specific staff id, only by org), but nothing was added to prepare for
  it; that would be scope this correction was explicitly told not to take on.
- A **member** gets no "start a conversation" affordance anywhere. They see
  conversations already begun with them (`useConversations`, unchanged in
  shape from D-148, just no longer fed by a "who can I message" list at all
  for members) and can reply inside one.

**The RLS gap from D-148 is still open, reframed for the new relationships.**
`conversations_insert_participant` and `conversation_members_insert` still
only check "active account, `chat` on" — nothing about caseload or
enrollment. So today, at the database layer:

- A member can still call the same insert sequence a case manager's "Start a
  conversation" row calls and create a conversation with *anyone*, including
  another member or a case manager not their own — `useMessageableMembers` is
  never rendered for a member, but nothing stops a modified client from
  skipping it.
- A case manager or program admin could, at the RLS layer, start a
  conversation with a member outside their caseload/org — `useMessageableMembers`'s
  own query is exactly right (it reuses `admin_covers()`/`provider_linked_to()`
  and cannot itself return an ineligible member), but a client that bypassed
  it and called `openConversation()` directly with an arbitrary id would
  succeed regardless.

A follow-up migration should tighten `conversation_members_insert` (or add a
trigger on it) to require, for the second membership row in a brand-new
conversation: if the inserting caller's role is `'admin'`, `admin_covers(new
member's profile_id)`; if `'provider'`, `provider_linked_to(...)`; and if
`'member'`, refuse outright — a member may be *added* to a conversation
(when staff adds them) but should never be the one whose insert creates the
second row. This is more precise than D-148's version of the same flag
because the eligibility functions to check already exist and are already
used elsewhere (`admin_covers`, `provider_linked_to`) — this is a smaller,
more mechanical fix than writing a new relationship from scratch would have
been.

Same conservative call as D-148: shipped now, with this written out in full,
rather than blocked on the migration. Still needs Will's word on whether
that trade is right for this feature specifically, given it now involves
staff accounts with real caseload access rather than peers.

### D-153 — A conversation partner needed a new `profiles` read policy, and the transparency contract needed a new line — both because a case manager is now a real participant, not a third party

**Point 1 below (the new `profiles` policy) is superseded by D-154, same
day**: Will's follow-up found that the raw row policy described here handed
back `last_active_at` and `phone` along with the name — replaced with a
column-limited function. Point 2 (the transparency contract change) is
unaffected and still stands as written.

Two things D-152's correction exposed that D-148's original design never hit:

**1. A member could not have read their case manager's or program's name at
all.** `profiles` had four `select` policies before this session — self,
discoverable-mentor, connected (via `connections`), admin-caseload, and
provider-linked — and every one of them either requires `id = auth.uid()` or
runs from *staff's* side down to a member. None let a member read a staff
profile. Under the wrong D-148 model this never surfaced, because a member's
only conversation partner was ever another member (readable via
`profiles_select_connected`). Under the corrected model, a member's *only*
conversation partner is staff, and there was no policy for it at all — the
conversation list and thread header would have rendered a name-shaped blank
for every real member, for every conversation, always. Caught by tracing
which `profiles` policy would actually answer the query before shipping it,
not by a test (there is no test for this — see "Left undone" in the session
log). Fixed in `0054_conversation_partner_visibility.sql`:
`profiles_select_conversation_partner`, letting anyone read the profile of
someone they share a `conversation_members` row with, symmetrically (staff
already had their own path to a member's profile; this is what a member
was missing, and making it symmetric rather than member-only is simpler than
two directional policies for the same relationship).

That policy exposes the *whole* profile row under RLS, including `phone` —
Postgres RLS is row-level, not column-level, and no client code today selects
`phone` for this purpose (verified: nothing in `apps/web` selects it from
`profiles` at all). Flagged rather than fixed with a column-level `REVOKE`
this session: the codebase already has a real precedent for that exact
pattern elsewhere in this repo's *other* project (`site/`'s
`bids.bidder_contact` withholding), so it's a known, bounded piece of
follow-up work, not a new technique to invent — just out of scope for a
same-day correction already touching RLS once.

**2. The §4.1 transparency contract was written for a world where staff were
never conversation participants, and that world no longer exists.**
`ADMIN_CAN_SEE` listed only `conversation_metadata_exists_and_last_activity`
and `flagged_messages_routed_through_reports` for messages — both describe
an admin *outside* a conversation. A case manager who is now genuinely
*inside* one (because they started it) reads its full history the ordinary
way any conversation member does, which is a real widening the onboarding
screen did not disclose. Per `CLAUDE.md`'s own standing instruction
("Widening what admins can see fails tests by design. Change the contract
first, and tell members before it ships"), `transparency.ts` now says so
directly: a new `ADMIN_CAN_SEE` entry
(`messages_in_conversations_they_started_with_you`) and a new onboarding
line, *"Everything you say to them, if they message you directly."* The
existing `cannotSee.messages` line — "What you write in your chats" — was
also now flatly false for the only kind of chat that exists post-correction
(the person you're messaging obviously sees what you send them), so it was
reworded to "What you say to someone else," which stays true: a case manager
who is *not* in a given conversation still has no route into it but a
report — D-074 is completely unchanged for that case, only for the
participant case.

No test currently enforces `ADMIN_CAN_SEE` against the live RLS policy set —
the file comment references an `admin_visibility.test.ts` that does not
exist in this repository (checked directly: no file by that name anywhere,
in either package). That comment appears to describe intended tooling that
was never built, not a broken test; flagging it here rather than either
silently trusting it or quietly building the missing test, since building a
real policy-vs-contract diff test is bigger than this correction's scope but
worth someone deciding on deliberately.

Both changes are in this session's diff and covered by `pnpm --filter
@pam/config test` (`copy.test.ts`'s transparency-screen assertions, which
check `en.json` matches `transparency.ts`'s English source word for word,
and that both locale bundles carry every key) — 211 tests still pass.
`pnpm --filter @pam/db test` was not run (this sandbox is missing the
`postgis` extension), so `0054`'s policy is unverified against the live
penetration suite; flagged in the session log as needing that run before
this ships anywhere real.

### D-154 — A conversation partner reads a name and a role, never activity info — a function replaces D-153's raw policy, uniformly, not just for program admins

Will's follow-up, same day: a program admin must not see a member's
"activity" info — `last_active_at`, named explicitly, "and anything else in
that vein" — through the messaging surface. Audited D-153's
`profiles_select_conversation_partner` to answer it precisely: a `for
select` policy has no concept of "some columns" — the moment it made the row
readable at all, `last_active_at`, `phone`, `bio`, `tags` and `home_zip`
all came with it, to *any* conversation partner, of *any* role. Not
program-admin-specific; the whole design was too blunt an instrument for a
column-shaped requirement.

**Fixed by following 0043's own precedent exactly**, per instruction:
`directory_people()` already solved this shape of problem for the super
admin directory — a `SECURITY DEFINER` function with a fixed, short column
list, guarded by an internal check rather than a table-wide grant. Migration
0055 drops the D-153 policy and adds `conversation_partners()`: `first_name`
and `role`, nothing else, scoped to `mine.profile_id = auth.uid()` inside
the function body (never a caller-supplied id — the exact RPC-surface trap
`CLAUDE.md` and `member_points()`'s own history already warn about).
`useConversations` and `useThread` were rewritten to call it instead of the
raw `profiles` join; `useConversations.ts`'s `one()` helper became dead code
once its last caller was removed and was deleted rather than left orphaned.

**Deliberately uniform across every role, not program-admin-conditional.**
The instruction offered "a role-gated function or column-scoped view" as the
safer pattern; I chose the plainer of the two available shapes. A
role-conditional function (branching on the caller's own role to decide
whether to include `last_active_at`) was the more literal reading of "hidden
specifically for program admins," and was rejected because nothing in the
messaging UI has ever shown activity info to *anyone* — not a member, not a
case manager, not a program admin (verified: grepped `/messages/` and its
hooks for `last_active`/`lastActive`/`activity`; the only hits are this
entry's own doc comments). Case managers keep exactly the activity
visibility they already had, unchanged, because it comes from an entirely
separate path (`admin_covers()`, `/admin/`'s "Your people" screen,
`useCaseload.ts`) that this migration does not touch — giving them
`last_active_at` through the conversation-partner function *too* would add a
second route to the same fact for no product reason. The more restrictive,
uniform answer was also the simpler one; per the standing instruction to
prefer the conservative choice when a scope is ambiguous, this is that
choice, flagged here rather than guessed wide in the other direction.

**What "activity, and anything in that vein" does NOT currently cover,
because nothing currently exposes it through this path either:**
enrollment status, appointment attendance, and points/level are the other
three items on 0043's original "five facts," but `conversation_partners()`
never touches `enrollments`, `appointments`, or `points_ledger` at all — it
is a two-column function against `profiles` alone. There is nothing to
narrow there because nothing was ever granted. If a future session adds any
of that to the messaging UI, it should get the same scrutiny this session
gave `last_active_at`, not an assumption that the same restraint already
covers it.

**Closed by D-155, the same day's next follow-up — this paragraph is now
history, not a live gap.** `profiles_select_provider_linked` (0007, pre-existing,
unrelated to any messaging work) already grants a program admin the *whole*
`profiles` row — `last_active_at` and `phone` included — for any member
linked through an enrollment, an appointment, or a connection, independent
of whether a conversation exists at all. A program admin who has never sent
a single message to a member they are enrolled with can still read that
member's `last_active_at` today, through that older policy, by querying `profiles`
directly rather than through anything `apps/web` currently builds. Narrowing
the conversation-specific path (this entry) does not touch that older, wider
one. This is a pre-existing, general provider-role RLS question — not
something the messaging work introduced, and bigger in scope than a
same-day follow-up (it would mean either replacing `profiles_select_provider_linked`
with its own column-limited function, which touches every existing and
future feature a program admin's profile access underlies, or accepting
that "no activity info for program admins" is true of the messaging surface
specifically and not a blanket product guarantee). Left for Will to decide
deliberately, with the fact stated plainly rather than allowing "program
admins can't see activity info" to read as more true than it currently is.

Verified: `pnpm --filter @pam/config test` (211, unaffected — this is a
`packages/db`/`apps/web` change), `pnpm -r typecheck` clean, full Playwright
suite unaffected (nothing about visible copy changed). `pnpm --filter
@pam/db test` still not run in this sandbox (missing `postgis`) — `0055`,
like `0054` before it, is unverified against the live RLS penetration
suite. This is now two consecutive migrations in one day that need that run
before anything here should be trusted against the real database.

### D-155 — Program admins never see member activity, anywhere — not just through messaging

Will, widening D-154's closing note into an explicit instruction: "program
admins don't see activity, across entire app." Not scoped to messaging.

**Closed the pre-existing gap D-154 had flagged and deliberately not
fixed**: `profiles_select_provider_linked` (0007) was the one remaining raw
row policy handing a provider the whole `profiles` row — `last_active_at`
and `phone` included — for any member linked through an enrollment, an
appointment, or a connection, with no conversation required. Migration 0056
drops it and adds `provider_linked_members()`, following `conversation_partners()`'s
own pattern from the day before (which followed `directory_people()`'s,
0043): a `SECURITY DEFINER` function, a fixed two-column list (`id`,
`first_name`), the guard (`my_role() = 'provider' and provider_linked_to(id)`)
inside the function body rather than the grant. `phone` was dropped in the
same pass rather than left for a third round on the same shape of gap, per
instruction — there was no reason to touch this policy twice.

**Grepped `apps/web` for every place a provider reads `profiles` for a
linked member, not just the messaging code**: `useMessageableMembers.ts` is
the only real one. `/interested/` renders `@pam/config/dummy-people` only
(no real query at all — see that screen's own file comment, unchanged
today), and nothing else in the app queries `enrollments` or `appointments`
yet. `useMessageableMembers` now takes the caller's role explicitly and
branches — a case manager still gets the raw, broad-then-narrow `profiles`
query `useCaseload` established (unaffected, per instruction — this is
provider-role-specific); a program admin now calls
`provider_linked_members()` instead.

**Updated the `@pam/db` test suite to match, since I cannot run it here.**
`02_rls_test.sql`'s "Providers reach members only through a link" block
used to assert a linked provider reading `profiles` directly returned one
row — that assertion is now the wrong expectation and would fail if run
unchanged, so it was rewritten to assert the opposite (a direct `profiles`
read now returns nothing, for a linked provider or not) and to exercise
`provider_linked_members()` instead. `04_rpc_test.sql` gained a new block
mirroring `directory_people()`'s own coverage exactly — a member reads
nothing, an unlinked provider reads nothing for this member, a linked
provider reads exactly the member, and `execute 'select last_active_at
from provider_linked_members()'` / `'select phone from ...'` both raise
`undefined_column`. These are written carefully against the seed data
(`01_seed.sql`'s Alice/Bob, the same linked/unlinked pair 02's own test
already used) but are **unverified by an actual run** — see the "Verified"
note below.

Case managers are unaffected throughout: `profiles_select_admin_caseload`
and `admin_covers()` are untouched by this migration, matching the
instruction exactly ("case managers/admins are unaffected — this is
provider-role-specific").

Verified: `pnpm -r typecheck` clean, `pnpm --filter @pam/config test` 211
passed (unaffected — this is a `packages/db`/`apps/web` change), `pnpm
--filter @pam/ui test` 65 passed, `pnpm --filter @pam/web build` succeeds,
bundle budget unchanged. `pnpm --filter @pam/db test` still cannot run in
this sandbox (missing `postgis`) — this is now three consecutive same-day
migrations (0054, superseded; 0055; 0056) that have never been run through
the RLS penetration suite, on top of a hand-written new test block that has
also never executed. Read all three, and the new `02`/`04` test blocks,
directly before trusting any of it against the live project.

### D-156 — The transparency contract, re-audited line by line, not just amended again

Will's instruction was explicit: re-check every line in `transparency.ts`
against what the code actually does right now, not just append a new one —
the file has had three same-day passes (0054 → 0055 → 0056) and needed to
say what is true today, not what an earlier draft assumed.

**Added, stated plainly and positively rather than left as a silent
absence** (Will's own words: "this should be stated plainly and
positively, not just absent"): a new `cannotSee` line, *"A program never
sees the last day you used PAM"* — and the matching machine-checkable
`ADMIN_CANNOT_SEE` entry, `member_activity_for_a_program`. "A program" is
not a forbidden staff title under §9's "never name the role" rule for this
screen — it is the same ordinary, already-used member-facing word this
screen and `/messages/` already use (`role.provider` itself reads
"Program"; `canSee.enrollments` already says "the programs you signed up
for"). This is the one line on the whole screen where the two roles §4.1
covers — a case manager and a program admin — genuinely diverge, so it is
the one place naming the second one plainly was necessary to keep the
promise honest, rather than leaving "they" ambiguous between two different
sets of facts.

**Re-verified, not just re-asserted, that D-153's case-manager-as-participant
line is still accurate** after today's further narrowing: `canSee.directMessages`
("Everything you say to them, if they message you directly") describes
message *content* visibility, which today's changes (0055, 0056) never
touched — those closed a *profile-metadata* leak, not message content.
Confirmed unchanged and still true.

**Found and fixed a line that was never true, not something today's work
broke**: `canSee.chatMetadata` ("That a chat exists, and the last day you
used it") and its `ADMIN_CAN_SEE` counterpart,
`conversation_metadata_exists_and_last_activity`. Checked every migration,
before and after any of today's changes: no policy has ever existed on
`conversations` or `conversation_members` granting a case manager
visibility into a conversation they are not a member of. There is no
"metadata only" mode — a case manager either participates (and reads
everything, per `directMessages`) or sees nothing about that conversation
except a reported excerpt (`flagged_messages_routed_through_reports`). This
line predates all three of today's sessions; removed rather than left to
mislead a fourth reader. The corresponding locale keys
(`transparency.canSee.chatMetadata`) were removed from both `en.json` and
`es.json`.

**Also corrected the file's own top-of-file claim.** It said
`admin_visibility.test.ts` enforces `ADMIN_CAN_SEE` against the live RLS
policy set — D-153 already found this file does not exist anywhere in the
repository; the in-file comment itself now says so plainly, rather than
leaving that correction only in `DECISIONS.md` where a future reader of
`transparency.ts` alone would not see it.

Every other line was checked against a real policy or code path and left
unchanged as accurate: `goals`/`enrollments`/`appointments`/`points` all
map to a real `admin_covers(member_id)` policy (verified directly —
`enrollments_select_admin`, `appointments_select_admin`,
`points_ledger_select_admin`, etc., all in `0007_rls.sql`);
`active_connections_names_and_kind` maps to `connections_select_admin`;
`flagged_messages_routed_through_reports` maps to `report_message()` (0034).

Verified: `pnpm --filter @pam/config test` 211 passed — the transparency
word-for-word test (`en.json` must match `transparency.ts`'s English source
exactly) and the en/es key-parity test both pass against the rewritten
copy, and the removed key does not linger as an orphaned, untested entry in
either bundle. `pnpm -r typecheck` clean. Full Playwright suite re-run
(`e2e/join.spec.ts` already carried the one assertion that touches this
screen's text, fixed in the previous session for the `cannotSee.messages`
wording — checked again here for any assertion on the removed
`chatMetadata` text or the new `programActivity` line; found none, so
nothing else needed updating there).

### D-157 — `admin_visibility.test.ts` is built, as `04_transparency_contract_test.sql`, and this sandbox turns out to have `postgis` after all

Will asked for the file `transparency.ts`'s own comment referenced and D-153
found does not exist. Built it as `packages/db/test/04_transparency_contract_test.sql`
— matching the existing suite's own naming and directory convention
(`0[234]_*.sql`, picked up automatically by `pnpm --filter @pam/db test`'s
glob) rather than a new top-level file or tooling, and scoped specifically
to what moved across today's four migrations rather than restating the
whole RLS suite.

**Four things, matching the four contract lines that changed today:**

1. A case manager who **is** a conversation participant reads its full
   history (`transparency.canSee.directMessages`). Proven against a fresh
   fixture this file adds — a real conversation between `admin_north` and
   Marcus, inserted the same way `01_seed.sql` sets up its own — rather than
   the pre-existing seeded conversation, which has no case manager in it at
   all.
2. The **same** case manager, who covers Marcus on their caseload
   (`admin_assignments`) but was never added to a *different* one of
   Marcus's conversations, reads nothing from it. This is the sharpest
   single proof available that participation, not caseload coverage, is
   what grants access — the same account, the same covered member, two
   conversations, opposite answers.
3. A program admin gets nothing back from `last_active_at` or `phone`
   through **either** function that reaches a member —
   `conversation_partners()` (0055) and `provider_linked_members()` (0056)
   — checked from the same real account (Alice, who is genuinely both
   linked and a conversation participant), with the same
   `undefined_column`-on-`execute` technique `directory_people()`'s own
   test and 0056's own test block already established. Deliberately
   overlaps 0056's own coverage for these two columns, per instruction: that
   block proves the *function* is correct; this one proves the
   *transparency contract* holds across both paths a program admin can
   actually take, which is the promise a member reads.
4. Restated as the single positive claim points 1–2 prove between them,
   from a fresh angle (a third account, Ray/`admin_south`, who participates
   in nothing): total message-table and `conversation_partners()`
   visibility is zero for a case manager who is not a participant anywhere.

**Deliberately does not re-test the report path** (D-074,
`flagged_messages_routed_through_reports`) — `04_rpc_test.sql`'s "A case
manager sees a message only when somebody reports it (0034)" block already
covers it in full, and Will's own instruction said to reuse it rather than
duplicate it. This file's own comment says so explicitly, naming that block
by name, so a future reader does not go looking for report coverage here
and conclude it is missing.

**One real bug this test caught in itself, before any migration bug:** the
psql client-side `\set` command takes the rest of its line as the variable's
value — `\set convo2 '...' -- a comment` does not strip the trailing
comment the way SQL does, so the variable ends up containing the comment
text too, and the first `INSERT` that used it failed with `invalid input
syntax for type uuid`. Existing files avoid this by never putting a comment
on the same line as a `\set`; this file now follows that same discipline,
with the reasoning stated once, not by accident.

**A second thing this test caught, this time an assumption error rather
than a syntax one:** `convo1` (Marcus's seeded conversation with Alice) does
not hold a fixed message count by the time this file runs —
`04_rpc_test.sql`'s own "0031: messaging is never switchable off" check
sends one real message into it earlier in the suite, as a live RLS-governed
insert rather than fixture data. A hardcoded expectation of 2 messages
failed the very first time this file actually ran. Fixed by capturing the
real count with `\gset` immediately before this file's own fixture changes
anything, rather than hardcoding a number that depends on another file's
side effect — the honest fix, not a magic "3."

**This sandbox has `postgis` installed now, and did not before today.**
Every prior entry today (D-152 through D-156) says `pnpm --filter @pam/db
test` "cannot run here" — true when written, and then addressed directly:
`apt-get install postgresql-16-postgis-3` succeeded (one dependency 404'd
on the first attempt from a stale package index; `apt-get update` first
fixed it). With that plus the `pgcrypto` extension (already present),
`pnpm --filter @pam/db test` ran for real, standing up a throwaway cluster
exactly the way `scripts/test-db.sh` describes, applying every migration
through `0056` and every test file including this new one.

**Result: 221 checks pass, 0 failures — the highest-value check in the repo
(`CLAUDE.md`'s own words) actually ran, for the first time today, against
everything built across all four of today's sessions.** This retroactively
answers the "unverified against the live RLS penetration suite" caveat on
D-152, D-155 and D-156: `0055`, `0056`, and this file are no longer
hand-reviewed-only. `0054` remains superseded and was never re-tested on
its own (it no longer exists as a live policy — `0056` and `0055` together
are what runs).

STATUS.md rows 13 and 16 are updated from "needs running" / "needs
building" to reflect this. Whoever next finds `postgis` unavailable in a
fresh sandbox should not assume it is permanently unavailable — it was one
`apt-get install` away here, and this environment note may not hold for
every future one.

---

## Notes for whoever picks this up next

- `pnpm --filter @pam/db test` is the highest-value check in the repo. It is the
  only thing standing between a policy edit and a privacy breach.
- The transparency screen is a promise to people with very little reason to
  trust a promise. If you widen what admins can see, change
  `packages/config/transparency.ts` first, watch the tests fail, and tell members
  before it ships.
- `reviewedBy: ''` on every SMS template is deliberate. Do not fill those in to
  make a test pass.
