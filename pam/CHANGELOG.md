# Changelog

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
