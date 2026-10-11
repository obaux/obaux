-- A program lead reads no appointment row directly (a63's promise, Will 11 October).
--
-- `appointments_provider_select` (20261010074241) let a lead read WHOLE rows for their org's services, or any row where
-- they are `provider_id`: the member's own `note`, `attendance_method` (how a visit was marked, which a63 promises a
-- program never learns), `check_in_code`, `geo` and `location_text`. RLS is per row, not per column, so the only honest
-- narrowing is to no direct read at all: a lead sees visits at their program through `my_program_visits` (first name, time,
-- service, whether they are there, and nothing else), which is a definer function and does not need the policy.
--
-- Mira asked for "only rows they booked themselves (provider_id = auth.uid())". That still hands a lead `attendance_method`
-- and `note` on a visit they booked for a member, which the member may have marked themselves, so it is `false` here.
-- A member still reads their own rows (`appointments_own_select`) and the admin policy is untouched. Nothing in the app
-- reads the table as a lead: the checks are on the definer functions.
--
-- Altered, not dropped. To give a lead some column back, add a function, not a policy.
--
-- EXPAND ONLY in the sense of no data change; it tightens a read nobody in the app uses.

alter policy appointments_provider_select on public.appointments using (false);
