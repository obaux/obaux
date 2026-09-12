# PAM — where the project stands

Last updated 2026-09-12, after the recreation and evening-centre sources landed.
Newest session log: `docs/sessions/2026-09-12-parks-and-evening-centers.md`.

This is the handover document: what exists, what is proven, what is live, and
what the next person needs to know before touching anything.

**It is the only document that is always current.** `docs/sessions/` is the
history — one immutable log per build session, saying what changed and what the
session got wrong. `DECISIONS.md` is the reasoning behind each choice.
`CHANGELOG.md` is the user-visible record.

Start a session by reading this file and the newest session log. End one by
writing a new session log and updating this file. `CLAUDE.md` states the rule.

---

## In one paragraph

PAM connects people to people at services and facilities — for mentorship,
earning and learning. It serves returning citizens, the providers who run
programs, and the case managers who invite them in and introduce them to each
other. **Phase 0 (Foundation) is complete.** The data model, its access rules,
the design system, the shared product rules, and CI all exist and are verified.
No member-facing flow is built yet: that is Phase 1.

Every decision was measured against one question, from the SOP: *can a person
who hasn't used a phone in 8 years enroll in a program, get to it, and keep
going — without help?*

---

## What is live

**Supabase project `pam`** — `shobqzuhicoiymtumiaz`, us-east-1 (closest region to
Philadelphia). Thirty migrations applied. The database is real and reachable;
the app is not deployed anywhere yet.

There is **no admin account**, which means no invite can be issued and nobody can
sign up. That is the single thing standing between the current state and a
usable pilot:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  pnpm --filter @pam/db seed:admin -- \
    --phone +1XXXXXXXXXX --name <first name> --region Philadelphia
