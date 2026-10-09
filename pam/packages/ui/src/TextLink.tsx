import * as stylex from '@stylexjs/stylex';
import { Button } from './Button.js';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { pam } from './tokens.stylex.js';

/**
 * A way on that is not the primary action: Get help, Back, Privacy, Sign out.
 *
 * Five screens each declared `{ minHeight: '48px', fontSize: '17px' }` for this
 * and called it `styles.link`. That is not a style, it is a component that had
 * not been written yet — and the giveaway is that the 48px is Pam's touch
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

/*
 * A link looks like a link (Will, 5 October, D-271): no pill behind it on
 * hover or press — Astryx's ghost button paints one as a background image —
 * only the colour changes and an underline appears. Still a 48px target.
 */
const linkLook = {
  paddingInline: '0px',
  backgroundImage: { default: 'none', ':hover': 'none', ':active': 'none' },
  color: { default: colorVars['--color-text-primary'], ':hover': colorVars['--color-text-accent'] },
  textDecorationLine: { default: 'none', ':hover': 'underline' },
  textUnderlineOffset: '4px',
  textDecorationThickness: '1.5px',
} as const;

const styles = stylex.create({
  link: { minHeight: pam['--pam-touch-target-min'], fontSize: pam['--pam-link-size'], ...linkLook },
  quiet: { minHeight: pam['--pam-touch-target-min'], fontSize: '15px', ...linkLook },
});

/**
 * The same look for a text button that is not a `TextLink` — Cancel beside
 * a search, Edit in a header, "Check hours on Google" (Will, 5 October,
 * D-280: "should not have this weird hover, let's make this a link"). Pass
 * it after the button's own size styles.
 */
export const textLinkLook = stylex.create({ link: linkLook });

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
