import { describe, expect, it } from 'vitest';
import en from '../src/locales/en.json' with { type: 'json' };
import es from '../src/locales/es.json' with { type: 'json' };
import {
  LEGAL_DOCUMENTS,
  PRIVACY,
  PRIVACY_VISIBILITY_SECTION,
  legalKeys,
} from '../src/legal.js';
import { TRANSPARENCY_SCREEN } from '../src/transparency.js';
import { fleschKincaidGrade, findDignityViolations } from '../src/language.js';

const bundles = { en, es } as Record<string, Record<string, string>>;

describe('the privacy notice and the terms', () => {
  it.each(LEGAL_DOCUMENTS.map((d) => [d.id, d] as const))(
    '%s has every string in both languages',
    (_id, doc) => {
      for (const key of legalKeys(doc)) {
        for (const [locale, bundle] of Object.entries(bundles)) {
          expect(bundle[key], `${key} missing in ${locale}`).toBeTruthy();
        }
      }
    },
  );

  it.each(LEGAL_DOCUMENTS.map((d) => [d.id, d] as const))(
    '%s has unique section anchors, so a link goes one place',
    (_id, doc) => {
      const ids = doc.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    },
  );

  it('never uses a word that reduces somebody to their record', () => {
    const legal = Object.fromEntries(
      LEGAL_DOCUMENTS.flatMap((doc) =>
        legalKeys(doc).flatMap((k) => [
          [`en.${k}`, en[k as keyof typeof en]],
          [`es.${k}`, es[k as keyof typeof es]],
        ]),
      ),
    ) as Record<string, string>;
    expect(findDignityViolations(legal)).toEqual([]);
  });

  it('reads at roughly the level the rest of PAM does', () => {
    // Legal pages are where plain language usually goes to die. The rule here is
    // the same one the product is held to: if the median paragraph is harder
    // than the app, the page is not doing its job.
    const grades = LEGAL_DOCUMENTS.flatMap((doc) =>
      legalKeys(doc)
        .map((k) => en[k as keyof typeof en] as string)
        .filter((v) => v.split(/\s+/).length >= 6)
        .map((v) => fleschKincaidGrade(v)),
    ).sort((a, b) => a - b);

    const median = grades[Math.floor(grades.length / 2)]!;
    expect(median, `median grade ${median.toFixed(1)}`).toBeLessThanOrEqual(7);
  });
});

describe('the privacy page and the transparency screen agree', () => {
  /**
   * The transparency screen is shown after somebody joins. The privacy page is
   * what they can read before. If the page promised more than the screen — or
   * less — the quieter one would be the real contract, and nobody reads the
   * quieter one.
   */
  const visibility = PRIVACY.sections.find((s) => s.id === PRIVACY_VISIBILITY_SECTION);

  it('the privacy page carries a section about who can see what', () => {
    expect(visibility).toBeDefined();
  });

  it('it repeats the same limits the screen states', () => {
    const text = visibility!.bodyKeys
      .map((k) => (en[k as keyof typeof en] as string).toLowerCase())
      .join(' ');

    // Each promise the screen makes about what an admin CANNOT see has to be
    // restated here. These are the three that matter most to somebody deciding
    // whether to type their number in.
    expect(text).toMatch(/cannot read your messages/);
    expect(text).toMatch(/buddies/);
    expect(text).toMatch(/not on their list/);

    // And the one exception, stated as an exception rather than buried.
    expect(text).toMatch(/reports it as not safe/);
  });

  it('promises to tell members before the list changes, exactly as the screen does', () => {
    const page = visibility!.bodyKeys.map((k) => en[k as keyof typeof en] as string).join(' ');
    expect(page).toMatch(/we will tell you first/i);
    expect(TRANSPARENCY_SCREEN.footer).toMatch(/we will tell you first/i);
  });
});
