# Changelog

## [0.8.0] — 2026-09-13 · Reminders are something you ask for

### Changed — the tick box that starts unticked

Text reminders are now a separate, deliberate yes. The sign-in screen asks, the
box starts empty, and signing in works whether or not it is ticked — nobody has
to accept texts to get help. A person who never ticks it still gets every
sign-in code they ask for and nothing else.

### Added — notifications have a screen

Reached from a bell in the case manager's header, with Back where every phone
puts it. What has happened, when, and a tick to clear it.

## [0.7.0] — 2026-09-13 · A working front door

### Added — sign-in actually signs you in

A code reaches a real phone. One screen for everybody: member, program manager,
case manager, super admin. The form sits in a card with a single button, the
mark is centred above it, and what PAM will text you is said on the screen
before you hand over a number — in both languages.

### Added — Privacy and Terms

Two pages anybody can read before they join, each with a contents list that
marks the section being read. Plain sentences, no defined terms. The privacy
page restates, word for word, the same limits the app shows a member after they
join — and a test fails if the two ever disagree.

### Fixed — an account created by the seeding script could not sign in

It failed looking the person up before it ever reached the text message, with an
error that pointed nowhere near the cause.

## [0.6.0] — 2026-09-12 · The dispatcher, and who hears about a flag

### Added — PAM can send a text message, and deliberately does not

The dispatcher is live and wakes every five minutes to send what is due. It
refuses every message today, because no human has signed off the copy — and it
writes the refusal onto the message rather than going quiet. Signing the copy is
what turns it on; nothing has to be rebuilt.

Quiet hours (21:00–07:00, per person), a member who replied STOP, and a member
with no phone number are all decided in the database rather than in the sender,
where they cannot be redeployed away. Two overlapping runs can never both send
the same reminder.

### Added — a flag reaches the people it is about

A flagged place tells every super admin and the case managers of the members who
saved it. A reported message tells every super admin and the case manager of the
member the report is about — the sender, not the person who reported it. Nobody
else is told, and the notice carries no words anybody wrote.

### Fixed — a message could be recorded as sent when it never was

The failure path in the dispatcher could itself fail, leaving a message marked
sent that nobody received. Found by running the deployed sender against the real
database rather than by a test.

## [0.5.0] — 2026-09-12 · Rec centres, evening centres, and a verified partner

### Added — 166 Parks & Recreation program sites

From the department's own list of staffed sites with programming, not the
asset register that counts basketball courts. Addresses are borrowed from the
properties layer only when the match is safe to believe: a name match once
punctuation is stripped, or a centroid within 60 metres. Seven sites get no
address rather than the wrong one.

### Added — the city's six Community Evening Resource Centers

Open in the evening as an alternative to a young person being taken into
custody, with addresses and phone numbers. The rest of the Department of Human
Services' family page is citywide programmes with no location, which PAM cannot
show yet without pretending they are somewhere.

### Added — OIC Philadelphia is verified

### Security — three more words that give somebody away

`juvenile`, `incarcerat` and `domestic violence` join the list of names that
must never appear in a text message or a push notification. A notification
naming a domestic violence service can reach the person somebody is getting away
from. Every row already in the catalogue was re-checked against the new rule.

## [0.4.0] — 2026-09-12 · Work and money, and a place to start from

### Added — OIC Philadelphia fills the Work and money category

Six programmes at 1231 N Broad St: information technology, culinary arts,
digital media and audio engineering, insurance, healthcare, and reentry support.
Curated from the organisation's own pages rather than imported, and marked as
such. It brings the first phone number and the first opening hours into the
catalogue — so the first card in PAM whose primary action is Call.

All three categories now have real places in them.

### Added — a member can change where the list is measured from

The area is a button, not a label. Tapping it opens a search over the city's ZIP
codes, populated before anything is typed; typing a street address looks it up
live against the City of Philadelphia's public property API, which needs no key.

The typed address goes to the city and nowhere else — not to PAM's server, not
into a log, not into a table. The chosen area is kept on the device. If the
address lookup is unavailable, the ZIP list still answers.

### Changed — only libraries are kept from the city facilities layer

205 recreation centres and 8 older adult centres were crowding out food,
housing, ID and legal help under Home and family — none of which PAM has yet.
The 52 libraries stay; the allow-list machinery is unchanged, so re-adding a
facility type is one row.

## [0.3.0] — 2026-09-12 · Libraries, and the Education category

### Added — 52 Free Library branches, and a second import source

`City_Facilities_pub` is imported through an allow-list, `city_facility_map`:
libraries to Education, city health centres and staffed recreation and older
adult centres to Home and family. The other ~2,900 rows in that layer —
playgrounds, statues, fuel pumps, police stations, and a detention centre — are
skipped at import, not filtered in the UI. A database invariant asserts the
detention centre never becomes a place.

Education is no longer empty: 52 libraries, free and walk-in, which is the best
answer PAM currently has for a GED, a computer, or a job application.

### Added — category filter on `/places`

