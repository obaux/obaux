'use client';

import * as stylex from '@stylexjs/stylex';
import { Badge as AstryxBadge, type BadgeProps } from '@astryxdesign/core/Badge';
import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';

export type { BadgeVariant } from '@astryxdesign/core/Badge';

/**
 * Astryx's `Badge`, whose label may take a second line (D-404).
 *
 * A badge is one line, 20px tall, and trims what does not fit with an
 * ellipsis — and in English it fits: "Open", "2". "En una escuela · solo
 * estudiantes" and "В школе · только для учащихся" are sentences-in-a-pill
 * that say who a place is for, and an ellipsis on them hides the very
 * condition somebody needs before they walk there. So the pill may take a
 * second line and grows to hold it. A count or a short word is the same 20px
 * pill it always was.
 */
const styles = stylex.create({
  wraps: {
    height: 'auto',
    minHeight: spacingVars['--spacing-5'],
    paddingBlock: '1px',
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    // A wrapped pill reads best with its lines together; a rounded one is
    // never more than a couple of lines, so the full radius stays.
    textAlign: 'start',
  },
});

export function Badge({ xstyle, ...props }: BadgeProps) {
  return <AstryxBadge {...props} xstyle={[styles.wraps, xstyle]} />;
}
