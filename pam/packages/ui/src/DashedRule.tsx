'use client';

import * as stylex from '@stylexjs/stylex';
import { pam } from './tokens.stylex.js';

/**
 * A dashed rule (Will, 7 October, D-356): round-ended dashes, 2px thick,
 * black at 5% (`--pam-rule-dashed`). It separates an explanation from what
 * it explains, quietly. New work only — the solid dividers stay where they
 * are; use this one going forward.
 *
 * Drawn, not bordered: a CSS dashed border has square ends, and the ask is
 * pills. Decoration only — hidden from screen readers.
 */
const styles = stylex.create({
  svg: { display: 'block', width: '100%', height: '2px', overflow: 'visible', flexShrink: 0 },
  line: { stroke: pam['--pam-rule-dashed'] },
});

export function DashedRule() {
  return (
    <svg aria-hidden focusable="false" preserveAspectRatio="none" {...stylex.props(styles.svg)}>
      <line
        x1="1"
        y1="1"
        x2="100%"
        y2="1"
        strokeWidth={2}
        strokeLinecap="round"
        // Round caps add 1px each end: 6px dashes, 4px gaps (Will: "a bit tighter").
        strokeDasharray="4 6"
        {...stylex.props(styles.line)}
      />
    </svg>
  );
}
