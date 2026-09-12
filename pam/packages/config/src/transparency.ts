/**
 * The transparency contract — SOP §4.1 "Admin ≠ surveillance".
 *
 * Onboarding step 9 shows this list to every member and cannot be skipped.
 * SOP: "That screen is a required step and must match this section word for
 * word in packages/config/transparency.ts. Anything not listed there is not
 * visible to admins."
 *
 * So this file is not UI copy that happens to describe the rules — it IS the
 * rule. Two things follow, and both are load-bearing:
 *
 *  1. RLS policies in packages/db are written to match ADMIN_CAN_SEE exactly.
 *     `admin_visibility.test.ts` asserts the policy set and this list agree.
 *  2. Adding a field to an admin screen without adding it here is a bug, and
 *     the test will fail. Widen this list only with Will's sign-off, and tell
 *     members before it takes effect — a transparency screen that quietly
 *     grows is worse than none.
 */

/** Canonical, machine-checkable statement of §4.1 caseload visibility. */
export const ADMIN_CAN_SEE = [
  'goals',
  'enrollments_and_statuses',
  'appointments_and_attendance',
  'points_and_level',
  'last_active_date',
  'active_connections_names_and_kind',
  'conversation_metadata_exists_and_last_activity',
  'flagged_messages_routed_through_reports',
] as const;

export type AdminVisibleField = (typeof ADMIN_CAN_SEE)[number];

/** Explicitly NOT visible. Kept as data so tests can assert the negative. */
export const ADMIN_CANNOT_SEE = [
  'message_bodies',
  'buddy_feed_posts',
  'members_outside_caseload_or_region',
  'other_regions',
] as const;

export type AdminHiddenField = (typeof ADMIN_CANNOT_SEE)[number];

export function isAdminVisible(field: string): field is AdminVisibleField {
  return (ADMIN_CAN_SEE as readonly string[]).includes(field);
}

/**
 * Member-facing copy for onboarding step 9.
 *
 * Plain language, 5th-grade level, one line per item, in the same order and
 * with the same content as ADMIN_CAN_SEE / ADMIN_CANNOT_SEE above. The person
 * in §4.1 is "the admin"; to a member they are the person who invited them, so
 * the copy says "the person who invited you" — §9 forbids naming the role.
 *
 * These are i18n keys AND their English source, kept together so a reviewer can
 * read the screen without opening the locale file. The Spanish lives in
 * locales/es.json under the same keys.
 */
export interface TransparencyLine {
  readonly key: string;
  readonly en: string;
}

export const TRANSPARENCY_SCREEN: {
  readonly titleKey: string;
  readonly title: string;
  readonly canSeeHeadingKey: string;
  readonly canSeeHeading: string;
  readonly canSee: readonly TransparencyLine[];
  readonly cannotSeeHeadingKey: string;
  readonly cannotSeeHeading: string;
  readonly cannotSee: readonly TransparencyLine[];
  readonly footerKey: string;
  readonly footer: string;
  readonly confirmKey: string;
  readonly confirm: string;
} = {
  titleKey: 'transparency.title',
  title: 'What the person who invited you can see',

  canSeeHeadingKey: 'transparency.canSee.heading',
  canSeeHeading: 'They can see:',
  canSee: [
    { key: 'transparency.canSee.goals', en: 'What you said you want to work on' },
    {
      key: 'transparency.canSee.enrollments',
      en: 'The programs you signed up for, and how they are going',
    },
    {
      key: 'transparency.canSee.appointments',
      en: 'Your visits, and if you went or missed one',
    },
    { key: 'transparency.canSee.points', en: 'Your points and your level' },
    { key: 'transparency.canSee.lastActive', en: 'The last day you used PAM' },
    {
      key: 'transparency.canSee.connections',
      en: 'The names of people you connect with, and if they are a mentor or buddy',
    },
    {
      key: 'transparency.canSee.chatMetadata',
      en: 'That a chat exists, and the last day you used it',
    },
    {
      key: 'transparency.canSee.flagged',
      en: 'A message only if someone says it is not safe',
    },
  ],

  cannotSeeHeadingKey: 'transparency.cannotSee.heading',
  cannotSeeHeading: 'They cannot see:',
  cannotSee: [
    { key: 'transparency.cannotSee.messages', en: 'What you write in your chats' },
    { key: 'transparency.cannotSee.buddyFeed', en: 'What you share with your buddies' },
    { key: 'transparency.cannotSee.otherPeople', en: 'Anyone who is not on their list' },
  ],

  footerKey: 'transparency.footer',
  footer: 'Nothing else is shared. If this changes, we will tell you first.',

  confirmKey: 'transparency.confirm',
  confirm: 'I understand',
};

/**
 * Every i18n key this screen needs. The locale completeness test walks this so
 * a missing Spanish string fails CI rather than showing English to a Spanish
 * speaker mid-onboarding.
 */
export const TRANSPARENCY_I18N_KEYS: readonly string[] = [
  TRANSPARENCY_SCREEN.titleKey,
  TRANSPARENCY_SCREEN.canSeeHeadingKey,
  ...TRANSPARENCY_SCREEN.canSee.map((l) => l.key),
  TRANSPARENCY_SCREEN.cannotSeeHeadingKey,
  ...TRANSPARENCY_SCREEN.cannotSee.map((l) => l.key),
  TRANSPARENCY_SCREEN.footerKey,
  TRANSPARENCY_SCREEN.confirmKey,
];
