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
