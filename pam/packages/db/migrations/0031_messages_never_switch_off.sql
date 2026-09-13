-- 0031 — Anyone can message. That switch does not exist.
--
-- §4.1 lets a case manager turn individual features off for one person, with a
-- reason and an audit entry. `chat` was on that list. Will removed it, and the
-- reasoning is worth keeping because it is the shape of a rule rather than a
-- preference:
--
--   Every other switch degrades somebody's experience — no map, no points, no
--   mentor browsing. Switching off messages **isolates** them, from the people
--   this product exists to connect them to, and the person holding the switch
--   is the one with power over them. That is the failure mode PAM is built
--   against, offered as a feature.
--
-- The enum value stays: dropping a value from a Postgres enum means rebuilding
-- every column that uses it, and the existing rows and audit history reference
-- it. What changes is that the database refuses to write one. A list in
-- TypeScript governs only the screens that read it; this governs everybody,
-- including a future admin panel, a script, and the service role.

-- Nothing should be there, but a pilot database is not a promise.
delete from public.access_controls where feature = 'chat';

create or replace function public.reject_uncontrollable_feature()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if new.feature = 'chat' then
    raise exception
      'Messages cannot be switched off for a member. See migration 0031.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists access_controls_reject_chat on public.access_controls;
create trigger access_controls_reject_chat
  before insert or update on public.access_controls
  for each row execute function public.reject_uncontrollable_feature();

comment on table public.access_controls is
  'Per-member feature switches (§4.1). Every row needs a reason and is audited. '
  'A `chat` row is refused by trigger: messaging is never switchable off, '
  'because cutting somebody off from people is the harm this product exists to '
  'work against (0031).';
