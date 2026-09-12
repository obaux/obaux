# PAM

A social, relational system that connects people to people at services and
facilities — for mentorship, earning, and learning.

PAM serves three kinds of people: **members** (returning citizens rebuilding
community, family and career life), **providers** (staff at agencies, nonprofits
and re-entry programs), and **admins** (case managers and officers who invite
people in, control access, and introduce a member to the right provider).

Every decision here is measured against one question:

> Can a person who hasn't used a phone in 8 years enroll in a program, get to
> it, and keep going — without help?

**Status: Phase 0 (Foundation) complete.** See `CHANGELOG.md` for what was built
and verified, and `DECISIONS.md` for why.

---

## Layout

```
pam/
├── apps/
│   ├── web/         Next.js 15 + React 19, static export, PWA
│   └── native/      Capacitor 6 shells wrapping that export
├── packages/
│   ├── config/      The product's rules as code — taxonomy, SMS safety,
│   │                the transparency contract, points, plain-language checks
│   ├── db/          Migrations, RLS, and the penetration suite
│   └── ui/          The seven PAM components, built on Astryx
└── scripts/         Bundle budget check
```

## Getting started

```bash
pnpm install
pnpm dev                 # web app at http://localhost:3000
```

The demo page renders every component with real theme and real strings — it is
Phase 0's demo build (§13).

### Checks

```bash
pnpm -r typecheck
pnpm --filter @pam/config test          # SMS safety, copy rules, points
pnpm --filter @pam/ui test              # components + axe
pnpm --filter @pam/db test              # migrations + RLS penetration suite
pnpm --filter @pam/web build
pnpm --filter @pam/web test:a11y        # browser: contrast, target size, 320px
node scripts/check-bundle-budget.mjs    # §12 first-load budget
```

`pnpm --filter @pam/db test` needs `postgresql-16`, `postgresql-16-postgis-3`
and `pgcrypto`. It creates a throwaway cluster and cleans up after itself.

### Environment

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in the Supabase
publishable key from the dashboard.

**Supabase project `pam`** (`shobqzuhicoiymtumiaz`, us-east-1) is live with all
12 migrations applied. The first admin does not exist yet — nothing can issue an
invite until it does:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  pnpm --filter @pam/db seed:admin -- --phone +1... --name ... --region Philadelphia
```

**Pilot city: Philadelphia.** The region is seeded and four import sources are
registered, all inactive until their endpoints are confirmed — see D-028.

---

## The things most likely to bite you

**The transparency screen is a contract, not copy.** §4.1 requires it to match
the SOP word for word, and members are told it is exhaustive. It lives in
`packages/config/transparency.ts`; `en.json` must match it exactly and a test
enforces that. A second test asserts no policy on `messages` or `activities`
grants admins read access. If you widen what admins can see, those tests fail
and name the promise you are breaking. Change the contract first, and tell
members before it ships.

**Every SMS template ships unreviewed on purpose.** `reviewedBy: ''` makes
`renderSms` throw. A person has to read the copy against §9 and record their
name before PAM can text anyone. Do not fill those in to make a test pass.

**RLS is the privacy model.** Not the UI. `pnpm --filter @pam/db test` attacks
the policies with one test user per role and is the highest-value check in the
repo. `points_ledger` and `audit_log` reject UPDATE and DELETE even from
`service_role`, because that is what Edge Functions run as.

**Astryx is applied by `<Theme>`, not by importing its CSS.** All three
stylesheets can load with 200s and every component still render unthemed. If the
app looks like browser defaults, check the provider in `src/lib/providers.tsx`
first. Run `pnpm exec astryx doctor`, and read `apps/web/.claude/CLAUDE.md` —
those are Astryx's own conventions and they override defaults. See D-024.

**Astryx is built for dense desktop UI; PAM is not.** Its default button is
32px and its text input is 20px tall. The 48px floor is applied once, globally,
in the `pam` cascade layer, and the browser suite fails the build if any control
slips under. See D-008.

**A `for all` RLS policy is evaluated on SELECT too.** That is how revoking a
function grant broke signed-out reads of the service catalogue. If a public read
starts failing with "permission denied for function", a write policy is being
evaluated on the read path. See D-026.

**StyleX fails silently when misconfigured.** If components render unstyled,
the `@stylex;` directive resolved to nothing — check that
`@stylexjs/babel-plugin` is listed in the PostCSS plugin's `babelConfig`. See
D-011.

---

## Conventions

- **Astryx only.** No MUI, shadcn, Radix, Chakra, or hand-rolled components.
  Style through `stylex.create()` + `xstyle` — no inline `style={{}}`, no
  `!important`.
- **Plain language, 5th-grade level.** Never display "prisoner", "ex-offender",
  "inmate", or conviction details anywhere a user can see — UI, notifications,
  or exports. CI checks this.
- **Never dead-end.** Every screen has a visible way back and a visible way to
  get help.
- **One primary action per screen.** If a screen needs two `BigButton`s, it is
  doing two things.
- Every `security definer` function sets `search_path = public, extensions`.
- Strings go through i18n from day one. English and Spanish stay key-for-key.

## Next

Phase 1: invite generation and redemption, onboarding including the transparency
step, the map and list with three-category filters, and the Philadelphia
importer.

Two pieces of groundwork carry into it, both logged in `DECISIONS.md`:

- move the internal RLS helpers into a `private` schema PostgREST does not
  expose, and split write policies off `for all` (D-025, D-026)
- resolve the real Philadelphia endpoints and activate the sources (D-028)

The demo route is still a component gallery rather than the real Home tab.
Building the five-tab member shell on `AppShell` + `TabList` is the first UI task
of Phase 1.
