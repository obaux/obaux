-- The expired-link email has a sender (D-476). Expand only.
--
-- Someone whose invite link ran out asks for a fresh one by email
-- (`request_invite_link`, 0071/0085): a new invite is made and a row is put in
-- `invite_emails`. Nothing ever sent it. This gives that table what the staff
-- invite queue has (20261010063304) — a claim that hands the sender a batch, a
-- 15-minute lease so a dead sender's rows are taken again, five tries, and a
-- reason when one fails — so the same function, under the same switch and the
-- same secrets, can send both.
--
-- What is worth sending: the fresh invite is still open, and the request is
-- recent (seven days; the email says the link works for 30 days, and nobody
-- should get a "here is your new link" a month after they asked). Requests made
-- before this runs, and still inside those limits, are sent when the sender is
-- first switched on — which is right: they were told to check their email.
--
-- The claim returns the address and the new link's code, so it is the service
-- role only, like the staff one.

alter table public.invite_emails
  add column if not exists claimed_at     timestamptz,
  add column if not exists attempts       integer not null default 0,
  add column if not exists failure_reason text;

comment on column public.invite_emails.claimed_at is
  'Set when the sender takes the row; a claim older than 15 minutes is taken again (D-476).';
comment on column public.invite_emails.attempts is
  'How many times the sender has tried; it stops at five (D-476).';

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
  return query
  with due as (
    select e.id
    from public.invite_emails e
    join public.invites i on i.id = e.new_invite
    where e.sent_at is null
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

comment on function public.claim_invite_link_emails(integer) is
  'The sender takes a batch of expired-link emails still worth sending (D-476): '
  'the fresh invite still open, asked for in the last seven days, not sent, under '
  'five tries, not claimed in the last 15 minutes. Returns the address, so service role only.';

create or replace function public.mark_invite_link_email_sent(p_id uuid)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  update public.invite_emails
  set sent_at = now(), failure_reason = null
  where id = p_id;
$$;

create or replace function public.mark_invite_link_email_failed(p_id uuid, p_reason text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  -- Released so the next run tries again, up to five attempts; the reason is
  -- never a word of the email, only what went wrong.
  update public.invite_emails
  set claimed_at = null, failure_reason = left(p_reason, 300)
  where id = p_id and sent_at is null;
$$;

revoke all on function public.claim_invite_link_emails(integer) from public, anon, authenticated;
revoke all on function public.mark_invite_link_email_sent(uuid) from public, anon, authenticated;
revoke all on function public.mark_invite_link_email_failed(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_invite_link_emails(integer) to service_role;
grant execute on function public.mark_invite_link_email_sent(uuid) to service_role;
grant execute on function public.mark_invite_link_email_failed(uuid, text) to service_role;
