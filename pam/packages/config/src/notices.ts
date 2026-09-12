/**
 * What PAM says when something has gone wrong, or when there is nothing to show.
 *
 * The default behaviour of a database that refuses a read is silence: an empty
 * list, a null, a screen that looks broken. For this product silence is the
 * worst answer available. §0: "Never dead-end. Every screen has a visible way
 * back and a visible 'Get help'."
 *
 * So every condition PAM can land in has an entry here, and every entry says
 * three things:
 *
 *   1. what happened, in plain words
 *   2. why, when the reason is knowable and safe to give
 *   3. what to do next, which is usually a phone number
 *
 * Three rules shape the copy, and the tests enforce them:
 *
 *   - **Never blame the person reading it.** "You do not have permission" tells
 *     someone they did something wrong. "This person is not on your list" tells
 *     them what is true.
 *   - **Never leak a reason the reader is not entitled to.** An admin looking at
 *     someone outside their region is told the person is outside their region —
 *     not whether that person exists, which would make this screen a way to
 *     probe the whole system.
 *   - **Never say why in words that disclose.** §0 and §9 apply here exactly as
 *     they do to SMS.
 */

/** Conditions that can put a person in front of a message instead of content. */
export type NoticeKey =
  // Access and permission
  | 'admin_out_of_region'
  | 'account_suspended'
  | 'account_limited'
  | 'feature_turned_off'
  // Getting in
  | 'invite_not_found'
  | 'invite_already_used'
  | 'invite_expired'
  | 'invite_phone_mismatch'
  // Nothing to show
  | 'no_caseload_members'
  | 'no_places_found'
  | 'no_mentors_found'
  | 'service_not_available'
  // Something broke
  | 'offline'
  | 'something_went_wrong';

/**
 * How the message is presented.
 *
 * `banner` — something is wrong and the person has to act. Astryx renders
 *   error and warning banners as `role="alert"`.
 * `empty` — nothing is here, and the screen explains why rather than showing a
 *   blank list.
 */
export type NoticeKind = 'banner' | 'empty';

export type NoticeStatus = 'info' | 'warning' | 'error';

export interface NoticeDefinition {
  readonly key: NoticeKey;
  readonly kind: NoticeKind;
  readonly status: NoticeStatus;
  readonly titleKey: string;
  readonly bodyKey: string;
  /** English source, kept here so a reviewer reads the copy with the rule. */
  readonly title: string;
  readonly body: string;
  /**
   * Whether to offer the tap-to-call support line. False only where calling
   * cannot help — an empty search, say, where the next step is to search again.
   */
  readonly offersSupport: boolean;
  /** Who reads this. Affects tone review, not behaviour. */
  readonly audience: 'member' | 'provider' | 'admin';
}

const define = (d: Omit<NoticeDefinition, 'titleKey' | 'bodyKey'>): NoticeDefinition => ({
  ...d,
  titleKey: `notice.${d.key}.title`,
  bodyKey: `notice.${d.key}.body`,
});