All three categories are always offered, including Workforce, which has nothing
in it yet and says so rather than disappearing.

### Fixed — walking directions could send someone to the wrong building

The city's facilities feed keeps geometry current and lets address text rot: one
library imported with correct coordinates and an address five miles away. The Go
link is now built from the place's own point, so directions and the map pin
cannot disagree. The address remains the fallback and still drives the Google
listing search.

### Fixed — duplicate and mis-filed facilities

The same building appearing as two assets is imported once. A museum filed under
`Library Specialized` is not imported as a library. "Library Branch - Santore"
reads as "Santore Library".

## [0.2.0] — 2026-09-12 · The catalogue is real

### Added — a places screen backed by Supabase

`/places` lists the nearest walk-in services from the live catalogue through one
RPC, `services_near`, which runs `security invoker` so RLS decides what comes
back. Distances are formatted by `distanceLabel()`; no card claims a place is
open, because PAM still holds no hours.

Four states, all of which the screen renders: loading, results, nothing found,
and a failed query — the last two as plain-language notices with a working phone
number, never a blank list.

### Fixed — PAM was labelling 525 providers with a health subcategory

The DBHIDS import wrote `subcategory = 'health_counseling'` on every row. A
provider's own name is theirs to keep, but the subcategory is PAM's word, and
the source gives no honest basis for one. Imported rows now carry none, and a
database invariant fails the build if that changes.

### Fixed — the whole catalogue was invisible to members

Every imported row sat in the review queue, which the public-catalogue policy
hides. The queue exists to keep unapproved plain-language rewrites off a
member's screen; these rows contain no PAM-authored prose at all. They are
published, and a trigger returns any row to the queue the moment plain-language
copy is written to it.

### Security

`name_discloses_condition`, `url_encode_component` and `google_place_url` now
pin their `search_path`.

## [0.1.2] — 2026-09-12 · Cards that only say what they know

### Fixed — a distance read `1.7999999999999998 miles`

The demo interpolated a raw float into `{count} miles`. Distance is now built by
`distanceLabel()` in `@pam/config`: rounded to one decimal, pluralised from the
rounded value, locale-formatted (so Spanish gets its decimal comma), and omitted
entirely when the number is not a real measurement. Below a tenth of a mile it
says "Less than 0.1 miles" rather than inventing precision a GPS fix lacks.

### Fixed — a card claimed "Open now" about a place Google said was closed

The chip was a hard-coded boolean in the component gallery. PAM has no hours for
any imported provider — that is why the Hours action links out to Google — so no
card claims an open state until real hours exist. The sample places are now
plainly named as examples, and the gallery says it is sample data.

### Fixed — `pnpm -w test` failed in `apps/web`

Vitest was collecting the Playwright specs. Collection is now scoped to `src/`.

## [0.1.1] — 2026-09-12 · Astryx applied, Supabase live, Philadelphia seeded

### Fixed — the design system was never applied

Will flagged that the build did not look like Astryx. It did not. Astryx puts its
theme on the subtree from React, and the app was never wrapped in `<Theme>`, so
all three stylesheets loaded with 200s and every component rendered unthemed in
browser-default serif.

Three setup faults came out with it:

- `@import '…' layer(reset)` was rewritten by Next's CSS pipeline into an
  invalid `@media layer(reset)` block, dropping the entire Astryx reset.
- `@astryxdesign/core` sat in `transpilePackages`, re-running the StyleX
  transform over its source and minting class names its shipped stylesheet does
  not contain.
- theme-neutral asks for Figtree and nothing loaded it. Self-hosted now — two
  variable subsets, 30 KB, no third-party round trip on a 3G first load.

`astryx init` had been skipped entirely and the UI built against guessed APIs.
The CLI is now a dependency and its conventions are committed at
`apps/web/.claude/CLAUDE.md`.

Three browser tests assert the theme is really applied: computed typography is
not a browser default, the theme tokens resolve, and the webfont returns 200.

### Added — Supabase project `pam`

`shobqzuhicoiymtumiaz`, us-east-1, all 12 migrations applied.

The RLS was verified rather than trusted: the applied policy set was
fingerprinted against the locally-tested one and matches exactly —
`ce9636c3b77e4827368e6575742b899c`, 73 policies on both.

### Fixed — two security findings on the live project

Supabase's advisors caught a class of hole the local suite could not see.
PostgREST exposes every `public` function at `/rest/v1/rpc/<name>`, so a
`SECURITY DEFINER` helper taking a caller-supplied id can be called with someone
else's. The policies were correct; the leak was around them.

- `member_points(<any member>)` returned that member's points balance to anyone,
  signed in or not.
- `are_buddies`, `is_blocked_between` and `feature_allowed` let a caller probe
  the social graph and another user's access controls.

Each now carries a self-participation guard, and three trigger functions have a
pinned `search_path`. Eight tests assert both halves: the probe fails, and the
legitimate reader still gets their answer.

