'use client';

import type { ComponentProps } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Selector } from '@astryxdesign/core/Selector';
import { pam } from './tokens.stylex.js';

/**
 * Pam's dropdown (Will, 7 October, D-370): Astryx's `Selector`, set the one
 * way everywhere so every list looks and behaves alike.
 *
 * - **The list opens under the box**, not over it. Astryx's default lays the
 *   chosen row on top of the box, the way a desktop menu does; on a phone
 *   that reads as one thing covering another. Under it, the box stays in
 *   view and the list hangs from it like any other popover. Near the bottom
 *   of the screen it flips above the box on its own (Astryx's fallbacks), and
 *   a long list scrolls inside its panel.
 * - **The box is a field's box** — 56px tall, 12px corners, 16px words — so a
 *   dropdown in a form sits flush with the text fields around it.
 * - **Each row is 48px** and the chosen row's tick is heavier: both in
 *   `globals.css`, where Astryx's option rows can be reached.
 */
export type DropdownProps = ComponentProps<typeof Selector>;

const styles = stylex.create({
  box: {
    height: pam['--pam-field-height'],
    minHeight: pam['--pam-field-height'],
    borderRadius: '12px',
    paddingInline: '14px',
    fontSize: '16px',
  },
});

export function Dropdown({ xstyle, ...props }: DropdownProps) {
  return (
    <Selector
      size="lg"
      placement="below"
      {...props}
      xstyle={[styles.box, xstyle] as DropdownProps['xstyle']}
    />
  );
}
