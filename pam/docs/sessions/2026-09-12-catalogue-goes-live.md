# 2026-09-12 — The catalogue goes live, and what was standing in its way

**Phase:** 0 → 1 · **Sessions so far:** 3

Will said "let's start using Supabase". The database had been live for two
sessions with 525 imported providers in it, and the app had never read a row of
it. Making that happen turned out to be mostly a privacy question, not a query
question.

## What changed

**`/places` is the first screen backed by real data.** It calls one RPC,
`services_near(lat, lon, category, limit, max_meters)`, and renders whatever
comes back. There is no fixture behind it and no fallback list.

The RPC is `security invoker`, which is the part worth remembering: RLS decides
what comes back, using the same policy set the penetration suite tests. The app
cannot widen its own access by asking differently, and the signed-in version of
this screen will need no second code path. It returns metres, leaving formatting
to `distanceLabel()` (D-043), and returns `has_hours` as a boolean rather than
the hours, so a screen can tell it must fall back to Google without ever being
handed something it might render as an open/closed claim (D-044).

The origin is City Hall until onboarding asks where someone is staying, and the
screen says so — "Near City Hall, Philadelphia". "Near you" when PAM does not
know where "you" is would be the same kind of quiet lie as the open/closed chip.

## What was wrong, and what missed it

**PAM was labelling 525 providers with a health subcategory.** The DBHIDS ingest
wrote `subcategory = 'health_counseling'` on every row. 0016 and 0017 had both
reasoned carefully about disclosure — withholding `service_type` by column
grant, flagging provider names that disclose — and then the ingest quietly added
a condition label of PAM's own, on every row, three migrations earlier than the
migration that explained why that was forbidden.

An invariant test existed for exactly this ("no field PAM writes names a
condition") and it passed, because its regex looked for `mental health` and
`substance` and the value was `health_counseling`. The test was checking for the
words the *source* used, not for the concept. It now asserts the stronger and
simpler thing: an imported row carries no subcategory at all, because the feed
gives no honest basis for one.

**The entire catalogue was invisible.** Every imported row was flagged
`needs_review`, and the published-catalogue policy hides flagged rows. So the
correct answer to "show me places near me" was, until today, an empty list —
from a database holding 525 of them, with nothing in the logs to say why.

Nothing caught it because the two halves were tested separately and both passed:
the import test asserted rows land in the review queue, the RLS test asserted
the queue is hidden from members. Each was right. Together they meant no member
could ever see an imported place, and no test asked the end-to-end question.

**The distance rounding was only tested at one end.** `distanceLabel` had tests
for the float artifact; the first real row through it was 222.57 m, which is
0.1383 miles. It rendered "0.1 miles" correctly, but nothing had proven that
until a real row existed. The e2e now pins both ends: 222.57 m and the 2896.5 m
that reproduces the original `1.7999…`.

## Decisions

- **D-045** — an import adds no condition label of its own.
- **D-046** — the review queue guards PAM's words, not the city's facts.
- **D-047** — one RPC, `security invoker`, is how the app reads the catalogue.
- **D-048** — CI builds against a stub Supabase URL, not the real project.

## Verified

| Check | Result |
|---|---|
| `pnpm -w typecheck` | 5/5 packages |
| `pnpm --filter @pam/config test` | 142 tests |
| `pnpm --filter @pam/ui test` | 39 tests |
| `pnpm --filter @pam/db test` | 100 checks |
| `playwright test` (3 projects incl. dark) | 57 checks |
| `node scripts/check-bundle-budget.mjs` | 483.4 kB of 500 kB, 16.6 kB spare |
| `services_near` as the `anon` role, live | 5 nearest rows, correct distances, no withheld columns |
| Supabase security advisors | no new findings; the three unpinned `search_path` warnings fixed in 0021 |

**Not verified in a browser against the live database.** This container cannot
reach `*.supabase.co` — the agent proxy answers 403 to CONNECT, the same
blockage that put the DBHIDS fetch inside `pg_net`. The browser checks therefore
stub the RPC transport with the exact payload the live function returned as the
`anon` role. The query itself was verified against the real project; what has
not been exercised end-to-end in one process is browser → network → PostgREST.

## Left undone

- **No category filter on `/places`.** All 525 imported rows are
  `family_services`, so two of the three filters would be empty. It belongs with
  the second import source.
- **No location.** City Hall is hardcoded. Onboarding's ZIP step (§10) is what
  replaces it; browser geolocation is the wrong first ask for this audience.
- **Save does nothing on the real screen.** It needs a signed-in member.
- **The five-tab member shell** is still unbuilt (icons and HelpBar exist).
- **Security groundwork**: RLS helpers still sit in `public` and are exposed as
  RPCs (D-025); write policies still ride on `for all` (D-026). The advisor
  output is dominated by these two.
- `pnpm -w lint` still fails: `next lint` has no ESLint config and prompts for
  setup. CI does not call it.

## Needs a human

- **A Google Places API key.** Unchanged and now more visible: every card on a
  real screen falls back to a Google *search* rather than a listing, and no card
  can show hours.
- **An admin account**, still the only thing between this and a usable pilot.
- **A host for the web app**, so `/places` can be opened on a phone.
- **A second import source.** The catalogue is behavioural-health providers
  only, presented under a neutral category with no description. That is honest
  but thin: a member browsing "Home and family" sees names they cannot tell
  apart. Food, housing and ID/documents sources would make the screen useful.
