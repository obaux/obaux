# 2026-09-12 — Work and money, and letting a member say where they are

**Phase:** 1 · **Sessions so far:** 5

Two asks from Will: use OIC Philadelphia for the Workforce category and keep
only the libraries from the city facilities layer; and make the hardcoded "Near
City Hall" something a member can change.

## What changed

**All three categories have real places in them.** OIC Philadelphia — a 501(c)(3)
at 1231 N Broad St running free job training and a reentry programme — is
entered as six services, one per programme. It is a website, not a feed, so this
is curated rather than imported and is recorded as `source = 'manual'`; every
fact came off the organisation's own pages, including the schema.org
`LocalBusiness` block that carries its phone number and hours.

That block is worth noting on its own: it is the first phone number and the
**first opening hours** in the catalogue, which makes these the first cards in
PAM whose primary action is Call rather than a Google lookup. The hours shape is
documented in the migration. It still licenses no "Open now" chip — see D-044,
unchanged.

**Only libraries remain from the city facilities layer.** The 169 rec centres,
health centres and older adult centres are gone. The allow-list table and the
ingest are untouched; re-adding a facility type is one INSERT.

**The area is now a control.** Closed, it reads "Showing places near City Hall"
and is itself a button. Open, it is a text input over the city's 46 ZIP codes
plus City Hall — populated before anything is typed — and, if what is typed
looks like a street address, a live lookup against Philadelphia's public
property API, which needs no key and allows cross-origin requests.

## What was wrong, and what missed it

**Two RLS assertions counted every row in a table.** Adding six real services
and one org broke `anon can read published services`, `member sees only
reviewed, active services` and `anon can read orgs` — tests that were asserting
"the fixture has three rows" by counting the whole table. They passed for four
sessions because the catalogue had never been seeded by a migration before. Now
scoped to the fixture ids, which is what they were always trying to say.

**A test asserted a facility type that Will had just removed.** The city
facilities fixture covered the older adult centre rename; 0024 deleted that type
from the allow-list, so the row stopped importing and the count assertion
failed. The fix was to assert the new rule — only libraries — rather than to
restore the type.

**The picker's listbox borrowed the input's label.** `aria-label` on the results
list repeated "Where are you staying now?", so the input and the list were two
elements with the same accessible name. Caught by a Playwright strict-mode
violation rather than by axe, which does not consider that an error.

## Decisions

- **D-052** — libraries only, from the city facilities layer.
- **D-053** — OIC Philadelphia is curated, not imported, and gets a row per programme.
- **D-054** — the area picker asks the city, and PAM remembers nothing.
- **D-055** — the area is the button.

## Verified

| Check | Result |
|---|---|
| `pnpm -w typecheck` | 5/5 packages |
| `pnpm --filter @pam/config test` | 142 tests |
| `pnpm --filter @pam/ui test` | 43 tests |
| `pnpm --filter @pam/db test` | 116 checks |
| `playwright test` (3 projects incl. dark) | 81 checks |
| `node scripts/check-bundle-budget.mjs` | 483.8 kB of 500 kB |
| Catalogue, live | education 52 · workforce 6 · family_services 525 (170 walk-in) |
| `services_near('workforce')` as `anon`, live | 6 OIC rows, phone and hours present |
| `search_areas` as `anon`, live | 46 ZIPs + City Hall; empty query returns rows |

The address lookup was verified against the live city API from the database
(`access-control-allow-origin: *` confirmed on the response headers) and
exercised in the browser against a stubbed response, since this container cannot
reach either host.

## Left undone

- **No descriptions, still.** Every place is a name, an address and a category.
  The §5.2 rewrite step is what fills that.
- **Family services is one source.** 525 behavioural-health providers and
  nothing for food, housing, ID or legal help — the gap the rec centres were
  papering over. This is now the most visible hole in the catalogue.
- **The picker cannot use the phone's location.** Deliberate for now: asking a
  returning citizen for GPS on first use is the wrong first ask. Worth revisiting
  as an explicit opt-in once there is an account.
- **Hours are stored but never shown.** Nothing reads `hours` yet.
- Save still needs a signed-in member; the five-tab shell is still unbuilt;
  `pnpm -w lint` still has no ESLint config.

## Needs a human

- **A Google Places API key** — 583 places still have no hours and no phone.
- **An admin account.**
- **A host for the web app**, so the picker can be used on a real phone.
- **A food/housing/ID source for Family services**, which is now the thinnest
  part of the catalogue rather than the thickest.
- **Whether OIC should be `verified`.** It is entered with `verified = false`:
  §6.4 says an org badge shows only once a human has verified the organisation,
  and reading a website is not verification. The places list either way; only
  the mentor badge waits on it.
