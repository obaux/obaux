import * as stylex from '@stylexjs/stylex';

/**
 * Website-only type styles (D-528). Mirrors the Figma text styles
 * `Website/<Group>/<Name>` in Pam — Website (Figtree). `Heading/Card` is
 * `type.heading_card`; sized variants carry their size (`heading_title35`).
 * Weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold. Size, line height
 * and tracking are the Figma values. `doc_label` is for design-file labels and
 * is not used on a page.
 *
 * Site only; `@pam/ui` and the app keep Astryx type. The values are literals
 * because StyleX reads them at build time; `test/website-tokens.test.ts` checks
 * that this file and the Figma list agree.
 */
export const type = stylex.create({
  display_hero: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '53px',
    fontWeight: 600,
    lineHeight: '57px',
    letterSpacing: '-1px',
  },
  display_heroCompact: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '40px',
    fontWeight: 600,
    lineHeight: '41px',
    letterSpacing: '-0.64px',
  },
  heading_section: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '48px',
    fontWeight: 500,
    lineHeight: '57px',
    letterSpacing: '-1px',
  },
  heading_sectionCompact: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '40px',
    fontWeight: 500,
    lineHeight: '41px',
    letterSpacing: '-1px',
  },
  heading_band: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '44px',
    fontWeight: 500,
    lineHeight: '57px',
    letterSpacing: '-1px',
  },
  heading_title35: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '35px',
    fontWeight: 600,
    lineHeight: '44px',
  },
  heading_title29: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '29px',
    fontWeight: 600,
    lineHeight: '40px',
  },
  heading_title24: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '24px',
    fontWeight: 600,
    lineHeight: '32px',
  },
  heading_card: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '20px',
    fontWeight: 600,
    lineHeight: '28px',
  },
  heading_small17: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '17px',
    fontWeight: 700,
    lineHeight: '24px',
  },
  heading_small16: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: '23px',
  },
  lead_hero: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '26px',
    fontWeight: 400,
    lineHeight: '37px',
  },
  lead_large20: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '20px',
    fontWeight: 400,
    lineHeight: '30px',
  },
  lead_large17: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '17px',
    fontWeight: 400,
    lineHeight: '25.5px',
  },
  lead_17: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '17px',
    fontWeight: 400,
    lineHeight: '24px',
  },
  label_large: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '20px',
    fontWeight: 500,
    lineHeight: '32px',
  },
  label_chip: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '20px',
    fontWeight: 500,
    lineHeight: '28px',
  },
  label_16: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '22px',
  },
  label_15: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '15px',
    fontWeight: 500,
    lineHeight: '21px',
  },
  label_14: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
  },
  label_strong17: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '17px',
    fontWeight: 600,
    lineHeight: '24px',
  },
  label_strong15: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '15px',
    fontWeight: 600,
    lineHeight: '21px',
  },
  label_strong14: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '20px',
  },
  label_bold15: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '15px',
    fontWeight: 700,
    lineHeight: '21px',
  },
  label_bold14: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '14px',
    fontWeight: 700,
    lineHeight: '20px',
  },
  label_bold13: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '13px',
    fontWeight: 700,
    lineHeight: '19px',
  },
  label_bold12: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '12px',
    fontWeight: 700,
    lineHeight: '20px',
  },
  body_15: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: '21px',
  },
  body_14: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '20px',
  },
  caption_12: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '20px',
  },
  eyebrow_13: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: '20px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  doc_label: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '20px',
    fontWeight: 600,
  },
});
