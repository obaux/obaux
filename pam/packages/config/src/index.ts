/**
 * @pam/config — the rules of the product, as code.
 *
 * Anything in here is a decision from the SOP that more than one package needs
 * to agree on: the taxonomy, the safety gates on outbound text, what an admin
 * can see, and how points work. Screens import from here; nothing here imports
 * from a screen.
 */

export * from './categories.js';
export * from './sms-templates.js';
export * from './transparency.js';
export * from './points.js';
export * from './language.js';
export * from './notices.js';
export * from './distance.js';

/** Languages at launch (§2.3). [ASK WILL] on any additional language. */
export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Roles (§3). Role is set by invite type and never self-selected (§10 step 6). */
export const ROLES = ['member', 'provider', 'admin'] as const;
export type Role = (typeof ROLES)[number];

/** §4.1 access control. */
export const ACCESS_STATUSES = ['active', 'limited', 'suspended'] as const;
export type AccessStatus = (typeof ACCESS_STATUSES)[number];

export const CONTROLLABLE_FEATURES = [
  'chat',
  'mentor_discovery',
  'buddies',
  'map',
  'points',
  'provider_listing',
] as const;
export type ControllableFeature = (typeof CONTROLLABLE_FEATURES)[number];

/**
 * Accessibility and low-tech budgets — §12. These are build-blocking, so they
 * live as numbers the tests and the bundle analyzer can read.
 */
export const A11Y = {
  /** §0 / §2.5 — minimum tap target in px. */
  minTouchTargetPx: 48,
  /** §2.4 — the primary CTA everywhere. */
  primaryButtonHeightPx: 64,
  bodyTextMobilePx: 18,
  bodyTextDesktopPx: 16,
  /** §2.5 — AAA for body text. */
  bodyContrastRatio: 7,
  largeTextContrastRatio: 4.5,
  /** §12 — text must scale this far without breaking layout. */
  textScaleMaxPercent: 200,
} as const;

export const PERFORMANCE_BUDGET = {
  /** §0 — web app loads on 3G in under this many ms. */
  firstLoadMs: 5000,
  /** §12 — web first load JS. */
  firstLoadJsKb: 500,
  /** §12 — app size on stores. */
  appSizeMb: 30,
} as const;

/** §7.2 — reminder offsets before an appointment, in minutes. */
export const REMINDER_OFFSETS_MINUTES = {
  dayBefore: 24 * 60,
  hoursBefore: 2 * 60,
} as const;

/** §7.2 — morning-of reminder fires at this hour, only if the visit is after 10am. */
export const MORNING_OF_REMINDER_HOUR = 8;
export const MORNING_OF_REMINDER_THRESHOLD_HOUR = 10;

/** §7.2 — default quiet hours. Members can change these. */
export const DEFAULT_QUIET_HOURS = { startHour: 21, endHour: 7 } as const;

/** §6.4 — new-account rate limit on connection requests. */
export const CONNECTION_RATE_LIMIT = {
  maxRequestsPerDay: 5,
  forFirstDays: 14,
} as const;

/** §6.2 — how long a pending mentor request shows "No answer yet". */
export const MENTOR_REQUEST_STALE_DAYS = 7;

/** §12 — sessions persist this long. No input timeouts anywhere. */
export const SESSION_PERSIST_DAYS = 90;

/**
 * §4.1 — invite codes. Ambiguous characters are removed so a code can be read
 * aloud over the phone or copied off a scrap of paper without error:
 * no 0/O, 1/I/L, 2/Z, 5/S, 8/B.
 */
export const INVITE_CODE_ALPHABET = '34679ACDEFGHJKMNPQRTUVWXY';
export const INVITE_CODE_LENGTH = 8;
export const INVITE_CODE_PREFIX = 'PAM-';
export const INVITE_EXPIRY_DAYS = 30;

/** §11 — self-harm flag surfaces this line in-app to the sender. */
export const CRISIS_LINE = '988';
