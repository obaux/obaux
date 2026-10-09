'use client';

import * as stylex from '@stylexjs/stylex';
import { SegmentedControlItem, type SegmentedControlItemProps } from '@astryxdesign/core/SegmentedControl';
import { sizeVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * One choice in a `SegmentedControl` that lets its words wrap (D-413).
 *
 * Astryx sets a segment to one line, exactly 28px tall, and trims what does
 * not fit with an ellipsis. Three English words fit; "Programas",
 * "Gestores de casos" and "Руководители программ" side by side at 320px do
 * not, and an ellipsis on the name of a choice leaves somebody picking
 * between "Prog…" and "Ges…". So the segment may take a second line, grows to
 * hold it, and keeps at least its usual height — in English nothing moves.
 *
 * The control around it stays Astryx's. Give every segment in a control this.
 */
const styles = stylex.create({
  wraps: {
    height: 'auto',
    minHeight: `calc(${sizeVars['--size-element-md']} - 4px)`,
    paddingBlock: spacingVars['--spacing-1'],
    whiteSpace: 'normal',
    textAlign: 'center',
    lineHeight: 1.2,
    overflowWrap: 'anywhere',
    minWidth: 0,
  },
});

export function Segment(props: Omit<SegmentedControlItemProps, 'xstyle'>) {
  return <SegmentedControlItem {...props} xstyle={styles.wraps} />;
}
