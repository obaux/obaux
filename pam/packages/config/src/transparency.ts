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
 *  2. Adding a field to an admin screen without adding it here is a bug.
 *     Widen this list only with Will's sign-off, and tell members before it
 *     takes effect — a transparency screen that quietly grows is worse than
 *     none.
 *
 * **`admin_visibility.test.ts`, referenced by an earlier version of this
 * comment as the thing enforcing point 1, does not exist anywhere in this
 * repository** — checked directly (D-153). Point 1 is upheld today by
 * whoever edits `packages/db` reading this file first, the way `CLAUDE.md`
 * already asks, not by an automated diff between this list and the live
 * policy set. Building that test is real, worthwhile follow-up work; this
 * file does not currently do what it used to claim it does.
 */

/**
 * Canonical, machine-checkable statement of §4.1 caseload visibility.
 *
 * `conversation_metadata_exists_and_last_activity` was removed in this same
 * pass (D-155), found while re-checking every line against the live code as
 * asked, not something today's messaging work broke: no policy anywhere in
 * `packages/db` — before or after any of today's migrations — has ever let a
 * case manager see that a conversation exists without being a member of it.
 * There is no "metadata only" visibility mode; a case manager either
 * participates (`messages_in_conversations_they_started_with_you`, below)
 * or sees nothing about a conversation except a reported excerpt
 * (`flagged_messages_routed_through_reports`). The old line described a
 * capability the schema never granted.
 */
export const ADMIN_CAN_SEE = [
  'goals',
  'enrollments_and_statuses',
  'appointments_and_attendance',
  'points_and_level',
  'last_active_date',
  'active_connections_names_and_kind',
  'flagged_messages_routed_through_reports',
  /**
   * Added when messaging shipped as staff-to-member rather than
   * member-to-member (D-152, correcting D-148/149/150). If the person who
   * invited you messages you directly, they are a participant in that
   * conversation, not a third party reading over your shoulder — they read
   * what you both wrote in it the ordinary way any conversation member does.
   * This does NOT widen what they see of a conversation they are not in;
   * `flagged_messages_routed_through_reports` above is still the only route
   * into that.
   */
  'messages_in_conversations_they_started_with_you',
  /**
   * Added for the Home people strip (D-199, 21 September). Will allowed
   * programs exactly one fact about a member's activity: that they saved a
   * new place, and when — never which place. `people_activity()` (0067)
   * returns `(profile_id, last_saved_at)` and nothing else, for the same
   * people `messageable_people()` lists, so a case manager and a program
   * admin both get this line. It is the single narrowing of D-166's "never
   * any activity, anywhere" for a program, and it is stated on the screen
   * rather than left to be inferred from a lit ring.
   */
  'new_save_without_the_place',
] as const;

export type AdminVisibleField = (typeof ADMIN_CAN_SEE)[number];

/** Explicitly NOT visible. Kept as data so tests can assert the negative. */
export const ADMIN_CANNOT_SEE = [
  'message_bodies',
  'buddy_feed_posts',
  'members_outside_caseload_or_region',
  'other_regions',
  /**
   * Will, confirming and widening D-154's messaging-only finding: "program
   * admins don't see activity, across entire app" (D-155). Everywhere else
   * on this list, "the admin" means whoever §4.1 is actually about — mostly
   * the case manager who invited a member. This one entry is the single
   * place the two roles genuinely differ: `last_active_date` above is still
   * true of a case manager, and false of a program admin, in every path
   * that reaches a member's profile — `admin_covers()` for a case manager,
   * `provider_linked_to()` for a program admin, now through
   * `provider_linked_members()` (0056) rather than a raw table read that
   * could not draw this distinction at all.
   *
   * Narrowed by exactly one fact on 21 September (D-199): a program now
   * learns *that* a member saved a new place, and when — see
   * `new_save_without_the_place` above. Everything else this entry covers
   * (the last day used, and the place itself) is still never shown.
   */
  'member_activity_for_a_program',
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
      key: 'transparency.canSee.flagged',
      en: 'A message only if someone says it is not safe',
    },
    {
      key: 'transparency.canSee.directMessages',
      en: 'Everything you say to them, if they message you directly',
    },
    /**
     * D-199 — the one activity fact a program is also allowed. "A program"
     * is the same ordinary member-facing word `cannotSee.programActivity`
     * below already uses, and the two lines are meant to be read together:
     * a program sees this, and never the last day you used PAM.
     */
    {
      key: 'transparency.canSee.saves',
      en: 'When you save a new place — not which one. A program you joined sees this too.',
    },
  ],

  cannotSeeHeadingKey: 'transparency.cannotSee.heading',
  cannotSeeHeading: 'They cannot see:',
  cannotSee: [
    { key: 'transparency.cannotSee.messages', en: 'What you say to someone else' },
    { key: 'transparency.cannotSee.buddyFeed', en: 'What you share with your buddies' },
    { key: 'transparency.cannotSee.otherPeople', en: 'Anyone who is not on their list' },
    /**
     * D-155 — stated plainly and positively, not left as a silent absence
     * from `canSee` above. "A program" is ordinary member-facing wording
     * already used elsewhere on this same screen and on Home (`role.provider`
     * reads "Program"), not a staff title §9 would forbid naming.
     */
    {
      key: 'transparency.cannotSee.programActivity',
      en: 'A program never sees the last day you used PAM',
    },
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
