import { describe, expect, it } from 'vitest';
import { BUNDLES } from './_bundles.js';
import { SUPPORTED_LOCALES } from '../src/i18n.js';

/**
 * Legal › Data sources (D-540): the credit that the neighborhood list's licence, CC BY 4.0, asks for.
 * The licence wants the creator named, the licence named and linked, a link to the source, and a note that it was changed. In every
 * language the creator's name, the data set's title and the licence's name stay as they are (they are names, not words), and the
 * sentence still says Pam changed the data: one point for each neighborhood, not the boundaries.
 */
describe('Data sources credit, in every language (D-540)', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const bundle = BUNDLES[locale];
    it(`${locale} keeps the creator, the data set and the licence by name`, () => {
      expect(bundle['legal.sources.neighborhoods'], `${locale} names the creator`).toContain('Abaca Labs');
      expect(bundle['legal.sources.neighborhoods'], `${locale} names the data set`).toContain('Philadelphia Neighborhoods');
      expect(bundle['legal.sources.licence'], `${locale} names the licence`).toContain('CC BY 4.0');
    });
    it(`${locale} has a title and a link label of its own`, () => {
      expect(bundle['legal.sources.title']).toBeTruthy();
      expect(bundle['legal.sources.link']).toBeTruthy();
      if (locale !== 'en') {
        expect(bundle['legal.sources.title']).not.toBe(BUNDLES.en['legal.sources.title']);
        expect(bundle['legal.sources.link']).not.toBe(BUNDLES.en['legal.sources.link']);
      }
    });
  }
  it('says in English that Pam changed the data and what it kept', () => {
    expect(BUNDLES.en['legal.sources.neighborhoods']).toMatch(/Pam changed it: it keeps one point for each neighborhood, not the boundaries\./);
  });
});
