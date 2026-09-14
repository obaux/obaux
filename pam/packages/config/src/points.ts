import type { Category } from './categories.js';

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

/**
 * The badges, named by Will (14 September).
 *
 * The names are the point of them. PAM's members are returning citizens, and
 * the vocabulary a system uses about somebody becomes the vocabulary they use
 * about themselves — so these are drawn from the village rather than from the
 * gym: Returned, Rooted, Elder, Sankofa. Nothing here is a rank over another
 * member (§8 forbids leaderboards), and nothing implies a person was less than
 * whole before they earned it.
 *
 * Three groups, because they are earned three different ways:
 *
 *   - **Core progression** is points, which come from real-world activity —
 *     enrolling, attending, keeping at it. These are the ladder.
 *   - **Category** badges belong to the three fixed tracks (§2.5), two per
 *     track: one for starting, one for depth.
 *   - **Milestone** badges are one-offs. Some are warm (Homecoming), one is
 *     deliberately forgiving: Sankofa, the Akan symbol for going back to fetch
 *     what was left, reframes a lapse as a return. For a population whose
 *     experience of "you missed your appointment" is punitive, that distinction
 *     is not decoration.
 *
 * `Patriarch` was offered for the family track and is deliberately not used:
 * not every member is a man, and Steward says the same thing about somebody who
 * holds a household together without assuming who they are.
 *
 * Two of these cannot be earned yet, and say so in `blockedBy`: PAM has no
 * buddy system — the only relationships modelled today are member to mentor and
 * member to case manager — so Drum and Elder wait on it. They are defined now
 * because the names are the decision; the rules can follow.
 */
export type BadgeGroup = 'core' | 'category' | 'milestone';

export interface BadgeDefinition {
  readonly key: string;
  readonly labelKey: string;
  readonly name: string;
  readonly descriptionPlain: string;
  readonly icon: string;
  readonly group: BadgeGroup;
  /** Core progression only: the balance that earns it. */
  readonly minPoints?: number;
  /** Which fixed track it belongs to, for category badges. */
  readonly category?: Category;
  /** Evaluated nightly by the badge job. Mirrors `badges.rule` jsonb. */
  readonly rule: Readonly<Record<string, unknown>>;
  /** Named when the product cannot award this yet, so nobody ships it silently. */
  readonly blockedBy?: string;
}

