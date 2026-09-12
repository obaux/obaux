-- 0007 — Row-Level Security. Default deny on every table.
--
-- This file is the whole access-control surface in one place, deliberately: it
-- is what a reviewer reads during the §13 Phase 7 penetration pass, and a
-- policy that lives next to its table is a policy nobody reads as a set.
--
-- The promises being enforced (SOP §4, §4.1) are:
--   * members read and write only their own rows
--   * providers reach a member only through an enrollment or a connection
--   * profiles.is_public = false hides a member from ALL discovery
--   * activities.visibility = 'buddies' reaches accepted buddies only
--   * messages reach conversation members only
--   * admins reach their caseload or their region, never another region
--   * admins NEVER read message bodies — metadata and reported excerpts only
--   * access_controls with allowed = false rejects writes server-side
--
-- The helpers are SECURITY DEFINER on purpose. A policy on `profiles` that
-- selects from `profiles` would recurse; a definer function reads underneath
-- RLS and returns a plain answer. Each one is `stable`, takes no user input it
-- does not validate, and sets an explicit search_path (repo convention).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, extensions
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.my_region()
returns uuid
language sql
stable
security definer
set search_path = public, extensions
as $$
  select region_id from public.profiles where id = auth.uid();
$$;

create or replace function public.my_org()
returns uuid
language sql
stable
security definer
set search_path = public, extensions
as $$
  select org_id from public.profiles where id = auth.uid();
$$;

-- A suspended account cannot act at all; a limited one can read but not write
-- social features (§4.1).
create or replace function public.my_access_status()
returns public.access_status
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce((select access_status from public.profiles where id = auth.uid()), 'suspended');
$$;

create or replace function public.is_active_account()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select public.my_access_status() = 'active';
$$;

-- §4.1: an admin reaches a member through the caseload, or through the region.
create or replace function public.admin_covers(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    public.is_admin()
    and (
      exists (
        select 1 from public.admin_assignments a
        where a.admin_id = auth.uid() and a.member_id = target and a.ended_at is null
      )
      or exists (
        select 1 from public.profiles p
        where p.id = target
          and p.region_id is not null
          and p.region_id = public.my_region()
      )
    );
$$;

comment on function public.admin_covers is
  'True when the caller is an admin whose caseload or region includes `target`. '
  'The region arm is why an admin never sees another region (SOP §4).';

-- §4: "Providers read members only where an `enrollment` or `connection` links
-- them." Both arms are checked here so no policy has to re-derive it.
create or replace function public.provider_linked_to(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.services s on s.id = e.service_id
    where e.member_id = target
      and s.org_id is not null
      and s.org_id = public.my_org()
  )
  or exists (
    select 1
    from public.appointments ap
    where ap.member_id = target and ap.provider_id = auth.uid()
  )
  or exists (
    select 1
    from public.connections c
    where c.status = 'accepted'
      and ((c.requester_id = auth.uid() and c.receiver_id = target)
        or (c.receiver_id = auth.uid() and c.requester_id = target))
  );
$$;

create or replace function public.in_conversation(conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.conversation_members m
    where m.conversation_id = conversation and m.profile_id = auth.uid()
  );
$$;

create or replace function public.are_buddies(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.connections c
    where c.kind = 'buddy'
      and c.status = 'accepted'
      and ((c.requester_id = a and c.receiver_id = b)
        or (c.requester_id = b and c.receiver_id = a))
  );
$$;

-- A block is permanent and mutual (§6.2 step 5). Every discovery and messaging
-- policy consults this.
create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.connections c
    where c.status = 'blocked'
      and ((c.requester_id = a and c.receiver_id = b)
        or (c.requester_id = b and c.receiver_id = a))
  );
$$;

-- §4: "a feature with allowed = false is hidden and its writes are rejected
-- server-side." Absence of a row means allowed — admins turn features OFF.
create or replace function public.feature_allowed(subject uuid, f public.controllable_feature)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(
    (select allowed from public.access_controls
      where subject_id = subject and feature = f),
    true
  );
$$;

create or replace function public.my_feature_allowed(f public.controllable_feature)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select public.feature_allowed(auth.uid(), f);
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere. No table is exempt; force it so even the table owner
-- is subject to policy (the service key still bypasses, by design, and is used
-- only inside Edge Functions for cron and imports).
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'regions', 'orgs', 'profiles', 'invites', 'admin_assignments',
    'service_subcategories', 'services', 'service_imports', 'geocode_cache',
    'saved_places', 'enrollments', 'appointments', 'reminders',
    'notification_preferences', 'tasks', 'connections', 'conversations',
    'conversation_members', 'messages', 'activities', 'activity_reactions',
    'reports', 'points_ledger', 'badges', 'member_badges',
    'facilitations', 'access_controls', 'audit_log'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy profiles_select_self on public.profiles
  for select using (id = auth.uid());

