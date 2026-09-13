# 2026-09-12 — Libraries fill the Education category, and a link that sent people to the wrong building

**Phase:** 1 · **Sessions so far:** 4

The catalogue was one source deep and entirely behavioural-health providers,
presented under a neutral category with no descriptions: honest but close to
useless, since a member browsing "Home and family" saw 391 names they could not
tell apart. This session added the second source.

## What changed

**52 Free Library branches, and the Education category is no longer empty.**
`City_Facilities_pub` is Philadelphia's broadest place layer — 3,197 rows — and
almost none of it is a service. It is playgrounds, statues, salt sheds, fuel
pumps, police stations, and `Detention Center Adult`.

So the import is an allow-list, in a table (`city_facility_map`) rather than a
`CASE`: seven facility types, everything else skipped at import rather than
filtered in the UI. One missed UI filter in a product built for people leaving
prison shows somebody a prison; a database invariant now asserts that cannot
happen.

Libraries are the whole Education category on day one, and they earn it: free,
walk-in, no enrolment, and the best answer PAM has to "I need a GED, a computer,
or to apply for a job, and I have no money". City health centres and staffed
recreation and older adult centres went to Home and family — 221 facilities in
all, alongside the 525 DBHIDS rows.

**`/places` has a category filter.** All three categories are always offered,
Workforce included, which has nothing in it and says so.

## What was wrong, and what missed it

**The Go link could walk somebody to the wrong building.** `The Rosenbach Museum
& Library` imported with geometry on Delancey Street — correct — and an
`asset_addr` five miles away on E Allegheny. The city maintains the point and
lets the address text rot, and nothing in the row says which to believe.

PAM was building walking directions from the address. Nothing caught it because
every test fixture had an address and a location that agreed; the first real
source with rotted text was the first to break it. Directions are now built from
the place's own point, which also means they cannot disagree with the map pin,
since both read the same column. The address is still shown, still used for the
Google search, and still the fallback when there is no geometry.

**A museum imported as a library.** The city files the Rosenbach under
`Library Specialized`, alongside the Library for the Blind and Physically
Handicapped. One is free and public; the other charges admission. The allow-list
was written at the level of facility type, which was one level too coarse for
that type.

**The same building imported twice.** `Older Adult Center - West Oak Lane` is
two asset rows at identical coordinates. Correct for an asset register, wrong
for a list of places to go.

**A fix broke the names it was meant to improve.** Generalising the "Type -
Place" rename put the library rule second, so "Library Branch - Santore" became
"Santore Library Branch". Caught by reading the output of the import rather than
by a test — the test came after.

## Decisions

- **D-049** — the allow-list is the import.
- **D-050** — directions are built from the point, not from the address.
- **D-051** — all three category filters are shown, including empty ones.

## Verified

| Check | Result |
|---|---|
| `pnpm -w typecheck` | 5/5 packages |
| `pnpm --filter @pam/config test` | 142 tests |
| `pnpm --filter @pam/ui test` | 43 tests |
| `pnpm --filter @pam/db test` | 108 checks |
| `playwright test` (3 projects incl. dark) | 63 checks |
| `node scripts/check-bundle-budget.mjs` | 483.5 kB of 500 kB |
| Import, live | 273 facilities, 5 skipped by the allow-list and the exclusions |
| Catalogue, live | education 52 · family_services 746 (391 walk-in and visible) |
| `services_near` as `anon`, live | correct rows per category, coordinates returned |
| Supabase security advisors | no new findings; the `search_path` warnings from last session are gone |

Rendering was again verified with the RPC transport stubbed by the real payload,
because this container still cannot reach `*.supabase.co`.

## Left undone

- **Workforce is empty.** No city facility type maps to it honestly — career
  centres are not in this layer. It needs its own source.
- **No descriptions anywhere.** Every row is a name, an address and a category.
  The §5.2 rewrite step is what fills that, and it needs an LLM pass and an
  admin review queue — which now exists and is enforced by a trigger.
- **Addresses are not validated.** The Rosenbach was caught by eye. Nothing
  systematically checks that a row's address and its point agree; a geocoding
  pass could, and would need a key.
- Location is still City Hall; Save still needs a signed-in member; the five-tab
  shell is still unbuilt; `pnpm -w lint` still has no ESLint config.

## Needs a human

- **A Google Places API key** — now the single biggest gap. 798 places, no hours,
  no phone numbers, every "Hours" button a search rather than a listing.
- **An admin account**, still the only thing between this and a usable pilot.
- **A host for the web app.**
- **A workforce source**, and a judgement call on whether rec centres belong in
  the catalogue at all — they are real places with programmes, but 205 of them
  under "Home and family" crowds out food, housing and ID help, which are what a
  member is most likely to be looking for and which PAM still has none of.
