'use client';

import * as stylex from '@stylexjs/stylex';
import { Button as AstryxButton, type ButtonProps } from '@astryxdesign/core/Button';
import { colorVars, sizeVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * Astryx's `Button`, with a label that may take a second line (D-422).
 *
 * Astryx fixes a button to one line and a set height and trims what does not
 * fit with an ellipsis. In English that holds. "Человек, который ведёт
 * программу" and "Leer la política de privacidad completa" are the labels of
 * buttons somebody has to read to choose, and "Человек, который ведёт п…"
 * leaves them guessing. A button's name is never cut: it wraps, and the
 * button grows to hold it.
 *
 * Nothing changes while the label fits on a line — the button keeps the
 * height of its size (`minHeight`), so English is as it was. A caller that
 * needs a taller target says so with `minHeight`, never `height`, which would
 * stop it growing.
 *
 * Icon-only buttons are untouched: they are a square with no label to wrap.
 *
 * **A secondary button has a light edge** (D-493; Will, 10 October, on the website: a secondary
 * button "was hard to see on gray"). Its pale green fill all but disappears on a gray
 * card or page, so it carries a 1px ring in the theme's border colour. Drawn as an inset
 * `box-shadow`, not a `border`: a border takes 2px from the button's box, and every
 * secondary button in the app would change size; a ring changes nothing but its edge.
 * Where it does not apply:
 * - icon-only buttons, which are untouched above;
 * - anything that already draws its own edge and says so with `hasEdge={false}`: the
 *   choice chips (`ChoiceChips`, whose unselected chip has its own 1px border and whose
 *   selected one is the filled green), so a chip is never a ring inside a border;
 * - primary and the quieter variants, which are not pale fills on gray.
 * `CategoryChips` and `SearchPill` use Astryx's button directly and keep their own edge.
 */
const styles = stylex.create({
  wraps: {
    height: 'auto',
    // Astryx's 8px of padding on a 20px line is 36px; with the height now
    // coming from `minHeight`, 4px keeps a one-line button exactly its size.
    paddingBlock: spacingVars['--spacing-1'],
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    textAlign: 'center',
  },
  edge: { boxShadow: `inset 0 0 0 1px ${colorVars['--color-border']}` },
  sm: { minHeight: sizeVars['--size-element-sm'] },
  md: { minHeight: sizeVars['--size-element-md'] },
  lg: { minHeight: sizeVars['--size-element-lg'] },
});

export function Button({
  size = 'md',
  xstyle,
  isIconOnly = false,
  hasEdge = true,
  ...props
}: ButtonProps & {
  /** Off for a button that draws its own edge (a choice chip). Only a secondary one has the light ring. */
  readonly hasEdge?: boolean;
}) {
  const ring = props.variant === 'secondary' && hasEdge;
  return (
    <AstryxButton
      {...props}
      size={size}
      isIconOnly={isIconOnly}
      xstyle={isIconOnly ? xstyle : [ring && styles.edge, styles.wraps, styles[size], xstyle]}
    />
  );
}
