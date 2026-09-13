/**
 * Points, levels and badges — SOP §8.
 *
 * The rule that shapes everything here: points reward REAL-WORLD ACTION, not
 * app usage. There is deliberately no award for opening the app, browsing, or
 * tapping around. If you are adding an award and cannot name the thing that
 * happened offline, it does not belong in this table.
 *
 * The ledger is append-only. A member's balance is the sum of their ledger
 * rows — there is no mutable balance column anywhere, by design (§8 acceptance).
 */

export type PointsReason =
  | 'save_place'
  | 'call_service'
  | 'self_reported_signup'
  | 'enrollment_approved'
  | 'attend_appointment_verified'
  | 'attend_appointment_sms'
  | 'weekly_streak'
  | 'complete_task'
  | 'connect_with_mentor'
  | 'reach_out_to_buddy'
  | 'refer_someone'
  | 'finish_setup';

export type VerificationKind =
  | 'automatic'
  | 'honor_system'
  | 'provider_action'
  | 'provider_checkin'
  | 'geofence'
  | 'sms_reply'
  | 'derived'
  | 'referral_code';

export interface PointsRule {
  readonly reason: PointsReason;
  readonly points: number;
  readonly verification: VerificationKind;
  /** Max awards per member per day, or null for no cap. */
  readonly dailyCap: number | null;
  readonly note?: string;
}

export const POINTS_RULES: Readonly<Record<PointsReason, PointsRule>> = {
  save_place: { reason: 'save_place', points: 5, verification: 'automatic', dailyCap: null },
  call_service: {
    reason: 'call_service',
    points: 10,
    verification: 'honor_system',
    dailyCap: null,
    note: 'Logged on tel: tap. We cannot verify the call connected.',
  },
  self_reported_signup: {
    reason: 'self_reported_signup',
    points: 25,
    verification: 'honor_system',
    dailyCap: 3,
  },
  enrollment_approved: {
    reason: 'enrollment_approved',
    points: 50,
    verification: 'provider_action',
    dailyCap: null,
  },
  /** Highest-confidence attendance: provider scanned the code, or geofence hit. */
  attend_appointment_verified: {
    reason: 'attend_appointment_verified',
    points: 100,
    verification: 'provider_checkin',
    dailyCap: null,
    note: 'Provider QR/code check-in, or geofence within 150m at appointment time.',
  },
  /** Lower confidence, so fewer points — §8 sets this at 60, not 100. */
  attend_appointment_sms: {
    reason: 'attend_appointment_sms',
    points: 60,
    verification: 'sms_reply',
    dailyCap: null,
    note: 'Member replied YES to the follow-up text. Self-reported.',
  },
  weekly_streak: {
    reason: 'weekly_streak',
    points: 50,
    verification: 'derived',
    dailyCap: null,
    note: '50 x consecutive weeks on the same program, capped at 300.',
  },
  complete_task: {
    reason: 'complete_task',
    points: 10,
    verification: 'honor_system',
    dailyCap: null,
    note: 'Task-defined, 10-50. The task row carries the actual value.',
  },
  connect_with_mentor: {
    reason: 'connect_with_mentor',
    points: 30,
    verification: 'automatic',
    dailyCap: null,
    note: 'Awarded on accepted connection, not on request.',
  },
  reach_out_to_buddy: {
    reason: 'reach_out_to_buddy',
    points: 10,
    verification: 'automatic',
    dailyCap: 1,
    note: 'First message to a buddy each day.',
  },
  refer_someone: {
    reason: 'refer_someone',
    points: 100,
    verification: 'referral_code',
    dailyCap: null,
  },
  /** §10 step 10: finishing onboarding. */
  finish_setup: { reason: 'finish_setup', points: 25, verification: 'automatic', dailyCap: 1 },
};

export const STREAK_POINTS_PER_WEEK = 50;
export const STREAK_POINTS_CAP = 300;
export const TASK_POINTS_MIN = 10;
export const TASK_POINTS_MAX = 50;
/** §8: geofence radius that counts as "at the appointment". */
export const GEOFENCE_RADIUS_METRES = 150;

