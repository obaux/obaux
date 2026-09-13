-- 0045 — Five points for keeping a place, awarded by the database.
--
-- `POINTS_RULES.save_place` has said `{ points: 5, verification: 'automatic' }`
-- since the config was written; nothing implemented it. This does, as a trigger
-- on `saved_places` rather than a write from the browser, for the obvious
-- reason: a client that can award itself points is a leaderboard nobody can
-- believe, and §8's whole premise is that points mean something.
--
-- ## Once per place, forever
--
-- Save, unsave, save again is the farm. `subject_id` and a unique index close
-- it: the first save of a given place by a given member writes a ledger row,
-- and every save after that hits the conflict and does nothing. Unsaving does
-- NOT take the points back — the ledger is append-only by design (0007), and
-- clawing back points somebody earned for a real thing they did is the kind of
-- mechanic that teaches a member the app is playing games with them.
--
-- `subject_id` is deliberately not a foreign key. The ledger is history: if a
-- place is later removed from the catalogue, the row that says a member earned
-- five points for saving it is still true, and `on delete cascade` would
-- quietly rewrite that history.

alter table public.points_ledger
  add column if not exists subject_id uuid;

comment on column public.points_ledger.subject_id is
  'What the points were for — a service, an appointment — when "once per thing" '
  'is part of the rule. Intentionally not a foreign key: the ledger is history, '
  'and history does not change when the catalogue does.';

-- One award per member per reason per subject. Rows with no subject (a streak,
-- a referral) are unaffected, which is what the partial index is for.
create unique index if not exists points_ledger_once_per_subject
  on public.points_ledger (member_id, reason, subject_id)
  where subject_id is not null;

create or replace function public.award_points_for_save()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  -- Staff save places too — a case manager looking something up for one of
  -- their people — and points are a member mechanic (§8). Awarding them to
  -- staff would put the person who runs PAM at the top of a list of members.
  if (select role from public.profiles where id = new.member_id) <> 'member' then
    return new;
  end if;

  insert into public.points_ledger (member_id, delta, reason, subject_id)
  values (new.member_id, 5, 'save_place', new.service_id)
  on conflict (member_id, reason, subject_id) where subject_id is not null
  do nothing;

  return new;
end;
$$;

comment on function public.award_points_for_save is
  'Five points the first time a member saves a given place (POINTS_RULES.'
  'save_place). Runs in the database because a client that awards its own '
  'points is a score nobody can trust. Saving again earns nothing; unsaving '
  'takes nothing back.';

drop trigger if exists saved_places_award_points on public.saved_places;
create trigger saved_places_award_points
  after insert on public.saved_places
  for each row execute function public.award_points_for_save();

revoke all on function public.award_points_for_save() from public, anon, authenticated;
