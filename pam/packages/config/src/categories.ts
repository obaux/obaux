/**
 * Service taxonomy — SOP §2.5.
 *
 * There are exactly THREE top-level categories. This is fixed product surface:
 * three map pin colors, three filter chips, three onboarding goal groups.
 * Subcategories are chips *under* a chosen category — never top-level nav.
 *
 * Admins can edit the subcategory list from the admin panel. That edit writes a
 * migration entry against `service_subcategories`, it does not change this file.
 * The values here are the seed set and the compile-time union used by importers.
 */

export const CATEGORIES = ['education', 'workforce', 'family_services'] as const;

export type Category = (typeof CATEGORIES)[number];

export interface CategoryDefinition {
  readonly key: Category;
  /** i18n key. Never hard-code the English string into a screen. */
  readonly labelKey: string;
  /**
   * Map pin + chip color, as an Astryx palette token name.
   * [ASK WILL] final brand hex values. Until then these are Astryx palette
   * defaults chosen for hue separation at 7:1 contrast on the muted map style.
   */
  readonly colorToken: string;
  readonly subcategories: readonly Subcategory[];
}

export interface Subcategory {
  readonly key: string;
  readonly labelKey: string;
}

const sub = (key: string): Subcategory => ({
  key,
  labelKey: `category.sub.${key}`,
});

export const CATEGORY_DEFINITIONS: Readonly<Record<Category, CategoryDefinition>> = {
  education: {
    key: 'education',
    labelKey: 'category.education',
    colorToken: 'blue',
    subcategories: [
      sub('ged_high_school'),
      sub('college'),
      sub('trade_certification'),
      sub('literacy_esl'),
      sub('computer_skills'),
    ],
  },
  workforce: {
    key: 'workforce',
    labelKey: 'category.workforce',
    colorToken: 'green',
    subcategories: [
      sub('job_openings'),
      sub('job_training'),
      sub('resume_interview_help'),
      sub('apprenticeships'),
      sub('start_a_business'),
      sub('benefits_income'),
    ],
  },
  family_services: {
    key: 'family_services',
    labelKey: 'category.family_services',
    colorToken: 'purple',
    subcategories: [
      sub('housing'),
      sub('food'),
      sub('health_counseling'),
      sub('kids_parenting'),
      sub('id_documents'),
      sub('legal_help'),
      sub('transportation'),
    ],
  },
};

/** Ordered list for rendering the three filter chips. */
export const CATEGORY_LIST: readonly CategoryDefinition[] = CATEGORIES.map(
  (c) => CATEGORY_DEFINITIONS[c],
);

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

/**
 * Importer fallback — SOP §5.2 step 2. An unmapped source category lands in
 * family_services with no subcategory and `needs_review = true`, so it surfaces
 * in the admin import review queue rather than silently mis-filing.
 */
export const UNMAPPED_CATEGORY: Category = 'family_services';

export function subcategoriesFor(category: Category): readonly Subcategory[] {
  return CATEGORY_DEFINITIONS[category].subcategories;
}

export function isSubcategoryOf(category: Category, subcategory: string): boolean {
  return subcategoriesFor(category).some((s) => s.key === subcategory);
}

/**
 * The label key for a category, for data that may not be one.
 *
 * `CATEGORY_DEFINITIONS[key].labelKey` reads fine and throws on `undefined` —
 * and the screen that does it is the home screen, so one unexpected category in
 * the catalogue is a white page rather than one odd-looking card. The database
 * enum makes that unlikely, not impossible: an import, a migration or a fixture
 * can all produce a value the front end has never heard of, and one of them did
 * (a fixture, on a screenshot run, which is exactly the cheap way to find out).
 *
 * The fallback is the generic word for what all three categories are, because a
 * member reading "Help" learns nothing false — unlike a blank screen, which
 * teaches them the app is broken.
 */
export function categoryLabelKey(key: string): string {
  return (CATEGORY_DEFINITIONS as Record<string, CategoryDefinition | undefined>)[key]?.labelKey
    ?? 'category.unknown';
}
