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
| W-1b | **Which Philadelphia datasets, and the PA 211 agreement** | §5.2 | Phase 1 importer | City is decided (Philadelphia). Four sources are registered but `is_active = false` — the endpoints could not be verified from the build environment, and PA 211 needs a data-sharing agreement. See D-028. |
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

PA 211 additionally needs a data-sharing agreement before use. It is the widest
source of family services in the region and the one most worth having.

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
