-- 0047 — Twenty-five points for finishing setup, awarded by the database.
--
-- `POINTS_RULES.finish_setup` has said `{ points: 25, verification: 'automatic',
-- dailyCap: 1 }` since the config was written, and §10 step 10 has always ended
-- onboarding with it. Nothing implemented it, so the last screen of sign-up had
-- nothing true to show.
--
-- Same shape as 0045 and for the same reason: the client sets `onboarded_at` —
-- a fact about what the person did — and the database decides what that is
-- worth. A browser that can award its own points is a score nobody believes,
-- and the first number a member ever sees is the worst one to make up.
--
-- Once, ever. `onboarded_at` is member-writable (0046), so a client that wrote
-- it in a loop would otherwise farm this. The partial unique index is what
-- stops it, rather than a check somebody has to remember.

create unique index if not exists points_ledger_finish_setup_once
  on public.points_ledger (member_id)
  where reason = 'finish_setup';

create or replace function public.award_points_for_finishing_setup()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  -- Only the transition into "finished". Re-saving a profile that was already
  -- onboarded is not finishing anything.
  if new.onboarded_at is null or old.onboarded_at is not null then
    return new;
  end if;

  -- Points are a member mechanic (§8); staff finish setup too and earn nothing.
  if new.role <> 'member' then
    return new;
  end if;

  insert into public.points_ledger (member_id, delta, reason)
  values (new.id, 25, 'finish_setup')
  on conflict (member_id) where reason = 'finish_setup' do nothing;

  return new;
end;
$$;

comment on function public.award_points_for_finishing_setup is
  'Twenty-five points the first time a member finishes onboarding '
  '(POINTS_RULES.finish_setup). In the database because the client that shows '
  'the number must not be the thing that decides it.';

drop trigger if exists profiles_award_finish_setup on public.profiles;
create trigger profiles_award_finish_setup
  after update of onboarded_at on public.profiles
  for each row execute function public.award_points_for_finishing_setup();

revoke all on function public.award_points_for_finishing_setup() from public, anon, authenticated;