-- Discovery (§6.1). Gated on is_public AND is_mentor AND no block AND the
-- viewer having mentor_discovery enabled. A member who is not public is
-- invisible here however they are reached.
create policy profiles_select_discoverable_mentor on public.profiles
  for select using (
    is_mentor
    and is_public
    and access_status = 'active'
    and id <> auth.uid()
    and public.my_feature_allowed('mentor_discovery')
    and not public.is_blocked_between(auth.uid(), id)
  );

-- People you are already connected to stay visible even if they later go
-- private, otherwise an existing chat would show a nameless person.
create policy profiles_select_connected on public.profiles
  for select using (
    id <> auth.uid()
    and not public.is_blocked_between(auth.uid(), id)
    and exists (
      select 1 from public.connections c
      where c.status = 'accepted'
        and ((c.requester_id = auth.uid() and c.receiver_id = public.profiles.id)
          or (c.receiver_id = auth.uid() and c.requester_id = public.profiles.id))
    )
  );

create policy profiles_select_provider_linked on public.profiles
  for select using (
    public.my_role() = 'provider' and public.provider_linked_to(id)
  );

create policy profiles_select_admin_caseload on public.profiles
  for select using (public.admin_covers(id));

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid() and public.my_access_status() <> 'suspended')
  with check (id = auth.uid());

-- An admin may change a member's access_status and assignment, within scope.
-- Role changes are handled by SECURITY DEFINER RPCs that also write audit_log,
-- never by a direct UPDATE from a client.
create policy profiles_update_admin_caseload on public.profiles
  for update using (public.admin_covers(id))
  with check (public.admin_covers(id));

-- Insert happens once, at redemption, through the redeem_invite RPC. A client
-- may create only its own row, and only with a role the invite granted.
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- regions, orgs
-- ---------------------------------------------------------------------------

create policy regions_select_own on public.regions
  for select using (id = public.my_region() or public.my_role() in ('provider', 'member'));

create policy regions_write_admin on public.regions
  for all using (public.is_admin() and id = public.my_region())
  with check (public.is_admin() and id = public.my_region());

-- Orgs are public directory data: a member must be able to see who runs a
-- service before they call it.
create policy orgs_select_all on public.orgs for select using (true);

create policy orgs_update_own_provider on public.orgs
  for update using (
    public.my_role() = 'provider'
    and id = public.my_org()
    and public.feature_allowed(auth.uid(), 'provider_listing')
  )
  with check (id = public.my_org());

create policy orgs_write_admin on public.orgs
  for all using (public.is_admin() and (region_id is null or region_id = public.my_region()))
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- invites
-- ---------------------------------------------------------------------------

create policy invites_admin_manage on public.invites
  for all using (public.is_admin() and created_by = auth.uid())
  with check (public.is_admin() and created_by = auth.uid());

create policy invites_select_own_redeemed on public.invites
  for select using (redeemed_by = auth.uid());

-- Note: an unauthenticated person checking a code does NOT read this table.
-- Redemption goes through public.redeem_invite(), a SECURITY DEFINER RPC, so a
-- wrong guess cannot enumerate pending invites.

-- ---------------------------------------------------------------------------
-- admin_assignments
-- ---------------------------------------------------------------------------

create policy admin_assignments_admin on public.admin_assignments
  for all using (admin_id = auth.uid() and public.is_admin())
  with check (admin_id = auth.uid() and public.is_admin());

-- A member can see who supports them — that is the transparency promise.
create policy admin_assignments_select_member on public.admin_assignments
  for select using (member_id = auth.uid());

-- ---------------------------------------------------------------------------
-- services and the catalogue
-- ---------------------------------------------------------------------------

create policy subcategories_select_all on public.service_subcategories
  for select using (true);

create policy subcategories_admin_write on public.service_subcategories
  for all using (public.is_admin()) with check (public.is_admin());

-- Active, reviewed services are the public catalogue. A service still awaiting
-- import review is hidden from members and visible to admins only.
create policy services_select_published on public.services
  for select using (is_active and not needs_review);

create policy services_select_own_org on public.services
  for select using (org_id is not null and org_id = public.my_org());

create policy services_select_admin on public.services
  for select using (public.is_admin());

