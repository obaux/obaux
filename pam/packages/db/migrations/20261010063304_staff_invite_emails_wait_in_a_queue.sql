-- A staff invite's email waits in a queue for the sender (D-450, Will, 10 October
-- 2026: send emails, starting with staff invites).
--
-- 0086 made a staff invite carry an email, held in `invite_contact_emails` where
-- only a super admin can read it. Nothing sent to it. This adds the queue the
-- `send-invite-emails` Edge Function reads, and nothing the app uses changes:
-- EXPAND ONLY. The live app does not notice; there is no contract step.
--
--   1. `staff_invite_emails` — one row per staff invite: the language to write
--      it in, and where it stands (waiting, claimed, sent, failed). It holds no
--      address: the sender reads the address from `invite_contact_emails` at
--      the moment it sends, so the address lives in exactly one place and goes
--      when the invite is redeemed or the account is deleted (0086).
--   2. A trigger on `invite_contact_emails` queues the row when a staff invite
--      is made, so `invite_create` (0086) is not touched. The language is the
--      inviter's own: the invited person has no profile yet, and the inviter is
--      the one who can say what they read (D-450). It falls back to English in
--      the sender, as texts do, for a language nobody has signed.
--   3. Three functions for the sender, callable only with the service role:
--      claim a batch, mark one sent, mark one failed.
--
-- Rows queued while the sender is switched off simply wait; the sender sends only
-- while the invite is still open (pending, not expired), so an old row never
-- becomes an email about a link that no longer works. Invites made before this
-- migration are not queued: nobody asked for those to go out.

create table public.staff_invite_emails (
  invite_id      uuid primary key references public.invites (id) on delete cascade,
  locale         text not null default 'en',
  queued_at      timestamptz not null default now(),
  -- Set when the sender takes it; a claim older than 15 minutes is taken again
  -- (the sender died), and the provider is given the invite id as its
  -- idempotency key, so a second try cannot become a second email.
  claimed_at     timestamptz,
  attempts       integer not null default 0,
  sent_at        timestamptz,
  failure_reason text
);

alter table public.staff_invite_emails enable row level security;
alter table public.staff_invite_emails force row level security;
revoke all on public.staff_invite_emails from public, anon, authenticated;

-- As `invite_emails` has (0071): a super-admin-only policy, so the table is
-- never "RLS on and no policy" (03_invariants), while no grant to a client role
-- means in practice only the service role reaches it.
create policy staff_invite_emails_super_admin on public.staff_invite_emails
  for all using (public.is_super_admin()) with check (public.is_super_admin());

comment on table public.staff_invite_emails is
  'The queue of first-invite emails to staff (D-450). No address: it is read '
  'from invite_contact_emails when sent. Forced RLS, no policy, no grant: only '
  'the service role (the sender) and the functions below reach it.';

-- 2. Queued when the invite's email is stored.
create or replace function public.queue_staff_invite_email()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_language text;
begin
  select p.preferred_language into v_language
  from public.invites i
  join public.profiles p on p.id = i.created_by
  where i.id = new.invite_id;

  insert into public.staff_invite_emails (invite_id, locale)
  values (new.invite_id, coalesce(v_language, 'en'))
  on conflict (invite_id) do nothing;
  return new;
end;
$$;

revoke all on function public.queue_staff_invite_email() from public, anon, authenticated;

create trigger invite_contact_emails_queue
  after insert on public.invite_contact_emails
  for each row execute function public.queue_staff_invite_email();

-- 3. For the sender.
create or replace function public.claim_staff_invite_emails(p_limit integer default 20)
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
    select q.invite_id
    from public.staff_invite_emails q
    join public.invites i on i.id = q.invite_id
    join public.invite_contact_emails c on c.invite_id = q.invite_id
    where q.sent_at is null
      and q.attempts < 5
      and (q.claimed_at is null or q.claimed_at < now() - interval '15 minutes')
      and i.status = 'pending'
      and i.expires_at > now()
      and i.role in ('provider', 'admin')
    order by q.queued_at
    limit greatest(p_limit, 0)
    for update of q skip locked
  ),
  claimed as (
    update public.staff_invite_emails q
    set claimed_at = now(), attempts = q.attempts + 1
    from due
    where q.invite_id = due.invite_id
    returning q.invite_id, q.locale
  )
  select c.invite_id, ce.email, i.code, i.role, c.locale, p.first_name
  from claimed c
  join public.invites i on i.id = c.invite_id
  join public.invite_contact_emails ce on ce.invite_id = c.invite_id
  left join public.profiles p on p.id = i.created_by;
end;
$$;

comment on function public.claim_staff_invite_emails(integer) is
  'The sender takes a batch of first-invite emails still worth sending (D-450): '
  'invite open, role staff, not sent, under five tries, not claimed in the last '
  '15 minutes. Returns the address, so service role only.';

create or replace function public.mark_staff_invite_email_sent(p_id uuid)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  update public.staff_invite_emails
  set sent_at = now(), failure_reason = null
  where invite_id = p_id;
$$;

create or replace function public.mark_staff_invite_email_failed(p_id uuid, p_reason text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  -- Released so the next run tries again, up to five attempts; the reason is
  -- never a word of the email, only what went wrong.
  update public.staff_invite_emails
  set claimed_at = null, failure_reason = left(p_reason, 300)
  where invite_id = p_id and sent_at is null;
$$;

revoke all on function public.claim_staff_invite_emails(integer) from public, anon, authenticated;
revoke all on function public.mark_staff_invite_email_sent(uuid) from public, anon, authenticated;
revoke all on function public.mark_staff_invite_email_failed(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_staff_invite_emails(integer) to service_role;
grant execute on function public.mark_staff_invite_email_sent(uuid) to service_role;
grant execute on function public.mark_staff_invite_email_failed(uuid, text) to service_role;
