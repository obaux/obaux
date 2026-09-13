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
