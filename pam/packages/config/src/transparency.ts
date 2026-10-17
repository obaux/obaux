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
  /**
   * D-526 (attendance part A, 11 October 2026): the program a member plans a visit with sees that visit.
   * `my_program_visits()` returns, for the caller's OWN program only and for a program lead with an active
   * account, each visit that is not cancelled with the member's first name, the day and time, the service
   * they picked and whether the visit is marked as there (`checked_in_at`) — no last name, phone,
   * address or photo. Part C adds the label "missed": a visit still `scheduled` a day after it ends,
   * at a program with a lead on Pam, is marked missed overnight (`sweep_missed_visits()`), and
   * `my_program_visits()` returns that status; it pays and takes nothing, and nobody is texted.
   * The member does not have to have signed up: planning the visit is enough. Said to the
   * member on `transparency.canSee.appointments` ("A program sees the visits you plan there too.") and on
   * the Privacy page (`privacy.s.sharing.p2`); `program-visits-contract.test.ts` holds the three together.
   * It does NOT widen `member_activity_for_a_program` below: a member's trips to OTHER programs stay hidden.
   */
  'visits_planned_at_their_own_program',
  /**
   * D-595 (a94; Will, 17 October, card a94, 15:21: "signed on all"): a program can book a visit for a member who wrote to it, signed up
   * with it or planned a visit there (`book_visit_for_member`), and a case manager (the member's guide) sees, beside every such visit,
   * that a program booked it and WHICH program: "Booked by {program}" (`person.trip.bookedBy`; `BOOKED_BY_SHOWN_ON` is 'every', Will's
   * answer to the open question). It is an organisation, never a person: `appointments.booked_by_org` is read through
   * `appointments_select_admin`, and which lead did it is in `audit_log`, which only the Pam team reads. A program lead reads no
   * appointment row at all (test 65), so this fact is the guide's alone. Said to the member before it ships, in four places that
   * `program-booking-line.test.ts` holds together: the Privacy page (`privacy.s.who-can-see.p1`), the guide's list
   * (`transparency.canSee.bookedBy`), the staff's own list (`join.privacy.admin.2`) and this entry. The member sees "Booked for you" on
   * the card and can cancel the visit (`cancel_trip` cancels any of their own scheduled visits, whoever booked it).
   */
  'which_visits_a_program_booked_for_them',
  /**
   * D-541 (Will, 11 October, 20:22 and 20:24: "members must be able to message a program before booking" and
   * "communicate what programs can see, even before the person books"): a member can write to a program from its
   * page at any time, with no sign-up and no visit.
   *
   * The merge desk's rule (11 October, 20:43): messaging a program creates a CONVERSATION, not a link. A member who has
   * only written to a program is not in its `messageable_people()` (its New message list), `people_activity()`,
   * `provider_linked_members()` or `my_program_visits()`: so it learns no save times, no visits and no names list. It reads,
   * in that conversation, the member's FIRST NAME (`conversation_partners()` returns a first name, a role and a program name,
   * nothing else) and what they write, and may reply there; it reads nothing else of them: not their profile row, a last
   * name, a phone number, a saved place, a trip to another program, points or the last day they used Pam. The small card a
   * lead sees when they tap that member is the first name and the visits planned at their own program.
   *
   * Said to the member on `transparency.program.firstName` and `.messages` (the "A program can see:" card), on
   * `transparency.summary.program` and on the Privacy page (`privacy.s.sharing.p2`);
   * `program-sees-before-a-visit.test.ts` holds those together and `68_a_member_who_has_only_written_to_a_program_is_test.sql`
   * holds the database to them.
   */
  'first_name_and_words_to_a_program_they_message',
  /**
   * D-485 (Will's card a25, 10 October): a program that has a member's signature on one of its policies reads their first
   * name and the day they signed — never the picture (`program_policy_signers()`, part 3). The member does not have to
   * have signed up: signing is enough. A case manager reads none of it. (`transparency.canSee.signed` used to say this
   * under "Your guide can see"; it now stands in the "A program can see:" card as `transparency.program.signed`.)
   */
  'first_name_and_day_signed_on_a_programs_policy',
  'points_and_level',
  /**
   * Said on the screen since D-413 (Will, 9 October: "Case manager can see
   * awards, badges, and points from members"). It was always true —
   * `member_badges_select_admin` (0007) reads badges through `admin_covers()`
   * exactly as the ledger is read — and the case manager's own onboarding line
   * (`join.privacy.admin.1`) already said "badges"; only the member's line
   * lacked the word. A program reads no badges (no policy exists for one;
   * checked on the live project, 9 October).
   */
  'badges',
  /**
   * True of a case manager. D-242 (Will, 3 October) meant it to be true of a
   * program the member joined as well: a program lead seeing the last day a
   * member used Pam, on the member's page, beside their visits with that
   * program. The database does not hand it to a program yet
   * (`04_transparency_contract_test.sql` part 3 still holds; 0062 closed the
   * route), so the member-facing line (`canSee.lastActive`) says only "the
   * last day you used Pam" and makes no promise about a program (D-465). The
   * follow-up migration is still open; when it is live the second sentence
   * returns. Until then a program lead's page can show it for example people
   * only.
   */
  'last_active_date',
  'active_connections_names_and_kind',
  /**
   * A reported message reaches the people who see the report, and nothing
   * else from the chat does. Since D-394 (8 October) a message can carry a
   * photo, and a reported message's photo reaches the same people the same
   * way (0079, `can_see_message_photo`) — said on the screen ("A message or
   * photo…") rather than left to "message" meaning both. Since D-399 the
   * same for a document (0080, `can_see_message_file`): "A message, photo or
   * document…".
   */
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
  /** D-394: photos in a conversation, outside a report — no admin policy on the bucket, as on `messages`. */
  'message_photos',
  /** D-399: documents in a conversation, outside a report — the same, on `message-files` (0080). */
  'message_files',
  /**
   * D-407: a link's preview — the page's title and picture, fetched by Pam's
   * server — is read by the two people in the conversation and nobody else,
   * reported or not (0081: no admin policy on `message_link_previews` or the
   * `link-previews` bucket). A report shows the message, whose words already
   * carry the link.
   */
  'message_link_previews',
  'buddy_feed_posts',
  /**
   * Since 0082 (D-415, Will, 9 October) a case manager reaches only the people
   * assigned to them — not everyone in their city, which `admin_covers()` also
   * allowed until then. This entry used to be `members_outside_caseload_or_region`.
   * `other_regions` is kept: still true, and now implied by the line above.
   */
  'members_outside_caseload',
  'other_regions',
  /**
   * Will, confirming and widening D-154's messaging-only finding: "program
   * admins don't see activity, across entire app" (D-155). Everywhere else
   * on this list, "the admin" means whoever §4.1 is actually about — mostly
   * the case manager who invited a member. This one entry is the single
   * place the two roles genuinely differ: `last_active_date` above is still
   * true of a case manager, and false of a program admin, in every path
   * that reaches a member's profile — `admin_covers()` (the caseload) for a
   * case manager,
   * `provider_linked_to()` for a program admin, now through
   * `provider_linked_members()` (0056) rather than a raw table read that
   * could not draw this distinction at all.
   *
   * Narrowed by exactly one fact on 21 September (D-199): a program now
   * learns *that* a member saved a new place, and when — see
   * `new_save_without_the_place` above. Narrowed again on 3 October
   * (D-242): the intent was that a program sees the last day a member used
   * Pam; the database does not give it yet, so nothing member-facing says so
   * (D-465, `last_active_date` above). What this entry still covers: which places a member saved, their trips to other
   * programs, and their points — none of it shown to a program. (D-526: a program does see the visits
   * planned AT itself, `visits_planned_at_their_own_program` above; that is not a trip to another program.)
   */
  'member_activity_for_a_program',
  /**
   * D-526 / D-535 (Mira, 11 October): a program's lead sees a visit's status (booked, there, missed), never who marked it or how.
   * A member can mark their own visit ("I’m here", "I went"), so a visit may show as there without the lead having marked it; the
   * lead cannot tell the two apart (no label, no function that says; undoing a member's mark is a quiet no-op for the lead), and
   * cannot tell by position or by word. `my_program_visits()` returns the status and not the method. Only the member sees how,
   * and an admin's audit row says only that a check-in happened. (Privacy p9 says what Pam keeps; `privacy.s.sharing.p2` says
   * what a program sees; this entry is why neither says who or how.)
   */
  'who_marked_a_visit_or_how',
  /**
   * 11 October (Mira, found the same day): the note a member keeps on their own trip (`appointments.note`, up to 200
   * characters, 20261010074045) is for them. A program's lead sees a visit's four things (first name, day and time, service,
   * marked as there) through `my_program_visits()` and should never read the row itself. Live today (20261010074241 replaced
   * 0007's `appointments_provider`): select only, no write grant for a lead or a member, but the read is still of whole rows,
   * `note`, `attendance_method` and `check_in_code` included. Piper narrows that read in a new migration on
   * `claude/places-programs-im-here`, with a database test. That is a gap being closed, not a thing members are told is
   * shared: nothing member-facing says a program sees the note.
   *
   * Closed by Piper's 20261011060000 (`appointments_provider_select` is `using (false)`: a lead reads NO appointment row
   * directly, test 65); the write side is pinned by test 69 (no role but the owner writes a row, or the columns that say how a
   * visit was marked or what the member wrote). The lead's door to a member's visits is `my_program_visits()` and, for the
   * small card a lead sees when they tap a member, `program_member_card()` (20261011203852, D-542, test 66): exactly three
   * keys (`member_id`, `first_name`, `visits`), each visit only `appointment_id`, `starts_at`, `ends_at`, `status`,
   * `service_name`, `checked_in_at`. `program-sees-before-a-visit.test.ts` reads both migrations once they are on main.
   */
  'the_note_a_member_keeps_on_a_visit',
  /**
   * 11 October (Mira, found the same day): signing up is written by the provider path and the server, not by a member
   * or by a lead on their own say-so. `enrollments` was writable by both; D-541 part 1 (migration 20261011203904, batch b20,
   * test 64) locks it. A program therefore sees "that you signed up" only for a sign-up that happened.
   */
  'a_sign_up_written_by_the_member_or_a_lead_directly',
  /**
   * Where a member is. The "I'm here" check-in (D-526 part B) asks the phone for its position once, when the
   * member taps, and the server compares it with the place (within about 150 metres) in the same call: the
   * position is used for that one comparison and written nowhere. What Pam keeps is that the member was there,
   * the time and how it was marked — never the position. So there is nothing for a guide or a program to see,
   * and this entry is here so a test can say so, and so a column that did keep a position would have to change
   * the contract and the Privacy page first (`privacy.s.what-we-keep.p9`, `im-here-location.test.ts`).
   */
  'member_location',
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
 * the copy says "your guide" (D-416), defined once on the screen as "the person
 * who invited you, or a staff member responsible for guiding you" (D-415) —
 * §9 forbids naming the role.
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
  readonly programHeadingKey: string;
  readonly programHeading: string;
  readonly program: readonly TransparencyLine[];
  readonly cannotSeeHeadingKey: string;
  readonly cannotSeeHeading: string;
  readonly cannotSee: readonly TransparencyLine[];
  readonly footerKey: string;
  readonly footer: string;
  readonly confirmKey: string;
  readonly confirm: string;
} = {
  titleKey: 'transparency.title',
  title: 'What your guide can see',

  canSeeHeadingKey: 'transparency.canSee.heading',
  canSeeHeading: 'Your guide can see:',
  canSee: [
    { key: 'transparency.canSee.goals', en: 'What you said you want to work on' },
    {
      key: 'transparency.canSee.enrollments',
      en: 'The programs you signed up for, and how they are going',
    },
    {
      key: 'transparency.canSee.appointments',
      en: 'Your visits, and if you went or missed one. A program sees the visits you plan there too.',
    },
    // D-595 (a94, Will 17 October): the guide sees which of the visits a program booked. Said once here; the Privacy page says it in `who-can-see.p1`.
    { key: 'transparency.canSee.bookedBy', en: 'Which of your visits a program booked for you.' },
    // D-413 — badges named, not left to "level": a case manager already reads them.
    { key: 'transparency.canSee.points', en: 'Your points, your level and your badges' },
    // The case manager sees this. A program does NOT yet: D-242 (Will, 3 October) said it should, but the
    // database never handed it over (0062; `provider_linked_members()` returns an id and a first name), so
    // the line says only what is true. Put "A program you joined sees this too." back when that migration is
    // live and `04_transparency_contract_test.sql` part 3 says so (D-465).
    {
      key: 'transparency.canSee.lastActive',
      en: 'The last day you used Pam.',
    },
    {
      key: 'transparency.canSee.connections',
      en: 'The names of people you connect with, and if they are a mentor or buddy',
    },
    {
      key: 'transparency.canSee.flagged',
      en: 'A message, photo or document only if someone says it is not safe',
    },
    {
      key: 'transparency.canSee.directMessages',
      en: 'Everything you say or send to them, if they message you directly',
    },
    /**
     * D-199 — the one activity fact a program is also allowed. "A program"
     * is ordinary member-facing wording, as on `canSee.lastActive` above
     * (D-242): what a program you joined sees is said on the line itself.
     */
    {
      key: 'transparency.canSee.saves',
      en: 'When you save a new place — not which one. A program you joined sees this too.',
    },
  ],

  programHeadingKey: 'transparency.program.heading',
  programHeading: 'A program can see:',
  /**
   * What a PROGRAM reads of a member, in the order the member meets it (D-541). It is its own card because the list
   * above is headed "Your guide can see": a fact only a program reads (a message to it, a signature on its rules) cannot
   * stand under that heading without telling the member their guide reads it. Lines the guide also reads — visits —
   * keep their "A program … sees this too" on the guide's list above; a saved place is on both lists, because what a program reads of it
   * (when, only after a sign-up) is narrower than what the guide reads, so the card says it in its own words (P10).
   *
   * The first line is the condition for all the others: a program sees nothing of a member who has done none of the four
   * things. "Before any visit" is the first, second and third lines; the fifth is what a planned visit adds.
   */
  program: [
    {
      key: 'transparency.program.firstName',
      en: 'Your first name, once you write to it, sign its rules, sign up or plan a visit there.',
    },
    { key: 'transparency.program.messages', en: 'What you write to it, even before you plan a visit.' },
    {
      key: 'transparency.program.signed',
      en: 'The day you signed its rules. Never your signature.',
    },
    { key: 'transparency.program.signedUp', en: 'That you signed up, and how it is going.' },
    // D-199 / P10 (Iris, program lead pass, 15 October): `people_activity()` hands a program the time a member saved a place, never which
    // place, and only for a member enrolled with it (`can_message()`: not one who only wrote, signed its rules or planned a visit).
    // The guide's list above says "A program you joined sees this too"; this card now says it from the program's side.
    {
      key: 'transparency.program.saves',
      en: 'When you save a new place — not which one. Only after you sign up with it.',
    },
    {
      key: 'transparency.program.visits',
      en: 'The visits you plan there, and the ones it books for you: the day and time, the service, and whether you were marked as there.',
    },
  ],

  cannotSeeHeadingKey: 'transparency.cannotSee.heading',
  cannotSeeHeading: 'Your guide cannot see:',
  cannotSee: [
    { key: 'transparency.cannotSee.messages', en: 'What you say or send to someone else' },
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
  TRANSPARENCY_SCREEN.programHeadingKey,
  ...TRANSPARENCY_SCREEN.program.map((l) => l.key),
  TRANSPARENCY_SCREEN.cannotSeeHeadingKey,
  ...TRANSPARENCY_SCREEN.cannotSee.map((l) => l.key),
  TRANSPARENCY_SCREEN.footerKey,
  TRANSPARENCY_SCREEN.confirmKey,
  // The reading aids around the list (D-416).
  'guide.title',
  'guide.body',
  'transparency.summary.title',
  'transparency.summary.see',
  'transparency.summary.cannot',
  'transparency.summary.reported',
  'transparency.summary.program',
  ...['plans', 'progress', 'people'].map((g) => `transparency.group.${g}`),
  'copy.page',
  'copy.done',
  'copy.failed',
];

/**
 * How the "can see" list is chunked on screen (D-416): three groups of three,
 * each under a small heading, so nine lines are three short lists rather than
 * one long one. Presentation only — the words of every line are the contract's
 * and are rendered unchanged, in the contract's own order within a group. A
 * test holds that every line in `TRANSPARENCY_SCREEN.canSee` is in exactly one
 * group, so a line added to the contract cannot go missing from the screen.
 */
export const TRANSPARENCY_GROUPS: readonly {
  readonly titleKey: string;
  readonly keys: readonly string[];
}[] = [
  {
    titleKey: 'transparency.group.plans',
    keys: [
      'transparency.canSee.goals',
      'transparency.canSee.enrollments',
      'transparency.canSee.appointments',
      'transparency.canSee.bookedBy',
    ],
  },
  {
    titleKey: 'transparency.group.progress',
    keys: [
      'transparency.canSee.points',
      'transparency.canSee.lastActive',
      'transparency.canSee.saves',
    ],
  },
  {
    titleKey: 'transparency.group.people',
    keys: [
      'transparency.canSee.connections',
      'transparency.canSee.flagged',
      'transparency.canSee.directMessages',
    ],
  },
];