export const NOTICES: Readonly<Record<NoticeKey, NoticeDefinition>> = {
  /**
   * The case Will raised. `admin_covers()` returns false and every query comes
   * back empty or null, which on screen is indistinguishable from a bug.
   *
   * It says the person is outside the region — which the admin already knows is
   * possible and can act on — and deliberately does NOT say whether anyone by
   * that name exists. Confirming existence would turn this screen into a way to
   * enumerate members across every region.
   */
  admin_out_of_region: define({
    key: 'admin_out_of_region',
    kind: 'empty',
    status: 'info',
    title: 'This person is in a different area',
    body:
      'You can only see people in your own area. If they should be on your list, ' +
      'call PAM support and we can move them.',
    offersSupport: true,
    audience: 'admin',
  }),

  account_suspended: define({
    key: 'account_suspended',
    kind: 'banner',
    status: 'error',
    title: 'Your account is paused',
    body:
      'You cannot sign in right now. The person who invited you can turn it back on. ' +
      'Call PAM and we will help you reach them.',
    offersSupport: true,
    audience: 'member',
  }),

  account_limited: define({
    key: 'account_limited',
    kind: 'banner',
    status: 'warning',
    title: 'Some things are turned off',
    body:
      'You can still look at places and your plan. Messages and new people are off ' +
      'for now. Call PAM if you have questions.',
    offersSupport: true,
    audience: 'member',
  }),

  /**
   * A named feature was turned off for this person. The database also holds the
   * admin's internal `reason`, which is NEVER shown (§4.1) — only the
   * `user_facing_note`, if one was written, and this message if not.
   */
  feature_turned_off: define({
    key: 'feature_turned_off',
    kind: 'banner',
    status: 'info',
    title: 'This part is turned off for now',
    body: 'The person who invited you turned this off. Call PAM if you have questions.',
    offersSupport: true,
    audience: 'member',
  }),

  /**
   * §10 step 3 shows the same sentence for a wrong, used or expired code. The
   * separate keys below exist so the four cases can be told apart in logs and
   * in an admin's view — never so a person guessing codes learns which of the
   * four they hit.
   */
  invite_not_found: define({
    key: 'invite_not_found',
    kind: 'banner',
    status: 'error',
    title: 'That code did not work',
    body: 'Check the code and try again. If it still does not work, ask the person who invited you for a new one.',
    offersSupport: true,
    audience: 'member',
  }),

  invite_already_used: define({
    key: 'invite_already_used',
    kind: 'banner',
    status: 'error',
    title: 'That code was already used',
    body: 'Ask the person who invited you for a new code.',
    offersSupport: true,
    audience: 'member',
  }),

  invite_expired: define({
    key: 'invite_expired',
    kind: 'banner',
    status: 'error',
    title: 'That code is too old',
    body: 'Ask the person who invited you for a new code.',
    offersSupport: true,
    audience: 'member',
  }),

  invite_phone_mismatch: define({
    key: 'invite_phone_mismatch',
    kind: 'banner',
    status: 'error',
    title: 'That code is for a different phone',
    body: 'Use the phone number the code was sent to, or ask for a new code.',
    offersSupport: true,
    audience: 'member',
  }),

  no_caseload_members: define({
    key: 'no_caseload_members',
    kind: 'empty',
    status: 'info',
    title: 'No one on your list yet',
    body: 'When someone uses your invite code, they will show up here.',
    offersSupport: false,
    audience: 'admin',
  }),

  no_places_found: define({
    key: 'no_places_found',
    kind: 'empty',
    status: 'info',
    title: 'No places found here',
    body: 'Try a bigger distance, or pick a different kind of help. You can also call PAM and we will look for you.',
    offersSupport: true,
    audience: 'member',
  }),

  no_mentors_found: define({
    key: 'no_mentors_found',
    kind: 'empty',
    status: 'info',
    title: 'No people to show yet',
    body: 'Check back soon. You can also call PAM and we will help you find someone.',
    offersSupport: true,
    audience: 'member',
  }),

  /**
   * An imported place that has not passed the plain-language review (§5.2), or
   * one a provider has taken down. A member who followed an old link needs to
   * know it is gone, not see a blank screen.
   */
  service_not_available: define({
    key: 'service_not_available',
    kind: 'empty',
    status: 'info',
    title: 'This place is not on PAM right now',
    body: 'It may come back. Call PAM and we can help you find another place.',
    offersSupport: true,
    audience: 'member',
  }),

  offline: define({
    key: 'offline',
    kind: 'banner',
    status: 'warning',
    title: "You're offline",
    body: "We'll save your changes. Your saved places and your plan still work.",
    offersSupport: false,
    audience: 'member',
  }),

  /**
   * The fallback. Everything unhandled lands here, so it must never be the
   * dead end — it always offers the phone.
   */
  something_went_wrong: define({
    key: 'something_went_wrong',
    kind: 'banner',
    status: 'error',
    title: 'Something went wrong',
    body: 'This is not your fault. Try again, or call PAM and we will help.',
    offersSupport: true,
    audience: 'member',
  }),
};

export const NOTICE_LIST: readonly NoticeDefinition[] = Object.values(NOTICES);

/** Every i18n key the notices need. The locale test walks this. */
export const NOTICE_I18N_KEYS: readonly string[] = NOTICE_LIST.flatMap((n) => [
  n.titleKey,
  n.bodyKey,
]);

/**
 * Maps a `redeem_invite` error to the notice for it.
 *
 * The RPC raises distinct codes so the four cases are distinguishable in logs;
 * §10 step 3 still shows the member one plain sentence per case. Anything
 * unrecognised falls through to the generic notice rather than surfacing a
 * database error to someone entering a code.
 */
export function noticeForInviteError(code: string): NoticeKey {
  switch (code) {
    case 'INVITE_NOT_FOUND':
      return 'invite_not_found';
    case 'INVITE_ALREADY_USED':
      return 'invite_already_used';
    case 'INVITE_EXPIRED':
      return 'invite_expired';
    case 'INVITE_PHONE_MISMATCH':
      return 'invite_phone_mismatch';
    default:
      return 'something_went_wrong';
  }
}
