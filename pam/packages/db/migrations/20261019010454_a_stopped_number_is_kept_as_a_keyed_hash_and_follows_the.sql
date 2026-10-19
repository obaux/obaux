-- contract: phone_stops.stopped_at is cut from a time to a day (Mira, 19 October: "no time beyond the day"), and phone_hash changes from a plain
-- SHA-256 to a keyed one, so a stop is no longer a hash anyone can reverse by trying every number. Old rows still count (see below) until a START
-- removes them; no stop is forgotten.
--
-- DRAFT. Written for Lena's Privacy read before anything is built past it (Mira, 01:00). Not applied, and nothing that sends is on until texts_live is
-- on and the Privacy line for this table is signed.
--
-- A STOPPED NUMBER IS KEPT AS A KEYED HASH AND FOLLOWS THE NUMBER ONTO AN ACCOUNT (Iris's finding 9, 19 October).
--
-- WHAT EXISTED. D-524 (20261011042645) already keeps a number that texted STOP when no profile has it: `phone_stops (phone_hash, stopped_at)`, the
-- hash a plain SHA-256 of the E.164 number, START clearing it, and `phone_is_stopped()` checking it for help-request texts. Two things were missing:
--   1. Nothing carried that stop onto an account. A person who texted STOP, then joined with the same number, had an account with no stop, and the
--      dispatcher (which reads the account's `sms_stopped_at`) would text them.
--   2. A plain SHA-256 of a phone number can be reversed by trying every possible number (a few hundred million for US numbers, minutes on a laptop).
--      The table was "hashed" in name only. Same flaw the desk found in the first design of the error log's counters.
--
-- WHAT THIS DOES.
--   * The hash is HMAC-SHA256 of the E.164 number with a key that lives only in the Vault (`phone_stop_key`, made here, never seen by anyone who
--     writes code, never in the repository). Without the key, the table cannot be turned back into numbers or even tested against a guessed one.
--     The stored value carries a `k1:` prefix so a new hash and an old one can be told apart.
--   * The table keeps ONE thing about the person: that this number said STOP, and the day. `stopped_at` becomes a date. No message, no count, no
--     account, no number.
--   * `record_sms_stop` (unchanged in code) writes the new keyed hash when no profile matches; `record_sms_start` removes it, and any old plain-hash
--     row for the same number.
--   * `phone_is_stopped` counts a number as stopped if either form of its hash is in the table, so an old row still stops texts until a START
--     removes it. Nothing is rehashed: a one-way hash cannot be redone without the number.
--   * When a profile gets a number, or changes it (insert, or update of phone), a trigger looks the number's hash up and, if it is there, puts the
--     stop on the account (`notification_preferences.sms_stopped_at`, texts still off). It never clears a stop; only START does. The audit log
--     records that a stop was carried, naming the account and nothing about the number.
--
-- NOT CHANGED. The stopped-number row stays after it is carried (the number said STOP, whoever holds it); START clears both. A person who changes
-- their number to one that has not said STOP keeps the stop on the account until they send START from the number it came from, as before.
--
-- Expand-only apart from the two contract changes named above.

do $do$
begin
  if not exists (select 1 from pg_available_extensions where name = 'supabase_vault') then
    raise notice 'supabase_vault is unavailable here; the stop key is read from the stand-in the test database provides';
    return;
  end if;
  create extension if not exists supabase_vault;
  if not exists (select 1 from vault.secrets where name = 'phone_stop_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'phone_stop_key',
      'HMAC key for the stopped-number list (phone_stops). Made in the database; nothing outside the database reads it.'
    );
  end if;
end;
$do$;

-- The key, for the functions below and nobody else.
create or replace function public.phone_stop_key()
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v text;
begin
  if to_regclass('vault.decrypted_secrets') is null then
    raise exception 'PHONE_STOP_KEY_MISSING';
  end if;
  execute 'select decrypted_secret from vault.decrypted_secrets where name = $1' into v using 'phone_stop_key';
  if v is null then
    raise exception 'PHONE_STOP_KEY_MISSING';
  end if;
  return v;
end;
$$;
revoke all on function public.phone_stop_key() from public, anon, authenticated, service_role;

-- The old, plain hash: kept only to recognise rows made before this.
create or replace function public.phone_hash_legacy(p_phone text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(extensions.digest(public.to_e164(p_phone), 'sha256'), 'hex');
$$;
revoke all on function public.phone_hash_legacy(text) from public, anon, authenticated;
grant execute on function public.phone_hash_legacy(text) to service_role;

-- The keyed hash. Null for a value that is not a phone number.
create or replace function public.phone_hash(p_phone text)
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_e164 text := public.to_e164(p_phone);
begin
  if v_e164 is null or v_e164 !~ '^\+[0-9]{7,15}$' then
    return null;
  end if;
  return 'k1:' || encode(extensions.hmac(v_e164, public.phone_stop_key(), 'sha256'), 'hex');
end;
$$;
revoke all on function public.phone_hash(text) from public, anon, authenticated;
grant execute on function public.phone_hash(text) to service_role;

alter table public.phone_stops
  alter column stopped_at type date using stopped_at::date,
  alter column stopped_at set default current_date;
comment on table public.phone_stops is
  'A number that texted STOP: a keyed hash (HMAC-SHA256, key in the Vault) and the day. Nothing else, no account, no number, no message (D-524, and the follow-up of 19 October). START removes it.';

create or replace function public.phone_is_stopped(p_phone text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
           select 1 from public.phone_stops s
           where s.phone_hash in (public.phone_hash(p_phone), public.phone_hash_legacy(p_phone))
         )
      or exists (
           select 1
           from public.profiles p
           join public.notification_preferences np on np.member_id = p.id
           where p.phone = public.to_e164(p_phone) and np.sms_stopped_at is not null
         );
$$;

create or replace function public.record_sms_start(p_phone text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_member uuid;
  v_changed integer;
begin
  delete from public.phone_stops
  where phone_hash in (public.phone_hash(p_phone), public.phone_hash_legacy(p_phone));

  select id into v_member from public.profiles where phone = public.to_e164(p_phone);
  if v_member is null then
    return false;
  end if;

  update public.notification_preferences
  set sms_stopped_at = null, updated_at = now()
  where member_id = v_member and sms_stopped_at is not null;
  get diagnostics v_changed = row_count;
  if v_changed = 0 then
    return false;
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (null, 'sms.start', 'profile', v_member, '{}'::jsonb);
  return true;
end;
$$;

-- A stop follows its number onto an account.
create or replace function public.carry_a_stopped_number_onto_the_account()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.phone is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.phone is not distinct from old.phone then
    return new;
  end if;
  if exists (
       select 1 from public.phone_stops s
       where s.phone_hash in (public.phone_hash(new.phone), public.phone_hash_legacy(new.phone))
     ) then
    insert into public.notification_preferences (member_id, sms_stopped_at)
    values (new.id, now())
    on conflict (member_id) do update
      set sms_stopped_at = coalesce(public.notification_preferences.sms_stopped_at, now()),
          updated_at = now();
    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (null, 'sms.stop', 'profile', new.id, '{"carried": true}'::jsonb);
  end if;
  return new;
end;
$$;
revoke all on function public.carry_a_stopped_number_onto_the_account() from public, anon, authenticated;

drop trigger if exists profiles_carry_a_stopped_number on public.profiles;
create trigger profiles_carry_a_stopped_number
  after insert or update of phone on public.profiles
  for each row execute function public.carry_a_stopped_number_onto_the_account();
