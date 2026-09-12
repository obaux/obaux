# 2026-09-12 — Phase 0 foundation, and getting Astryx to actually apply

**Phase:** 0 (Foundation) · **Sessions so far:** 1

First build session. PAM went from nothing to a verified foundation with a live
database.

## What changed

**The monorepo** lives in `pam/`, not at the repository root, so the garage sale
site in `site/` and its Pages deploy stay untouched. Both CI workflows are
path-scoped so neither can trigger the other.

**`packages/config`** holds the product's rules as code rather than prose: the
three fixed service categories and their subcategories, SMS templates whose §9
safety rules are enforced at runtime, the §4.1 transparency contract, points and
levels, the §0 dignity-language checks, and English + Spanish bundles.

**`packages/db`** is thirteen migrations covering the whole §4 model with RLS
enabled *and forced* on every table. Policies live in one file because a policy
set is only reviewable as a set. `points_ledger` and `audit_log` reject UPDATE
and DELETE through triggers rather than merely lacking policies — `service_role`
bypasses RLS and that is what Edge Functions run as.

**`packages/ui`** is the seven §2.4 components on Astryx primitives.
**`apps/web`** is Next 15 + React 19 as a static export; **`apps/native`** is the
Capacitor 6 config that wraps it.

**Supabase went live** mid-session once Will approved it: project `pam`
(`shobqzuhicoiymtumiaz`, us-east-1). Rather than trust the transcription, the
applied policy set was fingerprinted against the locally-tested one — identical,
`ce9636c3b77e4827368e6575742b899c`, 73 policies on both.

**Philadelphia** is the pilot city: region seeded, four import sources
registered.

## What was wrong, and what missed it

Four bugs survived a passing build. Three of them also survived the tests.

**The design system was never applied.** Will looked at a screenshot and said it
did not look like Astryx. It did not. Astryx applies its theme from React via
`<Theme>`; importing the three stylesheets is necessary and not sufficient. They
all loaded with 200s and every component rendered unthemed, in browser-default
serif. The build passed, axe passed, and the unit tests passed on accessible
names. Only an eye caught it.

The root cause behind the root cause: `astryx init` was never run and the UI was
built against guessed APIs. The CLI is now a dependency and its generated
conventions are committed at `apps/web/.claude/CLAUDE.md`. Reading them is what
found the provider. Three browser tests now assert the theme genuinely resolves.

Three more setup faults came out with it: `@import '…' layer(reset)` was being
rewritten by Next's CSS pipeline into an invalid `@media layer(reset)` block,
silently dropping the entire reset; `@astryxdesign/core` sat in
`transpilePackages`, re-running the StyleX transform over its source and minting
class names its own shipped stylesheet does not contain; and theme-neutral asks
for Figtree while nothing loaded it.

**Reminders would have silently failed to send.** The Spanish 24-hour reminder
renders at 159 of 160 characters with a 31-character address. Any longer address
pushed it over, `renderSms` threw, and the reminder never went out. A safety gate
that throws at send time is a feature that does not happen. Templates now budget
each variable and shorten at a word boundary; the maps link in the same message
carries the exact destination anyway.

**`member_points(<any member>)` leaked every member's points balance.** Supabase's
security advisors caught this on the live project; the local suite could not see
it. PostgREST exposes every `public` function at `/rest/v1/rpc/<name>`, so a
`SECURITY DEFINER` helper taking a caller-supplied id can be invoked with
somebody else's. The RLS was correct — the leak was *around* it. `are_buddies`,
`is_blocked_between` and `feature_allowed` had the same shape, letting a caller
probe the social graph and another user's access controls. Each now carries a
self-participation guard.

**The fix for that leak broke the signed-out catalogue.** Revoking `EXECUTE` from
`anon` looked like the tidy answer and made a public read fail with "permission
denied for function", because a policy declared `for all` is evaluated on SELECT
as well as writes: reading `services` evaluated the *provider's write policy*. A
member not signed in could not see the places that can help — the §0 failure this
product cannot ship. The guard inside each function was always the boundary; the
grant never was. Restored, with a regression test covering the whole anonymous
read path.

One smaller one, caught only by a screenshot: `IconButton`'s `icon` prop takes a
`ReactNode`, and a bare string is a valid `ReactNode`, so passing `"microphone"`
typechecked, passed the tests on accessible name, and rendered the literal word
next to the button.

## Decisions

29 entries in `DECISIONS.md`. The ones most likely to be questioned:

- **D-001** PAM lives in `pam/`, not the repo root.
- **D-002** Versions pinned to the SOP's majors over latest — Next 15 not 16,
  Capacitor 6 not 8. Capacitor being two majors behind will matter at store
  submission; worth revisiting before pilot.
- **D-004** All RLS in one migration.
- **D-005** Append-only enforced by trigger, not just by absent policy.
- **D-008** The 48px touch-target floor is a global rule in the `pam` cascade
  layer, because Astryx is built for dense desktop UI and its defaults fail it.
- **D-018** `is_public` defaults to **false** — for this population the safe
  default is invisible.
- **D-024** Astryx is applied by a provider, not by importing CSS.
- **D-025 / D-026** The two security findings above.
- **D-027** The support number is a database row, not a constant, because Will
  said it will change.

## Verified

| Check | Result |
|---|---|
| Typecheck | 5/5 packages |
| `@pam/config` tests | 113 pass |
| `@pam/ui` tests (incl. axe) | 20 pass |
| Database suite | 83 checks pass |
| Live RLS fingerprint vs local | identical, 73 policies |
| Live anonymous read attack | 0 profiles, messages, invites, audit rows |
| Browser a11y + theme, 320px and iPhone SE | 18 pass, no WCAG AA violations |
| First-load JS | 478 kB of the 500 kB budget |

## Left undone

- **The five-tab member shell.** Research was done — `Tab` renders as an anchor
  with `href`, so the tabs should be real routes rather than tab state, which
  keeps the Android back button and deep links working. Nothing was built.
- **One open design question:** §3.1 wants five bottom tabs and §2.4 wants a
  persistent HelpBar, and both want the bottom of a phone screen. The proposal
  is tabs at the bottom with Help as an always-visible tap-to-call in the top
  bar. Put to Will, not yet answered.
- **The web route is still a component gallery,** not the real Home tab.
- **No device build.** `cap add ios/android` has never been run.
- **Phase 1 security groundwork:** move the internal RLS helpers into a `private`
  schema PostgREST does not expose (D-025), and split write policies off
  `for all` so a read never evaluates a write rule (D-026).

## Needs a human

1. **Create the first admin.** There is no admin account, so no invite can be
   issued and nobody can sign up. One command with the service role key; nothing
   else is closer to a usable pilot.
2. **Review the SMS copy** and record a name in `reviewedBy`. Every template
   ships unreviewed and `renderSms` throws, so PAM cannot text anyone until a
   person signs off against §9.
3. **Resolve the Philadelphia endpoints.** Four sources registered, all inactive.
   This environment's egress proxy blocks all four hosts, so none could be
   verified, and an invented URL would make the importer look configured while
   fetching nothing. PA 211's licence is cleared; its endpoint is not.
4. Brand colours, rewards decision, retention policy beyond 90 days, and pilot
   partner scheduling — all in `DECISIONS.md` under open questions.
