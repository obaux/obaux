-- 0001 — Extensions and shared types.
--
-- Repo convention (CLAUDE.md): pgcrypto lives in the `extensions` schema, so
-- every SECURITY DEFINER function that touches it must
-- `set search_path = public, extensions`. Every such function below does.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;

-- Distance filters in §5.1 (1 / 3 / 10 miles) and the §8 geofence (150 m) are
-- both real spatial queries, so locations are geography(Point, 4326) rather
-- than a pair of floats. Metres are the unit everywhere; miles are a display
-- concern handled in the UI.

-- ---------------------------------------------------------------------------
-- Enumerated types. Each mirrors a closed set named in the SOP. Using enums
-- rather than free text means a typo in an Edge Function fails at write time
-- instead of quietly creating a status nothing handles.
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('member', 'provider', 'admin');

create type public.access_status as enum ('active', 'limited', 'suspended');

create type public.controllable_feature as enum (
  'chat', 'mentor_discovery', 'buddies', 'map', 'points', 'provider_listing'
);

create type public.invite_status as enum ('pending', 'redeemed', 'expired', 'revoked');

create type public.service_category as enum ('education', 'workforce', 'family_services');

create type public.service_source as enum ('manual', 'city_import');

create type public.enrollment_status as enum (
  'interested', 'requested', 'enrolled', 'active', 'completed', 'dropped'
);

create type public.appointment_status as enum ('scheduled', 'attended', 'missed', 'cancelled');

create type public.reminder_channel as enum ('sms', 'push');

create type public.reminder_status as enum ('scheduled', 'sent', 'failed', 'cancelled', 'skipped');

create type public.connection_kind as enum ('mentor', 'buddy');

create type public.connection_status as enum ('pending', 'accepted', 'declined', 'blocked');

create type public.conversation_kind as enum ('direct', 'mentor');

create type public.activity_type as enum (
  'enrolled', 'attended', 'visited', 'completed_task', 'streak', 'referred'
);

create type public.activity_visibility as enum ('private', 'buddies');

create type public.facilitation_status as enum (
  'proposed', 'accepted_by_member', 'accepted_by_provider', 'active', 'declined', 'closed'
);

-- Attendance confidence drives the points award (§8): a provider scan is worth
-- 100, an SMS "YES" 60. Storing the method makes that auditable after the fact.
create type public.attendance_method as enum ('provider_checkin', 'geofence', 'sms_reply');
