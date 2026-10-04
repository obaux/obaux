-- 0071 — Invite links last 14 days, and an expired one can ask to be renewed
-- (D-258, Will, 4 October 2026).
--
-- Will: "Expired links; let's extend to 14 days. Let's create a page for
-- expired links, keeping the context about who invited them, prompting them
-- to request a new link, which sends a notice to super admin requests,
-- showing who invited who (approve/deny)."
--
-- Four things, and nothing else:
--
--   1. `invites.expires_at` defaults to 14 days (it was 30 in 0002; the
--      prototype has said 7). Existing invites keep the date they were given.
--
--   2. `invite_preview(code)` — callable signed out, because the person
--      holding an expired link has no account yet. It answers exactly what the
--      expired-link page shows and no more: the inviter's FIRST name, the role
--      the link was for, and whether the link is valid, expired or used. No
--      phone, no last name, no region, no ids. A wrong code answers
--      'not_found' — the same eight random characters that already guard
--      `redeem_invite` guard this.
--
--   3. `request_invite_renewal(code, first_name)` — also signed out. Records
--      one pending request per expired, unused invite (a second tap is a
--      no-op, not a second row), so the button cannot be used to flood the
--      super admin's list. A valid or used link cannot be "renewed".
--
--   4. `invite_renewals_pending()` and `decide_invite_renewal(id, decision)`
--      — super admin only. Approving gives the SAME invite 14 more days, so
--      the link the person already holds works again; nothing new to send.
--      Both are audited.
--
-- `invite_renewals` has forced RLS, a super-admin-only policy and no grants
-- to any client role: nobody reads it directly; the four functions are the
-- whole surface.

alter table public.invites
  alter column expires_at set default (now() + interval '14 days');

create table public.invite_renewals (
  id            uuid primary key default gen_random_uuid(),
  invite_id     uuid not null references public.invites (id) on delete cascade,
  -- What the person typed on the expired-link page, so the request reads as
  -- somebody rather than a code. Optional; never shown to anyone but the
  -- super admin.
  first_name    text check (first_name is null or char_length(first_name) between 1 and 60),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  requested_at  timestamptz not null default now(),
  decided_by    uuid references public.profiles (id) on delete set null,
  decided_at    timestamptz
);

-- One open request per invite: the second tap finds the first.
create unique index invite_renewals_one_pending
  on public.invite_renewals (invite_id) where status = 'pending';

alter table public.invite_renewals enable row level security;
alter table public.invite_renewals force row level security;
revoke all on public.invite_renewals from public, anon, authenticated;

-- The super admin only, as the other review queues are (0049, 0054). Nothing
-- is granted to a client role, so in practice the four functions below are
-- the whole way in; the policy is what makes that true even if a grant is
-- ever added by mistake.
create policy invite_renewals_super_admin on public.invite_renewals
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- 2. What an expired-link page may know.
create or replace function public.invite_preview(p_code text)
returns table (inviter_first_name text, invited_role public.user_role, state text)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  inv public.invites;
begin
  select * into inv from public.invites where code = upper(trim(p_code));
  if not found then
    return query select null::text, null::public.user_role, 'not_found'::text;
    return;
  end if;
  return query
    select p.first_name,
           inv.role,
           case
             when inv.status = 'redeemed' then 'used'
             when inv.status = 'revoked' then 'used'
             when inv.expires_at < now() or inv.status = 'expired' then 'expired'
             else 'valid'
           end
    from public.profiles p
    where p.id = inv.created_by;
end;
$$;

comment on function public.invite_preview is
  'For the expired-link page (D-258): the inviter''s first name, the invited '
  'role and valid/expired/used/not_found. Nothing else. Callable signed out.';

revoke all on function public.invite_preview(text) from public;
grant execute on function public.invite_preview(text) to anon, authenticated;

-- 3. Ask for the same link to be renewed.
create or replace function public.request_invite_renewal(p_code text, p_first_name text default null)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  inv public.invites;
  name text := nullif(trim(coalesce(p_first_name, '')), '');
begin
  select * into inv from public.invites where code = upper(trim(p_code));
  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  if inv.status in ('redeemed', 'revoked') then
    raise exception 'INVITE_ALREADY_USED';
  end if;
  if inv.expires_at >= now() and inv.status = 'pending' then
    raise exception 'INVITE_STILL_VALID';
  end if;
  if name is not null and char_length(name) > 60 then
    name := left(name, 60);
  end if;

  insert into public.invite_renewals (invite_id, first_name)
  values (inv.id, name)
  on conflict (invite_id) where status = 'pending' do nothing;

  return true;
end;
$$;

comment on function public.request_invite_renewal is
  'From the expired-link page (D-258): one pending renewal request per '
  'expired, unused invite. Callable signed out; repeat calls do nothing.';

revoke all on function public.request_invite_renewal(text, text) from public;
grant execute on function public.request_invite_renewal(text, text) to anon, authenticated;

-- 4a. The super admin's list: who invited whom, as what, and when it lapsed.
create or replace function public.invite_renewals_pending()
returns table (
  id                uuid,
  invited_role      public.user_role,
  invited_phone     text,
  invited_name      text,
  inviter_first     text,
  inviter_last      text,
  inviter_role      public.user_role,
  expired_at        timestamptz,
  requested_at      timestamptz
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only the person running PAM sees renewal requests';
  end if;
  return query
    select r.id, i.role, i.phone, r.first_name,
           p.first_name, p.last_name, p.role,
           i.expires_at, r.requested_at
    from public.invite_renewals r
    join public.invites i on i.id = r.invite_id
    join public.profiles p on p.id = i.created_by
    where r.status = 'pending'
    order by r.requested_at;
end;
$$;

revoke all on function public.invite_renewals_pending() from public, anon;
grant execute on function public.invite_renewals_pending() to authenticated;

-- 4b. Yes (the same link works for 14 more days) or no.
create or replace function public.decide_invite_renewal(p_id uuid, p_decision text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  req public.invite_renewals;
begin
  if not public.is_super_admin() then
    raise exception 'Only the person running PAM decides renewal requests';
  end if;
  if p_decision not in ('approved', 'denied') then
    raise exception 'A decision is approved or denied';
  end if;

  select * into req from public.invite_renewals where id = p_id and status = 'pending' for update;
  if not found then
    raise exception 'No open request with that id';
  end if;

  update public.invite_renewals
     set status = p_decision, decided_by = caller, decided_at = now()
   where id = p_id;

  if p_decision = 'approved' then
    update public.invites
       set expires_at = now() + interval '14 days',
           status = 'pending'
     where id = req.invite_id
       and status in ('pending', 'expired');
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'invite.renewal.' || p_decision, 'invite', req.invite_id,
          jsonb_build_object('renewal_id', p_id));
end;
$$;

revoke all on function public.decide_invite_renewal(uuid, text) from public, anon;
grant execute on function public.decide_invite_renewal(uuid, text) to authenticated;
