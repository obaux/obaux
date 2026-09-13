-- Local-only shim reproducing the parts of a Supabase project the migrations
-- depend on. This file is NEVER applied to a real project — Supabase provides
-- all of it. It exists so `pnpm --filter @pam/db test` can run the real
-- migrations and the real RLS policies against a real Postgres.

create schema if not exists auth;
create schema if not exists extensions;

-- Supabase's auth.users. Only the columns the migrations reference.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  phone text unique,
  created_at timestamptz not null default now()
);

-- auth.uid() reads the JWT claim. Locally we drive it with a GUC so a test can
-- say "act as this user" and exercise the policies exactly as a client would.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon');
$$;

-- The three Supabase roles. `authenticated` is what the app uses; RLS applies.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end;
$$;

grant usage on schema public, extensions, auth to anon, authenticated, service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
