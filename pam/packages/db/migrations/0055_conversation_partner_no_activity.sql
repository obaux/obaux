-- 0055 — A conversation partner reads a name and a role, never activity info.
--
-- Will's follow-up on 0054: a program admin must not see a member's
-- "activity" info — `last_active_at`, and anything in that vein — through
-- the new messaging surface. Auditing what 0054's
-- `profiles_select_conversation_partner` actually granted: the whole
-- `profiles` row, to ANY conversation partner, of ANY role — `last_active_at`,
-- `phone`, `bio`, `tags`, `home_zip`, all of it. A raw `for select` policy has
-- no way to hand back some columns and not others; the moment the row was
-- readable at all, every column was.
--
-- Fixed the way 0043's `directory_people` already fixed the same shape of
-- problem: a SECURITY DEFINER function with a fixed, short column list —
-- `first_name` and `role`, nothing else — guarded by conversation membership
-- inside the function body rather than a table-wide grant. See DECISIONS.md
-- D-154 for the full reasoning, including why this is deliberately uniform
-- across every caller's role rather than program-admin-specific: nobody
-- needs `last_active_at` to know who is messaging them or who they are
-- messaging, so nobody gets it through this path — not a member, not a
-- program admin, and not a case manager either, who already has full
-- caseload visibility through the entirely separate `admin_covers()` /
-- `/admin/` path that this migration does not touch.

drop policy if exists profiles_select_conversation_partner on public.profiles;

create or replace function public.conversation_partners()
returns table (
  conversation_id uuid,
  profile_id      uuid,
  first_name      text,
  role            public.user_role
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    mine.conversation_id,
    theirs.profile_id,
    p.first_name,
    p.role
  from public.conversation_members mine
  join public.conversation_members theirs
    on theirs.conversation_id = mine.conversation_id
   and theirs.profile_id <> mine.profile_id
  join public.profiles p on p.id = theirs.profile_id
  where mine.profile_id = auth.uid();
$$;

comment on function public.conversation_partners is
  'For every conversation the caller is in, the other participant''s name and '
  'role — nothing else. Replaces the raw profiles_select_conversation_partner '
  'policy (0054), which exposed the whole profiles row including '
  'last_active_at and phone to any conversation partner. The guard is '
  '"mine.profile_id = auth.uid()" inside the function body, not the grant: '
  'PostgREST exposes every function in public to any signed-in caller (0007, '
  'CLAUDE.md), so a caller with no conversations simply gets zero rows.';

revoke all on function public.conversation_partners() from public;
revoke all on function public.conversation_partners() from anon;
grant execute on function public.conversation_partners() to authenticated;

-- Pre-existing and NOT touched by this migration, flagged rather than fixed:
-- `profiles_select_provider_linked` (0007) already grants a program admin the
-- WHOLE profiles row -- including last_active_at and phone -- for any member
-- linked via enrollment, appointment, or connection, independent of whether a
-- conversation exists at all. Narrowing 0054's conversation-specific policy
-- does not close that older, wider path: a program admin who has never
-- messaged a member they are enrolled with can still read that member's
-- last_active_at today by querying `profiles` directly. This is a
-- pre-existing general provider-role RLS question, not something this
-- session's messaging work introduced, and is out of scope for this
-- migration -- see DECISIONS.md D-154's closing note.