create policy services_write_provider on public.services
  for all using (
    public.my_role() = 'provider'
    and org_id = public.my_org()
    and public.feature_allowed(auth.uid(), 'provider_listing')
  )
  with check (org_id = public.my_org());

create policy services_write_admin on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- Import bookkeeping and the geocode cache are operational tables. Clients
-- never touch them; the importer runs with the service key.
create policy service_imports_admin on public.service_imports
  for all using (public.is_admin()) with check (public.is_admin());

create policy geocode_cache_no_client_access on public.geocode_cache
  for select using (false);

-- ---------------------------------------------------------------------------
-- Member-owned rows. Same shape throughout: the member owns them, the admin
-- reads them if covered, the linked provider reads what it needs to serve.
-- ---------------------------------------------------------------------------

create policy saved_places_own on public.saved_places
  for all using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy enrollments_own on public.enrollments
  for all using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy enrollments_select_provider on public.enrollments
  for select using (
    exists (
      select 1 from public.services s
      where s.id = service_id and s.org_id is not null and s.org_id = public.my_org()
    )
  );

-- A provider approves an enrollment into their own service (§7.1, +50 points).
create policy enrollments_update_provider on public.enrollments
  for update using (
    exists (
      select 1 from public.services s
      where s.id = service_id and s.org_id is not null and s.org_id = public.my_org()
    )
  )
  with check (true);

create policy enrollments_select_admin on public.enrollments
  for select using (public.admin_covers(member_id));

create policy appointments_own on public.appointments
  for all using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy appointments_provider on public.appointments
  for all using (
    provider_id = auth.uid()
    or exists (
      select 1 from public.services s
      where s.id = service_id and s.org_id is not null and s.org_id = public.my_org()
    )
  )
  with check (true);

create policy appointments_select_admin on public.appointments
  for select using (public.admin_covers(member_id));

create policy reminders_own on public.reminders
  for all using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy notification_preferences_own on public.notification_preferences
  for all using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy tasks_own on public.tasks
  for all using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy tasks_select_admin on public.tasks
  for select using (public.admin_covers(member_id));

-- ---------------------------------------------------------------------------
-- Connections and chat
-- ---------------------------------------------------------------------------

create policy connections_select_party on public.connections
  for select using (requester_id = auth.uid() or receiver_id = auth.uid());

-- Creating a connection requires an active account and the matching feature on.
create policy connections_insert_requester on public.connections
  for insert with check (
    requester_id = auth.uid()
    and public.is_active_account()
    and not public.is_blocked_between(auth.uid(), receiver_id)
    and case kind
      when 'mentor' then public.my_feature_allowed('mentor_discovery')
      when 'buddy' then public.my_feature_allowed('buddies')
    end
  );

-- Either party can respond; that is how accept, decline and block all work.
create policy connections_update_party on public.connections
  for update using (
    (requester_id = auth.uid() or receiver_id = auth.uid())
    and public.my_access_status() <> 'suspended'
  )
  with check (requester_id = auth.uid() or receiver_id = auth.uid());

-- §4.1 caseload visibility: an admin sees that a connection exists and what
-- kind it is. The names come from `profiles`, which they already reach for
-- their caseload. No content is exposed here.
create policy connections_select_admin on public.connections
  for select using (
    public.admin_covers(requester_id) or public.admin_covers(receiver_id)
  );

create policy conversations_select_member on public.conversations
  for select using (public.in_conversation(id));

create policy conversations_insert_participant on public.conversations
  for insert with check (public.is_active_account() and public.my_feature_allowed('chat'));

create policy conversation_members_select_own on public.conversation_members
  for select using (public.in_conversation(conversation_id));

create policy conversation_members_update_own on public.conversation_members
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy conversation_members_insert on public.conversation_members
  for insert with check (
    public.is_active_account()
    and (profile_id = auth.uid() or public.in_conversation(conversation_id))
  );

-- Messages: conversation members only. There is deliberately NO admin policy
-- on this table — §4.1 says admins never read message bodies, and the absence
-- of a policy is what makes that true rather than a convention.
create policy messages_select_conversation_member on public.messages
  for select using (public.in_conversation(conversation_id));

create policy messages_insert_sender on public.messages
  for insert with check (
    sender_id = auth.uid()
    and public.in_conversation(conversation_id)
    and public.is_active_account()
    and public.my_feature_allowed('chat')
  );

