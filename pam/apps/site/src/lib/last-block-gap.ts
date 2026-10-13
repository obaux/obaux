import * as stylex from '@stylexjs/stylex';
import { space } from './website-space.stylex';

/**
 * The space under the last block of a help page, before the footer (Will, a83; Mira: "every help page ends the same way"):
 * 60px on a phone and 120px from 900px, one pair of numbers (`website-space.stylex.ts`). The footer already leaves
 * `footerGapDesktop` above itself from 900px, so the block adds only what is left.
 */
export const lastBlockGap = stylex.create({
  end: {
    marginBlockEnd: {
      default: space.stillStuckGapPhone,
      '@media (min-width: 900px)': `calc(${space.stillStuckGapDesktop} - ${space.footerGapDesktop})`,
    },
  },
});
