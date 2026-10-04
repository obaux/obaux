-- 0071 — An expired invite link can ask for a fresh one by email, and the
-- super admin sees every invite and where it stands (D-258, reworked by D-263,
-- Will, 4 October 2026).
--
-- Will, first: "Expired links … a page for expired links, keeping the context
-- about who invited them, prompting them to request a new link."
-- Will, second (D-263): "set 30 days expiry. No need to ask for their name,
-- only ask for email and email them the new invite link for their role …
-- remove the need for super admin to approve. Instead just keep a log of
-- invited people … all invitees by date, and show status."
--
-- Links keep the 30 days `invites.expires_at` has defaulted to since 0002.
--
-- Three things, and nothing else:
--
--   1. `invite_preview(code)` — callable signed out, because the person
--      holding an expired link has no account yet. It answers exactly what the
--      expired-link page shows and no more: the inviter's FIRST name, the role
--      the link was for, and whether the link is valid, expired or used. No
--      phone, no last name, no region, no ids. A wrong code answers
--      'not_found' — the same eight random characters that already guard
--      `redeem_invite` guard this.
--
--   2. `request_invite_link(code, email)` — also signed out. For an expired,
--      unused link only: makes a NEW invite for the same role, city and
--      inviter (30 days), and queues an email with it in `invite_emails`.
--      Nobody approves it. The new code is never returned to the caller — it
--      goes only to the inbox — so this cannot be used to mint working links
--      in the browser. One request per expired link: a second ask is a no-op,
--      so the button cannot flood anybody's inbox.
--
--   3. `invites_log()` — super admin only: every invite, newest first, who
--      made it, for what role, and its state now — joined (with the first
--      name of who joined), open, or expired — and, for a link that was sent
--      again, the address it went to.
--
-- `invite_emails` is an outbox: forced RLS, a super-admin-only policy and no
-- grants to any client role. Sending it needs an email provider and a sender
-- (an Edge Function with the provider's key); that is Will's call and is not
-- built here. Until it is, rows wait with `sent_at` empty and the log says
-- the link was asked for.

create table public.invite_emails (
  id              uuid primary key default gen_random_uuid(),
  -- The expired link somebody held, and the fresh one made for them.
  expired_invite  uuid not null references public.invites (id) on delete cascade,
  new_invite      uuid not null references public.invites (id) on delete cascade,
  email           text not null check (
                    char_length(email) between 3 and 254
                    and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
                  ),
  requested_at    timestamptz not null default now(),
  -- Set by whatever sends it. Empty means still waiting.
  sent_at         timestamptz
);

-- One fresh link per expired one: the second tap finds the first.
create unique index invite_emails_one_per_link on public.invite_emails (expired_invite);

alter table public.invite_emails enable row level security;
alter table public.invite_emails force row level security;
revoke all on public.invite_emails from public, anon, authenticated;

-- The super admin only, as the other review queues are (0049, 0054). Nothing
-- is granted to a client role, so in practice the functions below are the
-- whole way in; the policy is what makes that true even if a grant is ever
-- added by mistake.
create policy invite_emails_super_admin on public.invite_emails
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- 1. What an expired-link page may know.
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

-- 2. A fresh link, by email, for an expired one.
create or replace function public.request_invite_link(p_code text, p_email text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  inv     public.invites;
  fresh   public.invites;
  address text := lower(trim(coalesce(p_email, '')));
begin
  if address !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(address) > 254 then
    raise exception 'INVALID_EMAIL';
  end if;

  select * into inv from public.invites where code = upper(trim(p_code)) for update;
  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  if inv.status in ('redeemed', 'revoked') then
    raise exception 'INVITE_ALREADY_USED';
  end if;
  if inv.expires_at >= now() and inv.status = 'pending' then
    raise exception 'INVITE_STILL_VALID';
  end if;

  -- Asked already: the same answer, and no second email.
  if exists (select 1 from public.invite_emails where expired_invite = inv.id) then
    return true;
  end if;

  update public.invites set status = 'expired' where id = inv.id and status = 'pending';

  insert into public.invites (code, created_by, role, region_id, assigned_admin_id)
  values (public.generate_invite_code(), inv.created_by, inv.role, inv.region_id, inv.assigned_admin_id)
  returning * into fresh;

  insert into public.invite_emails (expired_invite, new_invite, email)
  values (inv.id, fresh.id, address);

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (null, 'invite.reissue', 'invite', fresh.id,
          jsonb_build_object('expired_invite', inv.id));

  return true;
end;
$$;

comment on function public.request_invite_link is
  'From the expired-link page (D-263): makes a new invite for the same role, '
  'city and inviter and queues it to an email address. Callable signed out; '
  'never returns the new code; one per expired link.';

revoke all on function public.request_invite_link(text, text) from public;
grant execute on function public.request_invite_link(text, text) to anon, authenticated;

-- 3. The super admin's log of invites.
create or replace function public.invites_log()
returns table (
  id             uuid,
  created_at     timestamptz,
  expires_at     timestamptz,
  invited_role   public.user_role,
  inviter_first  text,
  inviter_last   text,
  inviter_role   public.user_role,
  state          text,
  joined_first   text,
  emailed_to     text,
  reissued       boolean
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only the person running PAM sees every invite';
  end if;
  return query
    select i.id, i.created_at, i.expires_at, i.role,
           p.first_name, p.last_name, p.role,
           case
             when i.status = 'redeemed' then 'joined'
             when i.status = 'revoked' then 'expired'
             when i.expires_at < now() or i.status = 'expired' then 'expired'
             else 'open'
           end,
           j.first_name,
           e.email,
           e.id is not null
    from public.invites i
    join public.profiles p on p.id = i.created_by
    left join public.profiles j on j.id = i.redeemed_by
    left join public.invite_emails e on e.new_invite = i.id
    order by i.created_at desc;
end;
$$;

comment on function public.invites_log is
  'Every invite for the super admin (D-263): who made it, the role, joined / '
  'open / expired, who joined, and the address a re-sent link went to.';

revoke all on function public.invites_log() from public, anon;
grant execute on function public.invites_log() to authenticated;
