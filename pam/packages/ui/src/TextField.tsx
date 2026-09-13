'use client';

import * as stylex from '@stylexjs/stylex';
import { TextInput, type TextInputProps } from '@astryxdesign/core/TextInput';
import { pam } from './tokens.stylex.js';

/**
 * A text field at PAM's size.
 *
 * Astryx draws its largest input at 36px tall. PAM's floor is a 48px touch
 * target (§2.5), which the field already met — by extending the hit area beyond
 * the frame. That is the wrong half to grow: on a phone a person aims at what
 * they can see, so a box that is smaller than its target teaches people they
 * missed when they did not.
 *
 * So the frame itself is raised to 56px, comfortably past the floor. Everything
 * else — label, status, focus ring, keyboard behaviour, and the text size, which
 * Astryx already floors at 16px on a touch screen so iOS does not zoom on focus
 * — is Astryx's.
 *
 * Use this everywhere instead of `TextInput` directly.
 */
export type TextFieldProps = TextInputProps;

const styles = stylex.create({
  frame: {
    height: pam.fieldHeight,
    // Astryx sets height from its size token; a taller box needs the padding to
    // grow with it or the text sits against the left edge.
    paddingInline: '14px',
    borderRadius: '12px',
  },
});

export function TextField({ xstyle, ...props }: TextFieldProps) {
  return <TextInput {...props} xstyle={[styles.frame, xstyle] as TextInputProps['xstyle']} />;
}