```

**Pilot city: Philadelphia.** Region seeded, centred on City Hall.

---

## What is built

| Package | What it holds | State |
|---|---|---|
| `packages/config` | The product's rules as code: the three fixed categories and their subcategories, SMS templates with the §9 safety gates, the §4.1 transparency contract, points/levels/badges, the §0 dignity-language checks, en + es bundles | Complete for Phase 0 |
| `packages/db` | 13 migrations: full §4 model, RLS on every table, the admin layer, server-side RPCs, `app_settings`, the Philadelphia seed | Complete and deployed |
| `packages/ui` | The seven §2.4 components — `BigButton`, `PlaceCard`, `PersonCard`, `StepHeader`, `PointsBadge`, `HelpBar`, `VoiceInput` | Complete for Phase 0 |
| `apps/web` | Next.js 15 + React 19, static export, Astryx themed and working, i18n, PWA manifest, Supabase client, runtime support-phone lookup | Foundation only — see gaps |
| `apps/native` | Capacitor 6 config wrapping the web export; native speech recogniser wired to `VoiceInput` | Config only, never built for a device |

---

## What is proven, and how

Numbers here are from the last run, not aspirations.

| Check | Result | What it actually proves |
|---|---|---|
| Typecheck | 5/5 packages | — |
| `@pam/config` tests | 142 pass | No SMS can send unreviewed, over 160 chars, with emoji, or with a term that reveals justice involvement. Locales are key-for-key. The transparency screen matches its contract. |
| `@pam/ui` tests | 43 pass | Every component is axe-clean. `PlaceCard` offers exactly three actions in a fixed order. Reduced motion is respected. The mic hides when unsupported. |
| Database suite | 122 checks pass | See below |
| Live RLS fingerprint | identical to local | The deployed policy set is provably the one that was penetration-tested: `ce9636c3b77e4827368e6575742b899c`, 73 policies on both |
| Live anonymous attack | 0 rows leaked | A signed-out caller reads no profiles, messages, invites or audit rows on the real database, while still reaching the support number and the public catalogue |
| Browser a11y + theme | 81 pass | No WCAG AA violations at 320px or iPhone SE. Every control clears 48px. No horizontal scroll. The Astryx theme really resolves. Runs in dark mode as well as light. |
| First-load JS | 483.8 kB of 500 kB | §12 budget, measured gzipped on what `index.html` actually loads |

### The database suite is the one that matters

`pnpm --filter @pam/db test` stands up a throwaway Postgres, applies a shim for
the parts of Supabase the migrations need, runs every migration, then attacks the
result with one test user per role. It proves:

- members reach only their own rows
- `is_public = false` hides a member from all discovery; blocks are mutual
- an admin reaches their caseload and region, and **no other region**
- **an admin cannot read message bodies or buddy-feed posts** — the promise
  members are shown at onboarding
- providers reach a member only through an enrollment, appointment or connection
- `points_ledger` and `audit_log` reject UPDATE and DELETE *even from
  `service_role`*, which bypasses RLS
- a disabled feature is refused server-side, not merely hidden
- invite codes carry no ambiguous glyphs, are admin-only, region-scoped,
  single-use, and honour a phone prefill
- a signed-out visitor can still reach the support number and the catalogue

---

## What is deliberately not done

Phase 0 owns foundations. These are Phase 1–7 and their absence is not an
oversight:

- **No member-facing flow.** No onboarding, no invite redemption screen, no map,
  no enrollment, no chat. The web route is a component gallery that proves the
  stack renders, not a product.
- **Notices exist but are not wired to real failures.** Every condition has
  plain-language copy and a component (D-035), and the demo renders three of
  them. Connecting them to actual query results is Phase 1.
- **No five-tab member shell.** `AppShell` + `TabList` is the first UI task of
  Phase 1. The layout is settled and the pieces are ready: Help is now a compact
  item sized to share the bottom bar rather than a full-width row (D-039), and
  the five navigation icons exist. Only the dock itself is unbuilt.
- **Partial import.** DBHIDS is in: **525 provider locations** live in
  `services`, every one awaiting the plain-language review before a member sees
  it (D-031). City Facilities (3,197 features) is verified and active but not yet
  fetched. Endpoints were confirmed through `pg_net` from the database, since the
  build sandbox blocks all external egress (D-030).
- **No Google Places key**, so no phone numbers and no structured hours. The 525
  imported records have neither, and PlaceCard sends members to the Google
  listing instead (D-032). A key would let PAM show "Open now" natively.
- **No SMS is sendable.** Every template ships `reviewedBy: ''` and `renderSms`
  throws on an unreviewed one. This is a gate, not a gap — a human has to read
  the copy against §9 first.
- **No device build.** Capacitor is configured; `cap add ios/android` has never
  been run.

---

## Four bugs worth remembering

Each of these passed a build, and most passed the tests too. They are recorded
because the *class* will recur.

**Reminders would have silently failed to send.** The Spanish 24-hour reminder
renders at 159 of 160 characters with a 31-character address. Any longer address
pushed it over, `renderSms` threw, and the reminder never went. Templates now
budget each variable and shorten at a word boundary. *A safety gate that throws
at send time is a feature that doesn't happen.*

**The design system was never applied.** All three Astryx stylesheets loaded with
200s and every component rendered unthemed, because Astryx applies its theme from
React via `<Theme>`. The build passed, axe passed, the unit tests passed on
accessible names. Only a screenshot showed it. *Some classes of wrong are
invisible to every check that isn't an eye.*

**`member_points(<any member>)` leaked every member's points.** The RLS was
correct; the leak was around it. PostgREST exposes every `public` function at
`/rest/v1/rpc/<name>`, so a `SECURITY DEFINER` helper taking a caller-supplied id
could be called with someone else's. *Row-level security does not cover the RPC
surface. Supabase's advisors caught this; the local suite could not.*

**Revoking a grant broke the signed-out catalogue.** The fix for the above —
revoking `EXECUTE` from `anon` — made a public read fail with "permission denied
for function", because a policy declared `for all` is evaluated on SELECT too.
Reading `services` evaluated the *provider's write policy*. A member not signed
in could not see the places that can help. *The guard inside the function was
always the boundary; the grant never was.*

---

## What needs a human

| # | Needs | Blocks | Note |
|---|---|---|---|
| 1 | **Create the first admin** | Everything | No admin means no invite means no users. One command, needs the service role key. |
| 2 | **Review the SMS copy** and record a name in `reviewedBy` | Phase 2 | Nothing can text a member until someone signs off against §9. **A review sheet is prepared and waiting**: all twelve messages rendered as lock-screen notifications in both languages, with the two open questions — https://claude.ai/code/artifact/f1dfb8d4-f64d-47c4-97d3-6a67f4c0eb09 |
| 3 | **Get the PA 211 export URL** from the 211 contact | 211 data only | Licence cleared and the host reachable, but it serves a consumer search UI rather than a feed. Philadelphia's own datasets are verified and active. |
| 4 | **A Google Places API key** | Hours and phone on imported places | `place_id` is null on all 525 imported providers, so the Hours action is a Google *search*, not a direct listing. A key would give phone numbers and structured hours — and until PAM has hours it will not show an open/closed state at all (D-044). |
| 5 | Brand colours and logo | Phase 6 | Category pins use Astryx palette defaults chosen for hue separation at AAA contrast. |
| 6 | Whether points redeem for real rewards | Phase 3 | Built behind a flag, shipped off. |
| 7 | Retention: missed-appointment history beyond 90 days | Phase 5 | No purge job. Keeping this data indefinitely is the wrong default for this population. |
| 8 | Pilot partner orgs and usability test scheduling | Phase 7 | Five members, three providers, two admins. |

---

## Picking it up

```bash
cd pam && pnpm install
pnpm dev                                # web app on :3000

pnpm -r typecheck
pnpm --filter @pam/config test          # SMS safety, copy rules, points
pnpm --filter @pam/ui test              # components + axe
pnpm --filter @pam/db test              # migrations + RLS penetration suite
pnpm --filter @pam/web build
pnpm --filter @pam/web test:a11y        # browser: contrast, target size, 320px
node scripts/check-bundle-budget.mjs    # §12 first-load budget
```

The database suite needs `postgresql-16`, `postgresql-16-postgis-3` and
`pgcrypto`. It creates a throwaway cluster and cleans up after itself.

### Read these before changing anything

- `apps/web/.claude/CLAUDE.md` — Astryx's own conventions, generated by its CLI.
  They override default instincts, and ignoring them is what produced the
  unthemed build.
- `packages/config/transparency.ts` — a promise made to people with little reason
  to trust promises. Widening it fails tests by design; change the contract
  first and tell members before it ships.
- `DECISIONS.md` — 61 decisions with their reasoning, and the open questions.

---

## Next

Phase 1: invite generation and redemption, onboarding including the transparency
step, the map and list with three-category filters, and the Philadelphia
importer. The first UI task is the five-tab member shell on `AppShell` +
`TabList`.

Two pieces of security groundwork carry into it, both in `DECISIONS.md`:
move the internal RLS helpers into a `private` schema PostgREST does not expose
(D-025), and split write policies off `for all` so a read never evaluates a
write rule (D-026).
