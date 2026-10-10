-- An address typed on the expired-link page is deleted once it has done its job (D-487, the merge
-- desk for Will, 10 October 2026). Expand only; no DROP anywhere (D-387).
--
-- Someone whose invite link ran out types an email address on the expired-link page
-- (`request_invite_link`, 0071/0085) and a fresh link is mailed to it. Nothing needs that address
-- afterwards, but `invite_emails` kept it for ever and the super admin's invites log showed it. The
-- privacy page promised a member is never asked for an email; this makes the address as short-lived
-- as it can be.
--
-- WHEN IT GOES.
--   * As soon as the fresh link is sent (`mark_invite_link_email_sent`).
--   * When it can no longer be sent: the request is more than seven days old, the fresh link was
--     used or has run out, or the sender is out of tries (`purge_invite_email_addresses()`). That
--     runs at the start of every claim (every five minutes once the sender is on) and once a night
--     from pg_cron where the project has it.
--
-- WHAT STAYS. The row: that a link was asked for, when, in what language, for which invites, and
-- whether and when it was sent. Not the address. Anything that needs "one link per expired link"
-- (`invite_emails_one_per_link`) is untouched, so a second request still sends no second email.
--
-- WHY A PLACEHOLDER, NOT NULL. `invite_emails.email` is NOT NULL, and dropping that constraint is a
-- `DROP` the live connector refuses (D-387). So a removed address is replaced by one fixed string that
-- is not an address anyone can receive (`removed@removed.invalid`, a reserved top-level domain), and
-- `address_removed_at` says it was removed. A check holds the two together. A later, separate
-- migration can make the column nullable and clear the placeholder once Will can paste it.
--
-- STAFF. Their address lives in `invite_contact_emails` and is kept on the account at redeem;
-- `keep_invite_email` follows the `invite_emails` chain by invite ids, never by address, and reads
-- only `invite_contact_emails`, so it is unaffected (a test holds it). The address typed on an
-- expired staff link is a second copy nothing uses, and goes the same way.
--
-- THE LOG. `invites_log` returns no address for a removed one (`emailed_to` is null, `reissued` is still
-- true). The invites log screen shows an address only when there is one, so it copes as it is; saying
-- "sent by email" instead needs a new line of copy in the Accounts lane's screen.

alter table public.invite_emails
  add column if not exists address_removed_at timestamptz;

do $do$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.invite_emails'::regclass and conname = 'invite_emails_removed_has_no_address'
  ) then
    alter table public.invite_emails
      add constraint invite_emails_removed_has_no_address
      check (address_removed_at is null or email = 'removed@removed.invalid');
  end if;
end;
$do$;

comment on column public.invite_emails.address_removed_at is
  'Set when the address was deleted (D-487): the email column then holds the fixed placeholder '
  'removed@removed.invalid. The row keeps that a link was asked for and sent, not where.';

-- ---------------------------------------------------------------------------
-- The sweep

create or replace function public.purge_invite_email_addresses()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  removed integer;
begin
  update public.invite_emails e
  set email = 'removed@removed.invalid', address_removed_at = now()
  where e.address_removed_at is null
    and (
      e.sent_at is not null
      or e.requested_at < now() - interval '7 days'
      or e.attempts >= 5
      or not exists (
        select 1 from public.invites i
        where i.id = e.new_invite and i.status = 'pending' and i.expires_at > now()
      )
    );
  get diagnostics removed = row_count;
  return removed;
end;
$$;

comment on function public.purge_invite_email_addresses is
  'Deletes the address from every expired-link email that is sent, too old, out of tries or whose '
  'fresh link was used or ran out (D-487). Service role and the nightly job only.';

revoke all on function public.purge_invite_email_addresses() from public, anon, authenticated;
grant execute on function public.purge_invite_email_addresses() to service_role;

-- ---------------------------------------------------------------------------
-- Sent: the address goes with it

create or replace function public.mark_invite_link_email_sent(p_id uuid)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  update public.invite_emails
  set sent_at = now(),
      failure_reason = null,
      email = 'removed@removed.invalid',
      address_removed_at = coalesce(address_removed_at, now())
  where id = p_id;
$$;

-- ---------------------------------------------------------------------------
-- The claim sweeps first, and never hands over a removed address

create or replace function public.claim_invite_link_emails(p_limit integer default 20)
returns table (
  id                 uuid,
  email              text,
  code               text,
  role               public.user_role,
  locale             text,
  inviter_first_name text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.purge_invite_email_addresses();

  return query
  with due as (
    select e.id
    from public.invite_emails e
    join public.invites i on i.id = e.new_invite
    where e.sent_at is null
      and e.address_removed_at is null
      and e.attempts < 5
      and e.requested_at > now() - interval '7 days'
      and (e.claimed_at is null or e.claimed_at < now() - interval '15 minutes')
      and i.status = 'pending'
      and i.expires_at > now()
    order by e.requested_at
    limit greatest(p_limit, 0)
    for update of e skip locked
  ),
  claimed as (
    update public.invite_emails e
    set claimed_at = now(), attempts = e.attempts + 1
    from due
    where e.id = due.id
    returning e.id, e.email, e.new_invite, e.locale
  )
  select c.id, c.email, i.code, i.role, c.locale, p.first_name
  from claimed c
  join public.invites i on i.id = c.new_invite
  left join public.profiles p on p.id = i.created_by;
end;
$$;

-- ---------------------------------------------------------------------------
-- The log copes with an address that is gone

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
           case when e.address_removed_at is null then e.email end,
           e.id is not null
    from public.invites i
    join public.profiles p on p.id = i.created_by
    left join public.profiles j on j.id = i.redeemed_by
    left join public.invite_emails e on e.new_invite = i.id
    order by i.created_at desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- The nightly sweep, where the project has a scheduler, and once now.

do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'purge-invite-email-addresses';
    perform cron.schedule(
      'purge-invite-email-addresses',
      '40 3 * * *',
      'select public.purge_invite_email_addresses()'
    );
  else
    raise notice 'pg_cron is not installed here; skipping the invite email address sweep schedule';
  end if;
end;
$do$;

select public.purge_invite_email_addresses();
