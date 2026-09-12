/**
 * @pam/db — typed access to the PAM database.
 *
 * `Database` is hand-written for Phase 0 so the app has types before a Supabase
 * project exists. Once one is provisioned, regenerate it with
 * `supabase gen types typescript --project-id <id>` and replace this file; the
 * exported names are chosen to match what the generator emits.
 */

export type Role = 'member' | 'provider' | 'admin';
export type AccessStatus = 'active' | 'limited' | 'suspended';
export type ServiceCategory = 'education' | 'workforce' | 'family_services';
export type EnrollmentStatus =
  | 'interested' | 'requested' | 'enrolled' | 'active' | 'completed' | 'dropped';
export type AppointmentStatus = 'scheduled' | 'attended' | 'missed' | 'cancelled';
export type AttendanceMethod = 'provider_checkin' | 'geofence' | 'sms_reply';
export type ConnectionKind = 'mentor' | 'buddy';
export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';
export type ActivityVisibility = 'private' | 'buddies';
export type FacilitationStatus =
  | 'proposed' | 'accepted_by_member' | 'accepted_by_provider' | 'active' | 'declined' | 'closed';
export type ControllableFeature =
  | 'chat' | 'mentor_discovery' | 'buddies' | 'map' | 'points' | 'provider_listing';

export interface Profile {
  id: string;
  role: Role;
  first_name: string | null;
  display_name: string | null;
  photo_url: string | null;
  phone: string | null;
  preferred_language: string;
  home_zip: string | null;
  bio: string | null;
  tags: string[];
  is_mentor: boolean;
  is_public: boolean;
  org_id: string | null;
  region_id: string | null;
  invited_by: string | null;
  access_status: AccessStatus;
  last_active_at: string | null;
  onboarded_at: string | null;
  transparency_ack_at: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  org_id: string | null;
  name: string;
  category: ServiceCategory;
  subcategory: string | null;
  description_plain: string | null;
  eligibility_plain: string | null;
  how_to_enroll_plain: string | null;
  address: string | null;
  place_id: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  contact_name: string | null;
  hours: Record<string, unknown> | null;
  source: 'manual' | 'city_import';
  source_ref: string | null;
  needs_review: boolean;
  last_verified_at: string | null;
  is_active: boolean;
}

export interface Enrollment {
  id: string;
  member_id: string;
  service_id: string;
  status: EnrollmentStatus;
  started_at: string | null;
  notes: string | null;
}

export interface Appointment {
  id: string;
  member_id: string;
  service_id: string | null;
  provider_id: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  location_text: string | null;
  status: AppointmentStatus;
  series_id: string | null;
  check_in_code: string | null;
  checked_in_at: string | null;
  attendance_method: AttendanceMethod | null;
}

export interface PointsLedgerRow {
  id: string;
  member_id: string;
  delta: number;
  reason: string;
  activity_id: string | null;
  created_at: string;
}

export interface Facilitation {
  id: string;
  admin_id: string;
  member_id: string;
  provider_id: string | null;
  service_id: string | null;
  note_plain: string | null;
  status: FacilitationStatus;
  enrollment_id: string | null;
  conversation_id: string | null;
  created_at: string;
}

export interface AccessControl {
  id: string;
  subject_id: string;
  feature: ControllableFeature;
  allowed: boolean;
  set_by: string;
  /**
   * Internal justification. NEVER render this to the subject — show
   * `user_facing_note` instead (§4.1).
   */
  reason: string;
  user_facing_note: string | null;
  updated_at: string;
}

/**
 * A member's points balance is always computed, never stored (§8). This helper
 * exists so no caller is tempted to add a cached column.
 */
export function balanceFromLedger(rows: readonly Pick<PointsLedgerRow, 'delta'>[]): number {
  return rows.reduce((sum, row) => sum + row.delta, 0);
}
