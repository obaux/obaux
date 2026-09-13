import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { pam } from './tokens.stylex.js';

/**
 * A way on that is not the primary action: Get help, Back, Privacy, Sign out.
 *
 * Five screens each declared `{ minHeight: '48px', fontSize: '17px' }` for this
 * and called it `styles.link`. That is not a style, it is a component that had
 * not been written yet — and the giveaway is that the 48px is PAM's touch
 * target rule (§2.5), which should be stated once and obeyed everywhere rather
 * than retyped by whoever writes the next screen.
 *
 * A real link when `href` is given, so it survives a dropped connection and can
 * be opened in a new tab; a button when it acts on the page.
 */
export interface TextLinkProps {
  readonly label: string;
  readonly href?: string;
  readonly onClick?: () => void;
  readonly isDisabled?: boolean;
  /** `quiet` is for legal small print, which should not compete with an action. */
  readonly size?: 'default' | 'quiet';
}

const styles = stylex.create({
  link: { minHeight: pam.touchTargetMin, fontSize: pam.linkSize },
  quiet: { minHeight: pam.touchTargetMin, fontSize: '15px' },
});

export function TextLink({ label, href, onClick, isDisabled, size = 'default' }: TextLinkProps) {
  return (
    <Button
      label={label}
      variant="ghost"
      href={href}
      onClick={onClick}
      isDisabled={isDisabled}
      xstyle={size === 'quiet' ? styles.quiet : styles.link}
    />
  );
}
