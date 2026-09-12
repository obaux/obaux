/**
 * Dignity and plain-language rules — SOP §0.
 *
 * "Never display 'prisoner', 'ex-offender', 'inmate', or conviction details
 *  anywhere in UI, notifications, or data exports. Use 'member' and
 *  'returning citizen' only in internal docs."
 *
 * A person reading PAM over a member's shoulder — a landlord, an employer, a
 * child — must not learn anything about where they have been. That is why this
 * is a test that fails the build and not a style note.
 *
 * `assertCopyIsDignified` runs over every locale string in CI. It also runs over
 * CSV exports before they are written (§13 Phase 5).
 */

/**
 * Forbidden in anything a member or provider can see: UI strings, notification
 * bodies, CSV exports, AI output.
 */
export const FORBIDDEN_UI_TERMS: readonly string[] = [
  'prisoner',
  'inmate',
  'offender',
  'ex-offender',
  'ex offender',
  'convict',
  'conviction',
  'felon',
  'felony',
  'incarcerated',
  'incarceration',
  'parolee',
  'probationer',
  'criminal record',
  'rap sheet',
  'justice-involved',
  'justice involved',
  'formerly incarcerated',
];

/**
 * Jargon §0 bans by name, mapped to what to say instead. Not build-blocking —
 * a word like "plan" is fine in some sentences — but `findJargon` surfaces it
 * in review so copy drifts toward plain language rather than away from it.
 */
export const JARGON_REPLACEMENTS: Readonly<Record<string, string>> = {
  onboarding: 'setting up',
  dashboard: 'home',
  sync: 'save',
  syncing: 'saving',
  authenticate: 'sign in',
  authentication: 'signing in',
  credentials: 'your phone number',
  submit: 'send',
  enroll: 'sign up',
  eligibility: 'who can join',
  utilize: 'use',
  navigate: 'go',
  resource: 'place',
  provider: 'program',
};

export class DignityViolationError extends Error {
  constructor(
    readonly term: string,
    readonly where: string,
  ) {
    super(
      `Copy at "${where}" contains the forbidden term "${term}". ` +
        'PAM never shows justice involvement to a user (SOP §0).',
    );
    this.name = 'DignityViolationError';
  }
}

/**
 * Throws on the first forbidden term. `where` is a locale key or export column
 * so the failure names the exact string to fix.
 */
export function assertCopyIsDignified(text: string, where: string): void {
  const lowered = text.toLowerCase();
  for (const term of FORBIDDEN_UI_TERMS) {
    if (lowered.includes(term)) {
      throw new DignityViolationError(term, where);
    }
  }
}

export interface CopyIssue {
  readonly where: string;
  readonly term: string;
  readonly suggestion?: string;
}

/** Non-throwing sweep over a whole locale bundle. Used by the CI reporter. */
export function findDignityViolations(
  strings: Readonly<Record<string, string>>,
): readonly CopyIssue[] {
  const issues: CopyIssue[] = [];
  for (const [key, value] of Object.entries(strings)) {
    const lowered = value.toLowerCase();
    for (const term of FORBIDDEN_UI_TERMS) {
      if (lowered.includes(term)) issues.push({ where: key, term });
    }
  }
  return issues;
}

export function findJargon(
  strings: Readonly<Record<string, string>>,
): readonly CopyIssue[] {
  const issues: CopyIssue[] = [];
  for (const [key, value] of Object.entries(strings)) {
    const lowered = value.toLowerCase();
    for (const [term, suggestion] of Object.entries(JARGON_REPLACEMENTS)) {
      if (new RegExp(`\\b${term}\\b`).test(lowered)) {
        issues.push({ where: key, term, suggestion });
      }
    }
  }
  return issues;
}

/**
 * Flesch-Kincaid grade level. §14 sets the target at <= 5.
 *
 * This is a heuristic — it counts vowel groups as syllables, so it is rough on
 * names and abbreviations. Treat a score over target as "a human should read
 * this", not as a hard gate; §14 asks for a readability check, not a blocker.
 */
export function fleschKincaidGrade(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
  if (words.length === 0) return 0;
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length === 0) return 0;
  if (w.length <= 3) return 1;
  const groups = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
}

export const READABILITY_TARGET_GRADE = 5;
