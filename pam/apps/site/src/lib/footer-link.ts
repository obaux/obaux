import * as stylex from '@stylexjs/stylex';
import { website } from './website.stylex';

/** A link in the footer, on the deep green: 17px on a phone (Figma "Home — Phone 390"), 15px from 900px; a 48px tap line. */
export const footerLink = stylex.create({
  link: {
    color: website['--website-text-on-brand-deep'],
    textDecorationLine: 'underline',
    justifyContent: 'center',
    minWidth: '48px',
    fontFamily: 'var(--font-family-body)',
    fontWeight: 400,
    fontSize: { default: '17px', '@media (min-width: 900px)': '15px' },
    lineHeight: { default: '24px', '@media (min-width: 900px)': '21px' },
  },
});
