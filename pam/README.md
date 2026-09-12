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

Copy `apps/web/.env.example` to `apps/web/.env.local`. No Supabase project has
been provisioned yet — see `DECISIONS.md` D-003 for the three commands to run
once one exists.

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

**Astryx is built for dense desktop UI; PAM is not.** Its default button is
32px and its text input is 20px tall. The 48px floor is applied once, globally,
in the `pam` cascade layer, and the browser suite fails the build if any control
slips under. See D-008.

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

Phase 1: invite generation and redemption, onboarding including the
transparency step, the map and list with three-category filters, and the city
resource importer against one sample source.

`DECISIONS.md` lists the eight open questions for Will. W-1 (target city and
data sources) and W-7 (the support phone number) block Phase 1.
