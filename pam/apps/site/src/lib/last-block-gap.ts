import * as stylex from '@stylexjs/stylex';
import { space } from './website-space.stylex';

/**
 * The space under the last block of a help page, before the footer (Will, a83; Mira: "every help page ends the same way"):
 * 60px on a phone and 120px from 900px, one pair of numbers (`website-space.stylex.ts`). The footer already leaves
 * `footerGapDesktop` above itself from 900px, so the container adds only what is left. Put it on the container that
 * ends the page's content, never on the last block's own margin.
 */
export const lastBlockGap = stylex.create({
  end: {
    // Padding, not a margin: a margin at the end of a nested flex or grid chain is the first thing an engine can drop
    // or collapse (Will, 14 October: "the still stuck card still touches footer on mobile"); padding on the container cannot.
    paddingBlockEnd: {
      default: space.stillStuckGapPhone,
      '@media (min-width: 900px)': `calc(${space.stillStuckGapDesktop} - ${space.footerGapDesktop})`,
    },
  },
});
