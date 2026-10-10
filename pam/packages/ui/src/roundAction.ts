import * as stylex from '@stylexjs/stylex';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * A round button at the right of a screen's bar — ⋯ more actions, a place's
 * save (Will, 9 October, D-411: "the ellipsis more actions button needs a
 * grey outline and shadow. It's getting missed"). 48px, the page's colour,
 * a grey outline and a soft shadow, so it reads as a button on a plain page
 * and over a picture alike. Pass it as the `xstyle` of an `IconButton`, or of
 * a `DropdownMenu`'s button.
 */
export const roundAction = stylex.create({
  button: {
    width: '48px',
    height: '48px',
    minWidth: '48px',
    borderRadius: '50%',
    paddingInline: '0px',
    flexShrink: 0,
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    // Astryx's emphasized border: a grey you can see, where its default
    // border (8% black) disappears on white (D-411).
    borderColor: colorVars['--color-border-emphasized'],
    color: colorVars['--color-text-primary'],
    boxShadow: '0 1px 4px light-dark(oklch(0 0 0 / 12%), oklch(0 0 0 / 45%))',
  },
  // The same white disc, with no outline and no shadow. A place's save and ⋯ sit beside the back arrow, which is the
  // only grey one; Will (10 October) did not want these two to carry the outline and the shadow D-411 gave them.
  plain: {
    width: '48px',
    height: '48px',
    minWidth: '48px',
    borderRadius: '50%',
    paddingInline: '0px',
    flexShrink: 0,
    backgroundColor: colorVars['--color-background-body'],
    color: colorVars['--color-text-primary'],
  },
});