The first attempt at the fix — revoking `EXECUTE` from `anon` — broke signed-out
reads, because a policy declared `for all` is evaluated on SELECT too. Reading
`services` evaluated the provider's *write* policy and failed with "permission
denied for function": a member not signed in could not see the places that can
help. Corrected, with a regression test covering the whole anonymous read path.

### Added — Philadelphia pilot and the support line

- Philadelphia region seeded, centred on City Hall.
- Four import sources registered, all `is_active = false`: their endpoints could
  not be verified because the build environment blocks those hosts, and an
  invented URL in a source registry is worse than an absent one.
- `app_settings` table, so the support line (+1 267 309 5265) can change without
  a redeploy. Readable signed-out, admin-writable, tested both ways.

### Verified

| Check | Result |
|---|---|
| Typecheck, 5 packages | pass |
| Unit tests (`@pam/config`, `@pam/ui`) | 133 pass |
| Database suite, local | 80 checks pass |
| Live RLS fingerprint vs local | identical, 73 policies |
| Live anonymous read attack | 0 profiles, messages, invites, audit rows |
| Browser a11y + theme, 320px and iPhone SE | 18 pass |
| First-load JS | 478 kB of the 500 kB budget |


## [0.1.0] — 2026-09-12 · Phase 0: Foundation

First commit. Everything a later phase needs, and nothing a later phase owns.

### Added

**Monorepo** — pnpm workspaces: `apps/web`, `apps/native`, `packages/db`,
`packages/ui`, `packages/config`. Versions pinned to the majors §1 fixes.

**`packages/config`** — the product's rules as code:
- three fixed service categories with their subcategories (§2.5)
- SMS templates with the §9 safety rules enforced at runtime: `PAM:` prefix,
  160 characters, no emoji, no term that reveals justice involvement, and a
  required `reviewedBy` without which nothing sends
- the §4.1 transparency contract, as the single source the screen renders from
- points, levels and badges (§8), with leaderboards and rewards off
- dignity-language rules (§0) as a checker CI runs over all copy
- English and Spanish bundles, key-for-key

**`packages/db`** — 8 migrations covering the whole §4 model, every table with
RLS enabled *and* forced:
- identity, invites, caseload, facilitations, access controls, audit log
- services with a subcategory registry an admin can edit, import bookkeeping,
  geocode cache
- the plan loop: enrollments, appointments, reminders, tasks
- people: connections, chat, buddy feed, reports, points ledger, badges
- `SECURITY DEFINER` RPCs for invite create/redeem and access changes, each
  writing to `audit_log`

**`packages/ui`** — the seven §2.4 components, composed from Astryx primitives:
`BigButton`, `PlaceCard`, `PersonCard`, `StepHeader`, `PointsBadge`, `HelpBar`,
`VoiceInput`.

**`apps/web`** — Next.js 15 + React 19, static export, Astryx theme with an
explicit cascade-layer order, StyleX compiled through PostCSS, i18n provider,
PWA manifest, and a Phase 0 demo page rendering every component against real
theme and real strings.

**`apps/native`** — Capacitor 6 config wrapping the web export, with the native
speech recogniser wired to `VoiceInput`.

**CI** — three jobs, path-scoped to `pam/**`: types + unit tests + build +
bundle budget; migrations + RLS penetration suite; browser accessibility.

### Verified

| Check | Result |
|---|---|
| Typecheck, 5 packages | pass |
| Unit tests (`@pam/config`) | 113 pass |
| Unit tests (`@pam/ui`, incl. axe) | 20 pass |
| Migrations against Postgres 16 + PostGIS | 8/8 apply clean |
| RLS penetration suite | 60+ checks pass |
| Browser a11y, 320px and iPhone SE | 12 pass, no WCAG AA violations |
| First-load JS | 455 kB gzipped of the 500 kB budget |
| Web build | static export, 2 routes |

### Fixed during the build

Four defects the tests and a screenshot caught, all recorded in `DECISIONS.md`:

- **Reminders would have silently failed to send.** Spanish `appointment_24h`
  renders at 159 of 160 characters; an ordinary longer street address pushed it
  over and made `renderSms` throw. Templates now budget each variable and
  shorten at a word boundary (D-013).
- **The mic button appeared on browsers with no speech support.** A `!== null`
  check against an `undefined` return meant every unsupported browser showed a
  control that did nothing — the opposite of what §1 requires.
- **`BigButton` rendered at 35px instead of 64px.** The StyleX layer was empty:
  a custom `babelConfig` had replaced the project config without re-listing the
  StyleX plugin, so `@stylex;` resolved to nothing and every component carried
  correct class names with no rules behind them (D-011).
- **The mic button rendered the literal word "microphone".** Astryx's `icon`
  prop takes a `ReactNode`; a bare string is a valid `ReactNode`, so it
  typechecked and the tests passed on the accessible name while the page looked
  broken. Only the screenshot caught it.

### Not included

Phase 0 scope. Phases 1–7 own these: onboarding and invite redemption screens,
the map and importer, enrollment and reminders, points award paths, chat, the
provider and admin apps, and the AI features.

No Supabase project has been provisioned — see D-003.
