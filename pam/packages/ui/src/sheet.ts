import * as stylex from '@stylexjs/stylex';

/**
 * Pam's drawers (Astryx `BottomSheet`, through its `xstyle`), D-338.
 *
 * `panel`: no outline. Astryx draws a 1px border round the sheet, which
 * over the dark scrim read as a black line round every drawer (Will, 7
 * October: "why do drawers have black outlines? Remove that"). The rounded
 * top and the shadow already say where it ends.
 */
export const sheet = stylex.create({
  panel: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderInlineStartWidth: 0,
    borderInlineEndWidth: 0,
  },
});
