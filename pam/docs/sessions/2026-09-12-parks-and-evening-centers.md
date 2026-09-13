# 2026-09-12 — Recreation sites, evening centres, and a partner verified

**Phase:** 1 · **Sessions so far:** 6

Three asks from Will: Parks & Recreation for the family category, the Department
of Human Services' family page as another source, and verify OIC.

## What changed

**166 Parks & Recreation program sites.** Rec centres are back, but from a
different layer than last time. 0022 took them from the City Facilities asset
register, which counts basketball courts and playground equipment as
"recreation" — 205 rows, most of them not places with anyone in them — and 0024
threw them out. The department publishes its own list of *program sites*: 168
points, staffed, with programming. That is the thing a member can walk into and
what the locations page Will linked is actually built on.

**Six Community Evening Resource Centers**, entered by hand with addresses and
phone numbers. One per part of the city, open in the evening as an alternative
to a young person being taken into custody.

**OIC Philadelphia is verified.** `verified_by` stays null — there is no admin
account to point at, and inventing an id would make the audit trail worse.

**Three more disclosing words.** `juvenile`, `incarcerat` and `domestic
violence`. Every existing row was re-checked, not left at whatever the old rule
decided.

## What was wrong, and what missed it

**An address can be borrowed from the wrong park.** The program sites carry no
address and the properties layer does, so the two have to be matched. By name
alone only 87 of 168 match, because the layers punctuate differently. Matching
by nearest centroid instead gets 168 of 168 — and that number is the trap:
"Wissinoming Park" takes the centroid of Margaret Tartaglione Park 102 metres
away and inherits its address.

The rule is now spatial *with a name guard*: nearest centroid within 400m,
accepted only on a normalised name match or within 60m. 161 get an address, 7
get none. Nothing would have caught the bad match except reading the output —
which is the second time this project has been saved by looking at the rows
rather than the totals (the first was the Rosenbach, D-050).

**The disclosure list only knew about health.** It was drawn from one source and
had never been tested against another. "Support for incarcerated parents" and
"Get help with domestic violence" both cleared it. The domestic violence case is
the one that matters most and was the least likely to be noticed, because
nothing in the behavioural-health data resembles it.

**The import register refused a hand-curated source.** `service_imports` allowed
only machine formats, so the DHS entry could not be recorded at all. The
constraint now accepts `manual`: the next person asking "did anyone look at
DHS?" should not get a different answer depending on whether a robot did the
reading.

## Decisions

- **D-056** — rec centres come back, from the department's own list.
- **D-057** — an address is only borrowed when the match is safe to believe.
- **D-058** — three more words that give somebody away.
- **D-059** — DHS gave six places and a gap worth naming.
- **D-060** — OIC is verified, with no admin to sign it.

## Verified

| Check | Result |
|---|---|
| `pnpm -w typecheck` | 5/5 packages |
| `pnpm --filter @pam/config test` | 142 tests |
| `pnpm --filter @pam/ui test` | 43 tests |
| `pnpm --filter @pam/db test` | 122 checks |
| `playwright test` (3 projects incl. dark) | 81 checks |
| `node scripts/check-bundle-budget.mjs` | 483.8 kB of 500 kB |
| Parks & Rec import, live | 166 inserted, 2 skipped as duplicates, 7 without an address |
| Catalogue, live | education 52 · workforce 6 · family 697 (342 walk-in and visible) |
| A North Philadelphia query, live | evening centre, rec centre, playground and health providers, correctly ordered |

## Left undone

- **A service that is not a place.** Most of what DHS offers families — housing
  help, parenting classes, support for incarcerated parents, domestic violence
  help — is citywide and has no address. PAM cannot list any of it. This is now
  the most valuable thing that could be built next, and it is a product change,
  not an import: a second surface that is not sorted by distance.
- **Still no descriptions** on any place.
- **Hours are stored but never shown**; only the six OIC rows have any.
- Save still needs a signed-in member; the five-tab shell is still unbuilt;
  `pnpm -w lint` still has no ESLint config.

## Needs a human

- **A Google Places API key** — 749 places have no hours and no phone.
- **An admin account.**
- **A host for the web app.**
- **A decision on citywide services** — see Left undone. Worth Will's view on
  whether they belong on the places screen at all or need their own.
