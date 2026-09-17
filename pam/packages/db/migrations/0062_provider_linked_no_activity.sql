-- 0062 — Program admins never see a member's activity info, app-wide.
--
-- Will, confirming and widening D-165's closing note: "program admins don't
-- see activity, across entire app" — a blanket product rule, not something
-- scoped to messaging. `profiles_select_provider_linked` (0007) is the one
-- place left that could hand it to them: a raw row policy granting a
-- provider the WHOLE `profiles` row — `last_active_at`, `phone`, `bio`,
-- everything — for any member linked through an enrollment, an appointment,
-- or a connection, with no conversation required. It predates messaging
-- entirely and is unaffected by 0060/0061.
--
-- Closed the same way, for the same reason a raw policy cannot expose some
-- columns and not others: a SECURITY DEFINER function with a fixed column
-- list, guarded by `provider_linked_to()` inside the function body. `phone`
-- is dropped in the same pass rather than left for later, per instruction —
-- there is no reason to touch this policy twice for the same shape of gap.
--
-- Case managers and super admins are unaffected. `profiles_select_admin_caseload`
-- (`admin_covers()`) is untouched — this migration is provider-role-specific,
-- matching exactly what was asked.
--
-- `apps/web` was grepped for every place a provider reads `profiles` for a
-- linked member: `useMessageableMembers.ts` (messaging eligibility) is the
-- only real one — `/interested/` renders `@pam/config/dummy-people` only, and
-- nothing else in the app queries `enrollments`/`appointments` yet. Updated
-- to call this function; nothing else needed changing.

drop policy if exists profiles_select_provider_linked on public.profiles;

create or replace function public.provider_linked_members()
returns table (
  id         uuid,
  first_name text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p.id, p.first_name
  from public.profiles p
  where public.my_role() = 'provider'
    and public.provider_linked_to(p.id)
  order by p.first_name asc nulls last, p.id asc;
$$;

comment on function public.provider_linked_members is
  'Every member a program admin reaches through an enrollment, appointment or '
  'connection (provider_linked_to) — id and first name, nothing else. '
  'Replaces the raw profiles_select_provider_linked policy (0007), which '
  'exposed the whole profiles row including last_active_at and phone. '
  'Case managers reach this same fact set through an entirely separate path '
  '(admin_covers, profiles_select_admin_caseload) that this migration does '
  'not touch — the exclusion is provider-role-specific, not a general '
  'narrowing of what any staff role may see. A future screen that needs more '
  'than a name for a linked member (to schedule an appointment, say) should '
  'extend this function''s column list deliberately — reaching for a raw '
  'profiles policy again reopens exactly this gap.';

revoke all on function public.provider_linked_members() from public;
revoke all on function public.provider_linked_members() from anon;
grant execute on function public.provider_linked_members() to authenticated;
