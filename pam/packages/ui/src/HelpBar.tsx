import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { PhoneIcon } from './icons.js';

/**
 * "Help" — the persistent way out of a stuck screen (§2.4, §0).
 *
 * §0: "Never dead-end. Every screen has a visible way back and a visible
 * 'Get help'." This is that guarantee, and it is deliberately small: it shares
 * the bottom bar with the five member tabs (§3.1), so it takes the space of one
 * item rather than a full-width row (D-029, D-039).
 *
 * It navigates to the help screen rather than dialling directly. A raw `tel:`
 * is one tap faster and answers only one question; the help screen can say what
 * PAM support does, when someone answers, and what to do in the meantime — and
 * it can grow a second route later without finding new space at the bottom of a
 * phone.
 *
 * Both the button and the number it leads to are real anchors, so the whole
 * path works with no JavaScript. What it costs is one extra page load: on a
 * dead connection that page has to already be cached. See DECISIONS.md D-039.
 */
export interface HelpBarProps {
  /** Where the help screen lives. */
  href?: string;
  /** Localised, e.g. "Help". Keep it to one word — it shares a row with 5 tabs. */
  label: string;
  /**
   * Renders as a compact item sized to sit in the bottom bar (the default), or
   * full width for a standalone screen with room to spare.
   */
  variant?: 'compact' | 'block';
  xstyle?: stylex.StyleXStyles;
}

const styles = stylex.create({
  // §2.5 — still a real target even though it is no longer full width.
  base: { minHeight: '48px', fontSize: '15px' },
  compact: { paddingInline: '12px' },
  block: { width: '100%', fontSize: '17px' },
});

export function HelpBar({ href = '/help/', label, variant = 'compact', xstyle }: HelpBarProps) {
  return (
    <Button
      label={label}
      variant="secondary"
      href={href}
      icon={<PhoneIcon />}
      xstyle={[styles.base, variant === 'block' ? styles.block : styles.compact, xstyle]}
    />
  );
}
