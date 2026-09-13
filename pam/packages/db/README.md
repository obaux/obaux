# @pam/db

Schema, row-level security, and the server-side operations that must not be
expressible as a client write.

## Layout

| Path | What it holds |
|---|---|
| `migrations/0001_extensions_and_types.sql` | pgcrypto, PostGIS, every enum |
| `migrations/0002_identity.sql` | regions, orgs, profiles, invites, caseload |
| `migrations/0003_services.sql` | services, subcategory registry, import bookkeeping |
| `migrations/0004_plan.sql` | enrollments, appointments, reminders, tasks |
| `migrations/0005_people.sql` | connections, chat, activity feed, reports, points |
| `migrations/0006_admin_layer.sql` | facilitations, access controls, audit log |
| `migrations/0007_rls.sql` | **every policy, in one file** |
| `migrations/0008_rpcs.sql` | invite create/redeem, access changes, points balance |

RLS lives in one file on purpose. It is what a reviewer reads during the
Phase 7 penetration pass, and a policy set is only reviewable as a set.

## Running the tests

```bash
pnpm --filter @pam/db test
```

This spins up a throwaway Postgres, applies a small shim that reproduces the
parts of Supabase the migrations depend on (`auth.users`, `auth.uid()`, the
`anon` / `authenticated` / `service_role` roles), runs every migration, and then
attacks the result with one test user per role.

Requires `postgresql-16`, `postgresql-16-postgis-3` and `pgcrypto`. The shim is
never applied to a real project — Supabase provides all of it.

### What the suite proves

- members reach only their own rows
- `is_public = false` hides a member from all discovery; blocks are mutual
- an admin reaches their caseload and their region, and **no other region**
- **an admin cannot read message bodies or buddy-feed posts** — the promise
  members are shown at onboarding (§4.1)
- providers reach a member only through an enrollment, appointment or connection
- `points_ledger` and `audit_log` reject UPDATE and DELETE *even from
  `service_role`*, which bypasses RLS — the triggers are what stop an Edge
  Function bug from rewriting history
- a disabled feature in `access_controls` is refused server-side, not just hidden
- invite codes carry no ambiguous glyphs, are admin-only to create, region-scoped,
  single-use, and honour a phone prefill

## Applying to a real project

No Supabase project has been provisioned yet — see `DECISIONS.md` (D-011).
Once one exists:

```bash
supabase link --project-ref <ref>
supabase db push
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  pnpm --filter @pam/db seed:admin -- --phone +15555550100 --name Dana --region North
```

The seed script is the only way to create the first admin. Every admin after
that is created by an existing admin from the Admin Panel.

## Conventions

- Every `security definer` function sets `search_path = public, extensions`,
  because pgcrypto lives in `extensions` (repo convention).
- The service key is used only inside Edge Functions, for cron and imports.
  Admin actions go through RLS like everyone else and write to `audit_log`.
- Subcategories are rows, not an enum: §2.5 says admins edit that list, and an
  edit is a migration entry rather than a code change.
