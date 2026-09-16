# 2026-09-16 — What each place is

**Phase:** 1 (member-facing) · **Sessions so far:** 11

Four asks in one message (Will, 16 September), plus two follow-ups:

1. Dummy data for hours and open/closed, easy to swap when `enrich-places` is
   green-lit — the Google Maps key is already in Supabase secrets, and the
   function is deliberately deferred until nearer kick-off.
2. A short description for every place, 200 characters or less, from the source
   files or published research — **not** dummy data, it ships. Plus the website
   where there is one.
3. A profile screen for each place.
4. A simpler card: name, distance, open or closed, the sentence, and Save;
   everything else one tap inside, with the secondary actions made visible.

Then: "Mark if inside a school", and "Make it visible to users".

## What changed

**Three migrations, all applied live.**

- **0050** writes `description_plain` for all 754 active places, adds
  `audience` (`students` | `youth`) with a check constraint and its own
  column-level GRANT, tightens `services_description_is_short` to 200
  characters, and ends by clearing `needs_review` — but only for rows PAM
  itself wrote and no provider has edited. The descriptions come from the
  city's `service_type` / `park_name` / `asset_name` fields; the twelve
  hand-added places were researched against published sources (the evening
  centres are ages 10–17 and run 7pm–2am; OIC is tuition-free — both facts are
  now on the screen).
- **0051** makes `services_near` and `service_detail` return `lat`/`lon`.
- **0052** widens `saved_places_mine` to the same columns, so the saved list
  draws the search card rather than a lesser one.

**`@pam/config/hours`** is the swap point for `enrich-places`:
`USE_PLACEHOLDER_HOURS` is one boolean. `hoursFor()` returns real hours when a
row has them and a deterministic stand-in when it does not, tagged
`isReal: false`; `openState()` answers `unknown` rather than `closed` when it
cannot tell. Four shapes chosen by a hash of the id, so a place does not change
its hours between two screens, and the past-midnight wrap is handled because
the evening centres close at 2am.

**`PlaceCard`** is now name, distance, open/shut, two clamped lines of
description, and Save. The whole card is the link into `/place/?id=…` via a
stretched-link pseudo-element on the heading anchor, with Save layered above
it — one link and one button in the accessibility tree.

**`PlaceDetail` and `/place/`** are new: badges, the description, "How to get
there" as the only primary action, the address, the week's hours with the
sample-hours note, then call / hours on Google / website / save / share /
report as full-width labelled rows.

## What was wrong, and what missed it

**`services_near` never returned the point it sorted by.** The RPC took a
member's location, ordered by distance and returned `meters` — and no
coordinates. So `directionsHref()` had been silently falling back to the
address string on every card in the product, and 0023 already records that the
city feeds keep geometry current while letting address text rot. Nothing caught
it because the browser test asserted the link *shape*, and a link built from an
address is the same shape as one built from a point. The test now pins
`destination=39.94738%2C-75.175` against a row that has coordinates, and the
address only as the fallback for a row that has none.

**A database test that had never actually tested anything.** My new check that
a 201-character description is rejected ran the `UPDATE` as a member, who has
no `UPDATE` privilege on `services` — so it touched zero rows and passed,
proving nothing. It needed `set local role postgres`. Worth looking for the
same shape elsewhere: a privilege-less write that "passes" is indistinguishable
from a constraint that works.

**A latent ordering bug in the saved-places test.** It picked a fixture with
`select id from public.services where geo is not null limit 1` and no
`order by`, while earlier tests deactivate and flag rows. 0050 rewrote every
row, changed the heap order, and the test failed — on data, not on behaviour.
Now ordered, and filtered to a row that is actually visible.

**The lazy chunk that was not lazy.** The build went 1.4 kB over §12's budget.
`SavedStripLazy` was doing `import('@pam/ui')`, which pulls the barrel and
therefore the whole library, so the split had never done anything — webpack
hoisted the shared parts back into the first load. Subpath exports fixed it,
and taking `hours.ts` out of `@pam/config`'s barrel recovered the rest. Ends at
0.4 kB spare. Nothing measures this except the budget script, which is the only
reason it surfaced.

**Two regressions I introduced in the link builders**, both caught by existing
tests: `typeof NaN === 'number'` let a NaN coordinate build
`destination=NaN,NaN` (now `Number.isFinite`), and I replaced the comma in
`${name}, ${address}` with a space, which changes what Google searches for.

**Duplicate heading and contradictory copy**, both found by looking at a
screenshot rather than by a test. `/place/` rendered the name in `PageTitle`
*and* as an `<h1>` inside `PlaceDetail`; the `name` prop is now optional. And
the places footer still read "We do not have opening hours yet" directly under
"Open until 5:00 PM".

## Decisions

- **D-120** — a place gets a screen of its own; the card answers one question.
- **D-121** — PAM says what a place does, in PAM's own words. Reverses the
  screen half of 0017 and D-045; the SMS half stands. Recorded as **A11**.
- **D-122** — opening hours are a stand-in behind one flag, and the screen says
  so. Supersedes D-044 for the demo; nothing invents an "Open now" from nothing.
- **D-123** — who may actually walk in is a badge, above everything else.
- **D-124** — `services_near` never returned the point.
- **D-125** — a subpath export, not a barrel, is what makes a lazy chunk lazy.

The only thing put back to Will was the neutrality question: what PAM's own
words may say about the 524 behavioural-health places, given 0017. His answer:
say what it does, everywhere.

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/db test` | All database checks passed |
| `pnpm --filter @pam/ui test` | 66 passing |
| `pnpm --filter @pam/config test` | 211 passing |
| `pnpm -r typecheck` | clean |
| `node scripts/check-bundle-budget.mjs` | within budget, 0.4 kB to spare |
| Playwright, all three projects | 417 passing, 0 failing |
| Live, after 0050 | 754 active · 754 described · 0 hidden for review · 230 with websites · 361 audience-marked · longest description 152 chars |
| `get_advisors` after 0050–0052 | no new findings; the standing `SECURITY DEFINER` warnings are unchanged (those functions guard inside, see 0007) |

## Left undone

- `enrich-places` is not written. Deferred by Will until nearer kick-off; the
  Google Maps key is in Supabase Edge Function secrets and `hours.ts` is the
  one line to flip.
- Journey screenshots do not yet include `/place/`.
- Nothing reviews `staff_requests`. Nobody can edit their own name or city.
- The dark-mode coral wordmark, and the PAM-team line on the transparency
  screen.

## Needs a human

- **Twilio.** STATUS said the account was in trial. Will says it is active. The
  claim in STATUS was carried forward from a 13–14 September finding rather
  than re-checked, and this session did not verify it either way — STATUS now
  records it as Will's word and unverified here, which is the honest state.
- The descriptions are PAM's words about somebody else's organisation. They are
  sourced, not invented, but a provider reading their own entry is the real
  test, and no provider has read one yet.
