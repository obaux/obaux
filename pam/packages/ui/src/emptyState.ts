import * as stylex from '@stylexjs/stylex';
import { pam } from './tokens.stylex.js';

/**
 * The icon on every empty state (Will, 7 October, D-362): an outline icon,
 * 64px, in light green (`--pam-empty-icon`) — quiet, and the same on every
 * screen. Pass it as `<Icon {...stylex.props(emptyState.icon)} aria-hidden />`
 * to Astryx's `EmptyState`.
 */
export const emptyState = stylex.create({
  icon: { width: '64px', height: '64px', color: pam['--pam-empty-icon'] },
});
