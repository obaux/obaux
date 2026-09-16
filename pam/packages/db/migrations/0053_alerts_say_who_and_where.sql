-- 0053 — Notifications name the place, or the person.
--
-- Will: "inside the app, the alert should be more descriptive, saying the
-- place name, or person's name."
--
-- "Someone reported a place: closed" and "Someone said a message is not
-- safe" told a case manager that *something* happened, and then made them
-- open the list to find out what. Both triggers already had the row that
-- carries the name — `services.name` for a flag, the sender's own
-- `profiles.first_name` for a report — they just never put it in the
-- notification. This does that, and nothing else: the audience (A7 / D-080),
-- the no-message-text rule (§4.1), and the "never a sentence, only a key and
-- its variables" contract (0038) are all unchanged. A name is one of the five
-- facts a case manager and a super admin are already entitled to read about
-- their own people (§4.1's transparency list); this puts it one screen
-- earlier, not on a screen it was not on before.
--
-- `create or replace function` is enough here — neither trigger function's
-- signature or return type changes, only what it passes to `notify()`.

create or replace function public.notify_on_service_flag()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_savers uuid[];
  v_place  text;
begin
  select coalesce(array_agg(member_id), '{}') into v_savers
  from public.saved_places where service_id = new.service_id;

  select s.name into v_place from public.services s where s.id = new.service_id;

  perform public.notify(
    public.super_admin_ids() || public.case_managers_for(v_savers),
    'service_flagged',
    'notify.service_flagged',
    'service', new.service_id,
    jsonb_build_object('reason', new.reason, 'place', coalesce(v_place, ''))
  );
  return new;
end;
$$;

create or replace function public.notify_on_report()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_about uuid;
  v_name  text;
begin
  if new.target_type <> 'message' then
    return new;
  end if;

  select m.sender_id into v_about from public.messages m where m.id = new.target_id;
  select p.first_name into v_name from public.profiles p where p.id = v_about;

  -- Still no message text travels with this (§4.1) — only who it was from,
  -- which the recipients (every super admin, and that person's own case
  -- manager) are already entitled to know without this notification existing
  -- at all.
  perform public.notify(
    public.super_admin_ids() || public.case_managers_for(array[v_about]),
    'message_reported',
    'notify.message_reported',
    'report', new.id,
    jsonb_build_object('name', coalesce(v_name, ''))
  );
  return new;
end;
$$;
