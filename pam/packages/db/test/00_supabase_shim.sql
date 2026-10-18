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

-- Supabase Storage (0074): only what the staff-photo policies touch. The real
-- schema has more columns; a policy that names only these behaves the same.
create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null,
  owner uuid,
  created_at timestamptz not null default now()
);
alter table storage.objects enable row level security;
-- Every folder in a path, the file's own name left off: Supabase's own helper.
create or replace function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
  select (string_to_array(name, '/'))[1:greatest(array_length(string_to_array(name, '/'), 1) - 1, 0)];
$$;
grant usage on schema storage to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to authenticated;
grant select on storage.buckets to anon, authenticated;


-- A stand-in for Supabase Vault (the real one is an extension this throwaway database does not have): a secrets table, the view that
-- decrypts them (here, plain), and the function that makes one. Nobody but the database's owner can use it, as on the real project.
create schema if not exists vault;
create table if not exists vault.secrets (
  id          uuid primary key default gen_random_uuid(),
  name        text unique,
  description text not null default '',
  secret      text not null
);
create or replace view vault.decrypted_secrets as select id, name, description, secret as decrypted_secret from vault.secrets;
create or replace function vault.create_secret(new_secret text, new_name text default null, new_description text default '', new_key_id uuid default null)
returns uuid
language sql
as $$ insert into vault.secrets (name, description, secret) values (new_name, new_description, new_secret) returning id; $$;
revoke all on schema vault from public, anon, authenticated, service_role;
