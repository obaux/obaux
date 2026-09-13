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
/**
 * What this field is for, which is all a screen should have to say.
 *
 * Getting a phone keypad and an autofill suggestion out of a browser takes four
 * attributes that have to agree with each other — `type`, `autoComplete`,
 * `inputMode` and a stable `name` — and every one of them is easy to get subtly
 * wrong in a way nobody notices until somebody is typing their own number into
 * a QWERTY keyboard with one thumb.
 *
 * So a screen says what the field is, and this decides the rest. Adding a
 * purpose here fixes every screen that uses it.
 */
export type FieldPurpose = 'phone' | 'code' | 'address' | 'name';

/**
 * The attributes each purpose sets, as plain HTML.
 *
 * Loosely typed on purpose: Astryx's props allow `text | password | email` and
 * name the attribute `htmlName`, while browsers want `tel` and `name` to make
 * autofill work. Both reach the <input> through the same spread; the cast is
 * about the type definition, not the behaviour.
 */
const PURPOSES: Record<FieldPurpose, Record<string, string>> = {
  /**
   * The phone keypad, and the person's own number offered above it. `tel`
   * rather than `tel-national`: a member may type the number the way it is
   * printed on their bill, with or without the country code.
   */
  phone: { type: 'tel', autoComplete: 'tel', inputMode: 'tel', htmlName: 'phone', name: 'phone' },
  /**
   * The sign-in code. `one-time-code` is what makes iOS offer the code from the
   * Messages app above the keyboard and Android autofill it — the difference
   * between tapping once and leaving the app to memorise six digits.
   */
  code: {
    autoComplete: 'one-time-code',
    inputMode: 'numeric',
    htmlName: 'code',
    name: 'code',
  },
  address: { autoComplete: 'street-address', htmlName: 'address', name: 'address' },
  name: { autoComplete: 'given-name', htmlName: 'firstName', name: 'firstName' },
};

export interface TextFieldProps extends TextInputProps {
  /** What the field is for. Sets the keyboard and the autofill hint. */
  purpose?: FieldPurpose;
}

const styles = stylex.create({
  frame: {
    height: pam.fieldHeight,
    // Astryx sets height from its size token; a taller box needs the padding to
    // grow with it or the text sits against the left edge.
    paddingInline: '14px',
    borderRadius: '12px',
  },
});

export function TextField({ purpose, xstyle, ...props }: TextFieldProps) {
  // `inputMode` is the one attribute Astryx's props deliberately omit, and it
  // is the one that decides which keyboard opens on a phone.
  const forPurpose = (purpose ? PURPOSES[purpose] : {}) as Partial<TextInputProps>;

  return (
    <TextInput
      {...forPurpose}
      {...props}
      xstyle={[styles.frame, xstyle] as TextInputProps['xstyle']}
    />
  );
}
