-- A visit can say which program booked it, and the bell can say so (D-595, a94).
--
-- Will, 17 October 05:46 (card a94): "If a program books an appointment on behalf of a member, it should show on the member's
-- trips section or on their explore page for an upcoming visit. The only way that we can confirm if the member showed up is if
-- the member checks in or the program checks in. If a program booked an appointment for a member and the member didn't show up,
-- the case manager should see that the appointment was booked by the program and missed by the member."
--
-- Two small things, both EXPAND ONLY:
--
--   1. `appointments.booked_by_org`: the organisation that booked the visit for the member, null for every visit a member planned
--      themselves. An organisation, not a person: a member (who reads their own visits) and a case manager (who reads their
--      caseload's, `appointments_select_admin`) can then see that a program booked it, and which one, without a program lead's
--      profile id being handed to them. Which lead did it is in `audit_log`. Nothing grants anyone a write on the column
--      (test 69 still holds): only `book_visit_for_member` sets it.
--
--   2. A new kind of bell notice, `visit_booked_for_you`, for the member the visit was booked for. A notice is a locale key and its
--      variables, never a sentence and never anybody's words (0038): here the place and the time, nothing a person typed.

alter table public.appointments
  add column if not exists booked_by_org uuid references public.orgs (id) on delete set null;

create index if not exists appointments_booked_by_org_idx
  on public.appointments (booked_by_org, created_at) where booked_by_org is not null;

comment on column public.appointments.booked_by_org is
  'The organisation that booked this visit for the member (D-595), null when the member planned it. Written only by '
  'book_visit_for_member; read by the member and by a case manager who covers them.';

alter table public.notifications drop constraint if exists notifications_kind_known;
alter table public.notifications add constraint notifications_kind_known check (
  kind in (
    'service_flagged', 'service_removed', 'message_reported',
    'staff_request_pending', 'message_received', 'visit_booked_for_you'
  )
);
