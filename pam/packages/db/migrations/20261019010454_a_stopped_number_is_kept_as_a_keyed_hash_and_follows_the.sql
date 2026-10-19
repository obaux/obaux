-- contract: phone_stops loses its stopped_at column (Mira, 19 October: the day is not needed, so the table is the keyed hash and nothing else), and
-- phone_hash changes from a plain SHA-256 to a keyed one, so a stop is no longer a hash anyone can reverse by trying every number. Any row made
-- with the old hash is deleted here: there are none (counted live on 19 October: phone_stops 0 rows, support_texts_log 0 rows).
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
--   * The table keeps ONE thing: that this number said STOP. One column, the hash. No time, no day, no message, no count, no account, no number.
--   * `record_sms_stop` (unchanged in code) writes the new keyed hash when no profile matches; `record_sms_start` removes it, and any old plain-hash
--     row for the same number.
--   * There is no old form to keep. Any row with the old hash is deleted here (there are none live) and `support_texts_log`, which kept the same plain
--     hash for each number a super admin texted, is cleaned the same way and now gets the keyed hash too (`phone_hash` is what writes it), so no
--     reversible hash of a number is left anywhere.
--   * An erased account that was stopped puts the keyed hash of its number BACK in the list (Mira, 19 October), so a number that said STOP stays
--     stopped when its account goes. This is the one case where the list holds a number that once had an account. Privacy says so.
--   * Nothing is written to the audit log or any function log on the no-account branch: a STOP from a number with no account leaves one hash and
--     nothing else.
--   * When a profile gets a number, or changes it (insert, or update of phone), a trigger looks the number's hash up and, if it is there, puts the
--     stop on the account (`notification_preferences.sms_stopped_at`, texts still off) AND DELETES THE ROW, so the list holds only people with no
--     account (Lena, 19 October: otherwise a stop from a number with an account goes when the account is deleted, and a stop from a number without
--     one outlives it, two promises for the same words). It never clears a stop; only START does. The audit log records that a stop was carried,
--     naming the account and nothing about the number.
--   * Nobody outside the database can compare a number to the list except by asking `phone_is_stopped`, which the dispatcher needs: `phone_hash` and
--     the table are closed to the service role too. What the keyed hash protects is a COPY of the table (a backup, a dump, an export) being
--     useless without the key.
--
-- NOT CHANGED. A person who changes their number to one that has not said STOP keeps the stop on the account until they send START from the
-- number it came from, as before.
--
-- Expand-only apart from the two contract changes named above.

-- Rows with the old hash (there are none live): deleted, because they cannot be kept honestly and cannot be rehashed without their numbers.
delete from public.phone_stops where phone_hash not like 'k1:%';
delete from public.support_texts_log where phone_hash not like 'k1:%';

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
revoke all on function public.phone_hash(text) from public, anon, authenticated, service_role;

alter table public.phone_stops drop column stopped_at;
revoke all on public.phone_stops from service_role;
comment on table public.phone_stops is
  'A number that texted STOP: its keyed hash (HMAC-SHA256, key in the Vault) and nothing else: no time, no account, no number, no message (D-524, and the follow-up of 19 October). START removes it.';

create or replace function public.phone_is_stopped(p_phone text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
           select 1 from public.phone_stops s where s.phone_hash = public.phone_hash(p_phone)
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
  delete from public.phone_stops where phone_hash = public.phone_hash(p_phone);

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
  if exists (select 1 from public.phone_stops s where s.phone_hash = public.phone_hash(new.phone)) then
    insert into public.notification_preferences (member_id, sms_stopped_at)
    values (new.id, now())
    on conflict (member_id) do update
      set sms_stopped_at = coalesce(public.notification_preferences.sms_stopped_at, now()),
          updated_at = now();
    -- The stop now lives on the account and goes with it; the list holds only numbers with no account.
    delete from public.phone_stops where phone_hash = public.phone_hash(new.phone);
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

-- A stopped account that is erased leaves its number stopped: the keyed hash goes back in the list before the account's own record goes.
create or replace function public.keep_the_stop_of_an_erased_account()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if old.phone is not null
     and exists (select 1 from public.notification_preferences np where np.member_id = old.id and np.sms_stopped_at is not null)
     and public.phone_hash(old.phone) is not null then
    insert into public.phone_stops (phone_hash) values (public.phone_hash(old.phone)) on conflict do nothing;
  end if;
  return old;
end;
$$;
revoke all on function public.keep_the_stop_of_an_erased_account() from public, anon, authenticated;

drop trigger if exists profiles_keep_the_stop_when_erased on public.profiles;
create trigger profiles_keep_the_stop_when_erased
  before delete on public.profiles
  for each row execute function public.keep_the_stop_of_an_erased_account();
