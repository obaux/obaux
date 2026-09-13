# 2026-09-12 — The DBHIDS import, plain-language dead ends, and cards that stop lying

**Phase:** 0 (Foundation), tail end · **Sessions so far:** 2

Phase 0 was already complete when this session started. Everything here is
either data the pilot needs, or a fix for something that only shows up when a
person looks at the screen.

## What changed

**525 DBHIDS provider locations are imported.** Philadelphia's Department of
Behavioural Health and Intellectual disAbility Services publishes its provider
directory; `ingest_dbhids(jsonb, uuid)` loads it with the privacy posture the
rest of the schema uses — `source_attributes` is withheld from `anon` and
`authenticated` by column-level GRANT, because the raw feed carries programme
labels that would disclose why someone is at a place. The outbound fetch runs
from the database via `pg_net`: the build environment cannot reach those hosts,
the database can.

**Members reach hours through Google.** Every imported record has `hours = null`
and `phone = null` — the feed has neither. Rather than show a service with no way
to find out when it is open, the PlaceCard's first action adapts: **Call** when
there is a phone, **Hours** when there is not, opening the place's Google
listing. `google_place_url()` in SQL and `googlePlaceHref()` in TypeScript build
byte-identical URLs, with a test pinning them together, so a link never differs
depending on which side produced it.

**Dead ends explain themselves.** Fourteen error and empty conditions in
`packages/config/notices.ts`, each with copy that says what happened, why, and
what to do next. An out-of-region admin no longer gets a blank screen; it says
the region is not covered yet.

**Help became a screen.** The floating help bar and the bottom tab bar were
competing for the same space, so Help is now a short button that routes to
`/help`, which explains what help is available and offers the support contact.
The bottom bar gets its space back for the five member tabs.

**Distance and open/closed stopped lying.** See D-043 and D-044.

## What was wrong, and what missed it

**`member_points(<any uuid>)` returned any member's points.** PostgREST exposes
`security definer` functions as RPCs, and the function trusted its argument.
Supabase's own advisors found it; the local database tests did not, because they
tested the policies and never called the RPC as a stranger. Self-participation
guards now sit inside the functions.

**The fix then broke signed-out reads.** Revoking EXECUTE from `anon` also broke
the public `services` read, because a `for all` policy is evaluated on SELECT
too. Restored in `0012`. Splitting write policies off `for all` is still open
(D-026).

**Dark mode was illegible.** `body` had no background of its own, so in dark mode
`light-dark()` resolved the text to near-white against the browser's white
canvas. Secondary text measured 2.67:1. Every automated check had run in light
mode only — there was no dark project in the Playwright config until this
session. There is now (`dark-320`), and it fails on the contrast.

**`1.7999999999999998 miles` reached a card.** The demo interpolated
`(index + 1) * 0.6` straight into `{count} miles`. Nothing caught it because
nothing formatted numbers at all: there was no formatter to test. `distanceLabel()`
now exists and a test pins that exact expression.

**A card claimed "Open now" about a place that was closed.** The chip was a
hard-coded boolean in the demo gallery, and the sample name was plausible enough
that the reviewer went looking for it in Google Maps. Two failures in one: the
product asserted something it had no data for, and sample data was not
recognisable as sample. Both fixed; the names are now "Example Learning Center"
and the section says it is sample data.

**Vitest was collecting the Playwright specs.** `pnpm -w test` failed in
`apps/web` on `test.describe` from the wrong runner. CI never saw it because CI
runs `--filter @pam/config --filter @pam/ui`. `apps/web/vitest.config.ts` now
scopes collection to `src/`.

## Decisions

- **D-032** — no phone means the first action is Hours, via the Google listing.
- **D-041** — `body` paints an explicit themed background; dark mode is tested.
- **D-042** — the review build is a static export; interactivity is the cost.
- **D-043** — distance is formatted in one place and rounds honestly.
- **D-044** — PAM does not say a place is open until it knows the hours.

## Verified

| Check | Result |
|---|---|
| `pnpm -w typecheck` | 5/5 packages |
| `pnpm --filter @pam/config test` | 142 tests |
| `pnpm --filter @pam/ui test` | 39 tests |
| `packages/db/scripts/test-db.sh` | 98 database checks — last run when the migrations changed, not re-run since (no local Postgres in this environment; CI runs it) |
| `playwright test` (3 projects incl. dark) | 42 checks |
| `pnpm --filter @pam/web build` | first load 432 kB of the 500 kB budget |
| DBHIDS rows in `services` | 525, counted at import time |

Not verified: `pnpm -w lint`. `next lint` in `apps/web` has no ESLint config and
prompts for setup, so it fails in a non-interactive shell. It has never run; CI
does not call it.

## Left undone

- **The five-tab member shell.** The icons and the compact HelpBar exist; the
  dock container is unbuilt. Tabs should be real routes — Astryx's `Tab` renders
  as an anchor.
- **Notices are only rendered in the demo.** Nothing wires them to a real query
  failure yet.
- **Security groundwork for Phase 1**: move RLS helpers into a `private` schema
  (D-025), split write policies off `for all` (D-026).
- **Bundle headroom is thin.** 68 kB spare, and Astryx's i18n catalogue ships
  strings for every component in the library.

## Needs a human

- **A Google Places API key.** `place_id` is null on all 525 records, so the
  Hours link is a search rather than a direct listing, and PAM cannot populate
  hours or ever show an open/closed state.
- **An admin account.** Still nothing between the current state and a usable
  sign-up but this.
- **A host for the web app.** GitHub Pages for this repository belongs to the
  garage sale; a real review URL needs Vercel or Netlify.