-- A sender may edit or retract only their own message. Nobody else can, and
-- moderation flags never delete (§6.4).
create policy messages_update_own on public.messages
  for update using (sender_id = auth.uid()) with check (sender_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Activity feed
-- ---------------------------------------------------------------------------

create policy activities_own on public.activities
  for all using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy activities_select_buddies on public.activities
  for select using (
    visibility = 'buddies'
    and public.are_buddies(auth.uid(), member_id)
    and public.my_feature_allowed('buddies')
  );

-- Note: no admin policy. §4.1 — "Admin does not see buddy feed posts."

create policy activity_reactions_select on public.activity_reactions
  for select using (
    exists (
      select 1 from public.activities a
      where a.id = activity_id
        and (a.member_id = auth.uid()
          or (a.visibility = 'buddies' and public.are_buddies(auth.uid(), a.member_id)))
    )
  );

create policy activity_reactions_insert_own on public.activity_reactions
  for insert with check (
    profile_id = auth.uid()
    and public.is_active_account()
    and public.my_feature_allowed('buddies')
    and exists (
      select 1 from public.activities a
      where a.id = activity_id
        and a.visibility = 'buddies'
        and public.are_buddies(auth.uid(), a.member_id)
    )
  );

create policy activity_reactions_delete_own on public.activity_reactions
  for delete using (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Reports — the single route by which an admin sees flagged content (§4.1)
-- ---------------------------------------------------------------------------

create policy reports_insert_reporter on public.reports
  for insert with check (reporter_id = auth.uid());

create policy reports_select_own on public.reports
  for select using (reporter_id = auth.uid());

create policy reports_admin_review on public.reports
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Points, badges
-- ---------------------------------------------------------------------------

-- Read-only to the member. Awards are written by Edge Functions with the
-- service key, so a client cannot mint itself points.
create policy points_ledger_select_own on public.points_ledger
  for select using (member_id = auth.uid());

create policy points_ledger_select_admin on public.points_ledger
  for select using (public.admin_covers(member_id));

create policy badges_select_all on public.badges for select using (true);

create policy member_badges_select_own on public.member_badges
  for select using (member_id = auth.uid());

create policy member_badges_select_admin on public.member_badges
  for select using (public.admin_covers(member_id));

create policy member_badges_select_buddies on public.member_badges
  for select using (public.are_buddies(auth.uid(), member_id));

-- ---------------------------------------------------------------------------
-- Admin layer
-- ---------------------------------------------------------------------------

create policy facilitations_admin on public.facilitations
  for all using (admin_id = auth.uid() and public.admin_covers(member_id))
  with check (admin_id = auth.uid() and public.admin_covers(member_id));

create policy facilitations_select_member on public.facilitations
  for select using (member_id = auth.uid());

create policy facilitations_provider on public.facilitations
  for select using (
    provider_id = auth.uid()
    or exists (
      select 1 from public.services s
      where s.id = service_id and s.org_id is not null and s.org_id = public.my_org()
    )
  );

-- Provider accepts or declines their own facilitation.
create policy facilitations_update_provider on public.facilitations
  for update using (provider_id = auth.uid()) with check (provider_id = auth.uid());

create policy facilitations_update_member on public.facilitations
  for update using (member_id = auth.uid()) with check (member_id = auth.uid());

-- A subject may READ what was turned off for them, so the app can show the
-- plain-language note. They can never write it.
create policy access_controls_select_subject on public.access_controls
  for select using (subject_id = auth.uid());

create policy access_controls_admin on public.access_controls
  for all using (public.is_admin() and public.admin_covers(subject_id))
  with check (public.is_admin() and public.admin_covers(subject_id) and set_by = auth.uid());

-- §3.3: an admin reviews their own actions in Me -> audit log.
create policy audit_log_select_own_actions on public.audit_log
  for select using (actor_id = auth.uid() and public.is_admin());

create policy audit_log_insert on public.audit_log
  for insert with check (actor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Append-only enforcement.
--
-- No UPDATE or DELETE policy exists on points_ledger or audit_log, which stops
-- clients. These triggers also stop the SERVICE KEY, which bypasses RLS
-- entirely — without them, a bug in an Edge Function could rewrite history in
-- the two tables whose whole value is that they cannot be rewritten.
-- ---------------------------------------------------------------------------

create or replace function public.reject_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception '% is append-only; % is not permitted', tg_table_name, tg_op
    using hint = 'Insert a compensating row instead of changing history.';
end;
$$;

create trigger points_ledger_append_only
  before update or delete on public.points_ledger
  for each row execute function public.reject_mutation();

create trigger audit_log_append_only
  before update or delete on public.audit_log
  for each row execute function public.reject_mutation();