export const BADGES: readonly BadgeDefinition[] = [
  // Core progression — the ladder, earned by points from real activity.
  {
    key: 'returned',
    labelKey: 'badge.returned',
    name: 'Returned',
    descriptionPlain: 'The village kept your place.',
    icon: 'door',
    group: 'core',
    minPoints: 0,
    rule: { type: 'profile_complete' },
  },
  {
    key: 'rooted',
    labelKey: 'badge.rooted',
    name: 'Rooted',
    descriptionPlain: 'Planted, not passing through.',
    icon: 'seedling',
    group: 'core',
    minPoints: 250,
    rule: { type: 'all', of: [{ enrollments: 1 }, { attended_appointments: 1 }] },
  },
  {
    key: 'builder',
    labelKey: 'badge.builder',
    name: 'Builder',
    descriptionPlain: 'Hands on the work.',
    icon: 'hammer',
    group: 'core',
    minPoints: 750,
    rule: { type: 'count', of: 'attended_appointments', atLeast: 10 },
  },
  {
    key: 'provider',
    labelKey: 'badge.provider',
    name: 'Provider',
    descriptionPlain: 'The one the household counts on.',
    icon: 'basket',
    group: 'core',
    minPoints: 1500,
    rule: { type: 'workforce_milestone', of: ['job_placement', 'certification'] },
  },
  {
    key: 'pillar',
    labelKey: 'badge.pillar',
    name: 'Pillar',
    descriptionPlain: 'Something others stand on.',
    icon: 'column',
    group: 'core',
    minPoints: 3000,
    rule: { type: 'sustained_attendance', months: 6 },
  },
  {
    key: 'elder',
    labelKey: 'badge.elder',
    name: 'Elder',
    descriptionPlain: 'Wisdom earned by walking it.',
    icon: 'staff',
    group: 'core',
    minPoints: 5000,
    rule: { type: 'is_mentor_to', atLeast: 1 },
    blockedBy: 'No buddy system yet — PAM models member/mentor and member/case manager only.',
  },
  {
    key: 'chief',
    labelKey: 'badge.chief',
    name: 'Chief',
    descriptionPlain: 'Trusted by the people and the programs alike.',
    icon: 'crown',
    group: 'core',
    minPoints: 8000,
    rule: { type: 'all', of: [{ is_mentor_to: 3 }, { referrals: 3 }] },
    blockedBy: 'No buddy system yet, and no circles.',
  },

  // Category — two per fixed track: one for starting, one for depth.
  {
    key: 'scholar',
    labelKey: 'badge.scholar',
    name: 'Scholar',
    descriptionPlain: 'You started learning something new.',
    icon: 'book',
    group: 'category',
    category: 'education',
    rule: { type: 'completed_enrollment', category: 'education', atLeast: 1 },
  },
  {
    key: 'griot',
    labelKey: 'badge.griot',
    name: 'Griot',
    descriptionPlain: 'The keeper and teller of knowledge.',
    icon: 'scroll',
    group: 'category',
    category: 'education',
    rule: { type: 'completed_enrollment', category: 'education', atLeast: 5 },
  },
  {
    key: 'craftsman',
    labelKey: 'badge.craftsman',
    name: 'Craftsman',
    descriptionPlain: 'You learned a trade worth paying for.',
    icon: 'tools',
    group: 'category',
    category: 'workforce',
    rule: { type: 'completed_enrollment', category: 'workforce', atLeast: 1 },
  },
  {
    key: 'cornerstone',
    labelKey: 'badge.cornerstone',
    name: 'Cornerstone',
    descriptionPlain: 'The work rests on you now.',
    icon: 'brick',
    group: 'category',
    category: 'workforce',
    rule: { type: 'completed_enrollment', category: 'workforce', atLeast: 5 },
  },
  {
    key: 'anchor',
    labelKey: 'badge.anchor',
    name: 'Anchor',
    descriptionPlain: 'You showed up for your family.',
    icon: 'anchor',
    group: 'category',
    category: 'family_services',
    rule: { type: 'completed_enrollment', category: 'family_services', atLeast: 1 },
  },
  {
    key: 'steward',
    labelKey: 'badge.steward',
    name: 'Steward',
    descriptionPlain: 'You hold the household together.',
    icon: 'hearth',
    group: 'category',
    category: 'family_services',
    rule: { type: 'completed_enrollment', category: 'family_services', atLeast: 5 },
  },

  // Milestones — one-offs, and the only place a lapse is named kindly.
  {
    key: 'firstborn',
    labelKey: 'badge.firstborn',
    name: 'Firstborn',
    descriptionPlain: 'First from your program or your city to join PAM.',
    icon: 'sunrise',
    group: 'milestone',
    rule: { type: 'first_member_of', scope: ['org', 'region'] },
  },
  {
    key: 'torchbearer',
    labelKey: 'badge.torchbearer',
    name: 'Torchbearer',
    descriptionPlain: 'You brought somebody else in.',
    icon: 'torch',
    group: 'milestone',
    rule: { type: 'count', of: 'referrals', atLeast: 1 },
  },
  {
    key: 'drum',
    labelKey: 'badge.drum',
    name: 'Drum',
    descriptionPlain: 'The village hears you are still moving.',
    icon: 'drum',
    group: 'milestone',
    rule: { type: 'buddy_posts_streak', weeks: 4 },
    blockedBy: 'No buddy system yet — nothing to post to.',
  },
  {
    key: 'rainmaker',
    labelKey: 'badge.rainmaker',
    name: 'Rainmaker',
    descriptionPlain: 'Work that changed what you bring home.',
    icon: 'rain',
    group: 'milestone',
    rule: { type: 'workforce_milestone', of: ['income_increase'] },
  },
  {
    key: 'homecoming',
    labelKey: 'badge.homecoming',
    name: 'Homecoming',
    descriptionPlain: 'One year with PAM.',
    icon: 'home',
    group: 'milestone',
    rule: { type: 'account_age', months: 12 },
  },
  {
    key: 'sankofa',
    labelKey: 'badge.sankofa',
    name: 'Sankofa',
    descriptionPlain: 'You came back. That counts.',
    icon: 'sankofa',
    group: 'milestone',
    rule: { type: 'returned_after_gap', days: 30 },
  },
  {
    key: 'kinkeeper',
    labelKey: 'badge.kinkeeper',
    name: 'Kinkeeper',
    descriptionPlain: 'Steps taken for the people who are yours.',
    icon: 'family',
    group: 'milestone',
    rule: { type: 'completed_goal', track: 'family_services' },
  },
];

/** The ladder, in order. What the points screen walks. */
export const CORE_BADGES: readonly BadgeDefinition[] = BADGES.filter(
  (badge) => badge.group === 'core',
).sort((a, b) => (a.minPoints ?? 0) - (b.minPoints ?? 0));

/** Which core badge a balance has reached, and which is next. */
export function badgeForPoints(points: number): BadgeDefinition {
  let current = CORE_BADGES[0]!;
  for (const badge of CORE_BADGES) {
    if (points >= (badge.minPoints ?? 0)) current = badge;
    else break;
  }
  return current;
}

export function nextBadge(points: number): BadgeDefinition | null {
  return CORE_BADGES.find((badge) => (badge.minPoints ?? 0) > points) ?? null;
}

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
