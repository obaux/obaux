-- 0067 — One activity fact for the people strip: that a member saved a new
-- place, and when. Never which place, never the last day they used PAM.
--
-- Home's people strip (D-198) lights a ring on somebody's avatar when there is
-- something new from them: an unread message (already known to the client
-- from its own conversation list) or a place they saved since the viewer last
-- looked. The second needs a database answer, and every existing route to
-- `saved_places` is the member's own (`saved_places_own`, 0007) — a case
-- manager or a program admin cannot read the table at all, which is right and
-- stays right.
--
-- What is added is exactly one fact, and the transparency contract says so
-- first (`new_save_without_the_place` in packages/config/transparency.ts,
-- D-199): for each member the caller may message, the time of their newest
-- save. Not the service id, not the name, not a count, not `last_active_at`.
-- D-166 — a program never sees member activity — is narrowed by this one line
-- on Will's instruction, and by nothing else.
--
-- Who: the same relationship the strip lists people by. The strip is
-- `messageable_people()` (0063), so this is `can_message()` (0063) again —
-- an active `admin_assignments` row for a case manager, an enrollment in the
-- org's service for a program admin. Not the region arm of `admin_covers()`:
-- sharing a city was never a relationship (D-176), and a ring on a stranger
-- would be worse than no ring. A member and a super admin get zero rows: a
-- member has no list, and a super admin messages nobody (D-171).
--
-- Only members with at least one save appear. A missing row means "nothing
-- to light", which is the same as a null and gives away less.

create or replace function public.people_activity()
returns table (
  profile_id    uuid,
  last_saved_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select sp.member_id, max(sp.saved_at)
  from public.saved_places sp
  join public.profiles p on p.id = sp.member_id and p.role = 'member'
  where auth.uid() is not null
    and public.my_role() in ('admin', 'provider')
    and public.can_message(auth.uid(), sp.member_id)
  group by sp.member_id;
$$;

comment on function public.people_activity is
  'For each member the caller may message (can_message(), 0063): when they last '
  'saved a place. Two columns, and the second is only a time — never the place '
  '(D-199). A member or a super admin gets no rows.';

revoke all on function public.people_activity() from public, anon;
grant execute on function public.people_activity() to authenticated;
