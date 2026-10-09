'use client';

import * as stylex from '@stylexjs/stylex';
import { SegmentedControlItem, type SegmentedControlItemProps } from '@astryxdesign/core/SegmentedControl';
import { sizeVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * One choice in a `SegmentedControl` that lets its words wrap (D-422).
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
    paddingInline: spacingVars['--spacing-2'],
    whiteSpace: 'normal',
    textAlign: 'center',
    lineHeight: 1.2,
    // A word is never broken to make room (it would read "Участн / ики"):
    // `break-word` leaves a word whole while it can stand on a line of its
    // own, and a segment will not shrink below its longest word. A control of
    // three shares the line (`layout="fill"`), each at least as wide as its
    // longest word.
    overflowWrap: 'break-word',
    minWidth: 'auto',
  },
});

export function Segment(props: Omit<SegmentedControlItemProps, 'xstyle'>) {
  return <SegmentedControlItem {...props} xstyle={styles.wraps} />;
}
