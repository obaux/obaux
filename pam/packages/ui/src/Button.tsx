'use client';

import * as stylex from '@stylexjs/stylex';
import { Button as AstryxButton, type ButtonProps } from '@astryxdesign/core/Button';
import { sizeVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * Astryx's `Button`, with a label that may take a second line (D-404).
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
  sm: { minHeight: sizeVars['--size-element-sm'] },
  md: { minHeight: sizeVars['--size-element-md'] },
  lg: { minHeight: sizeVars['--size-element-lg'] },
});

export function Button({ size = 'md', xstyle, isIconOnly = false, ...props }: ButtonProps) {
  return (
    <AstryxButton
      {...props}
      size={size}
      isIconOnly={isIconOnly}
      xstyle={isIconOnly ? xstyle : [styles.wraps, styles[size], xstyle]}
    />
  );
}