export function streakPoints(consecutiveWeeks: number): number {
  if (consecutiveWeeks <= 0) return 0;
  return Math.min(consecutiveWeeks * STREAK_POINTS_PER_WEEK, STREAK_POINTS_CAP);
}

export interface Level {
  readonly key: string;
  /** i18n key for the encouraging, plain-language name. */
  readonly labelKey: string;
  readonly name: string;
  readonly minPoints: number;
}

/** Ascending. §8 names these deliberately — plain and encouraging, never ranked. */
export const LEVELS: readonly Level[] = [
  { key: 'starting_out', labelKey: 'level.starting_out', name: 'Starting Out', minPoints: 0 },
  { key: 'getting_going', labelKey: 'level.getting_going', name: 'Getting Going', minPoints: 250 },
  { key: 'on_my_way', labelKey: 'level.on_my_way', name: 'On My Way', minPoints: 750 },
  { key: 'steady', labelKey: 'level.steady', name: 'Steady', minPoints: 2000 },
  { key: 'leader', labelKey: 'level.leader', name: 'Leader', minPoints: 5000 },
];

export function levelForPoints(points: number): Level {
  let current = LEVELS[0]!;
  for (const level of LEVELS) {
    if (points >= level.minPoints) current = level;
    else break;
  }
  return current;
}

export function nextLevel(points: number): Level | null {
  return LEVELS.find((l) => l.minPoints > points) ?? null;
}

/** 0..1 progress toward the next level. Returns 1 at the top level. */
export function progressToNextLevel(points: number): number {
  const current = levelForPoints(points);
  const next = nextLevel(points);
  if (!next) return 1;
  const span = next.minPoints - current.minPoints;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (points - current.minPoints) / span));
}

export interface BadgeDefinition {
  readonly key: string;
  readonly labelKey: string;
  readonly name: string;
  readonly descriptionPlain: string;
  readonly icon: string;
  /** Evaluated nightly by the badge job. Mirrors `badges.rule` jsonb. */
  readonly rule: Readonly<Record<string, unknown>>;
}

export const BADGES: readonly BadgeDefinition[] = [
  {
    key: 'first_visit',
    labelKey: 'badge.first_visit',
    name: 'First Visit',
    descriptionPlain: 'You went to your first visit.',
    icon: 'map-pin',
    rule: { type: 'count', of: 'attended_appointments', atLeast: 1 },
  },
  {
    key: 'four_week_streak',
    labelKey: 'badge.four_week_streak',
    name: '4-Week Streak',
    descriptionPlain: 'You went 4 weeks in a row.',
    icon: 'flame',
    rule: { type: 'streak', weeks: 4 },
  },
  {
    key: 'got_my_id',
    labelKey: 'badge.got_my_id',
    name: 'Got My ID',
    descriptionPlain: 'You finished getting your ID papers.',
    icon: 'badge-check',
    rule: { type: 'completed_enrollment', subcategory: 'id_documents' },
  },
  {
    key: 'first_paycheck',
    labelKey: 'badge.first_paycheck',
    name: 'First Paycheck',
    descriptionPlain: 'You started a job.',
    icon: 'briefcase',
    rule: { type: 'completed_enrollment', subcategory: 'job_openings' },
  },
  {
    key: 'family_time',
    labelKey: 'badge.family_time',
    name: 'Family Time',
    descriptionPlain: 'You went to something for you and your family.',
    icon: 'heart',
    rule: { type: 'completed_enrollment', subcategory: 'kids_parenting' },
  },
  {
    key: 'helped_a_buddy',
    labelKey: 'badge.helped_a_buddy',
    name: 'Helped a Buddy',
    descriptionPlain: 'You cheered on a buddy.',
    icon: 'users',
    rule: { type: 'count', of: 'buddy_reactions_sent', atLeast: 5 },
  },
];

/**
 * §8: "No leaderboards among members. Comparison is harmful here."
 * Exported as a constant so a future contributor reaching for a ranked list
 * finds the rule instead of the absence of one.
 */
export const LEADERBOARDS_ENABLED = false as const;

/**
 * §8 [ASK WILL]: whether points redeem for real items (transit passes, phone
 * minutes) via partner providers. Built behind a flag, shipped OFF.
 */
export const REWARDS_ENABLED = false as const;
