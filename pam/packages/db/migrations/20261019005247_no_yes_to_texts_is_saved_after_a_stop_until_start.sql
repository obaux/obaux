-- No yes to texts is saved after a STOP, until START (Iris's correction of 19 October; Mira, 00:40: "make the database refuse a yes after
-- STOP until START"; it gates texts going live).
--
-- WHAT WAS TRUE. A STOP stored in `sms_stopped_at` cannot be cleared from the app (D-453, 20261010071947), and the dispatcher cancels every
-- text for a stopped number. But nothing stopped a person's client from writing a YES (`sms_enabled`, or an alert switch) onto a stopped row:
-- the app refused it, and the database took it. The app's refusal rested on a read that, when it failed, said "not stopped"; so a yes
-- could be stored after a STOP, and the day a START cleared the stop (`record_sms_start`, which changes nothing else) the texts would resume
-- on a yes the person gave in the app while they believed they were stopped, never on a fresh one after START.
--
-- WHAT THIS DOES. A trigger refuses, with the word TEXTS_STOPPED_UNTIL_START, a write that turns a yes ON (`sms_enabled`, `alert_message`,
-- `alert_booked`, `alert_changed`, `alert_trip`: false or missing becomes true) on a row that holds a stop. It looks at the row as it is
-- stored, so the upsert the app makes (insert ... on conflict do update) is held to it on both its branches. A yes that is already on is not
-- a new yes, so saving quiet hours, or turning a switch off, still works. After START (the stop is cleared) a yes is accepted again, which
-- is the fresh one. The service role and the functions that record STOP and START are not held: STOP writes only the stop, START clears
-- it, and neither turns a yes on.
--
-- Expand only: one function and one trigger; nothing is dropped.

create or replace function public.refuse_a_yes_while_stopped()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  v_old public.notification_preferences%rowtype;
begin
  select * into v_old from public.notification_preferences where member_id = new.member_id;
  if v_old.member_id is null or v_old.sms_stopped_at is null then
    return new;
  end if;
  if (coalesce(new.sms_enabled, false) and not coalesce(v_old.sms_enabled, false))
     or (coalesce(new.alert_message, false) and not coalesce(v_old.alert_message, false))
     or (coalesce(new.alert_booked, false) and not coalesce(v_old.alert_booked, false))
     or (coalesce(new.alert_changed, false) and not coalesce(v_old.alert_changed, false))
     or (coalesce(new.alert_trip, false) and not coalesce(v_old.alert_trip, false)) then
    raise exception 'TEXTS_STOPPED_UNTIL_START';
  end if;
  return new;
end;
$$;

revoke all on function public.refuse_a_yes_while_stopped() from public, anon, authenticated;

drop trigger if exists notification_preferences_no_yes_while_stopped on public.notification_preferences;
create trigger notification_preferences_no_yes_while_stopped
  before insert or update on public.notification_preferences
  for each row execute function public.refuse_a_yes_while_stopped();
