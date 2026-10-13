import * as stylex from '@stylexjs/stylex';

/**
 * Website-only spacing that has to be one number everywhere it is used (D-528, like the colours and type). Named, so a
 * test can hold the value and a screen cannot drift.
 *
 * `stillStuckGap*` is the space between the bottom of the grey "Still stuck?" card and the green footer (Will, 13 October,
 * a83: "60px of bottom padding so still stuck cards don't touch footer on mobile. And 120px padding on desktop").
 * `footerGapDesktop` is the footer's own space above it from 900px; the card adds only what is left to reach the total.
 */
export const space = stylex.defineConsts({
  stillStuckGapPhone: '60px',
  stillStuckGapDesktop: '120px',
  footerGapDesktop: '64px',
});
