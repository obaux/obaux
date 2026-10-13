'use client';

import * as stylex from '@stylexjs/stylex';
import { Button } from './Button.js';
import type { ReactNode } from 'react';
import { Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Press } from './motion.js';
import { pam } from './tokens.stylex.js';

/**
 * The primary call to action, everywhere in Pam (§2.4).
 *
 * Astryx's own Button tops out at 36px tall (`size="lg"`), which is right for a
 * dense desktop tool and wrong for this product. Pam sets the button at 56px
 * with 17px text (§2.5 as amended by D-239), so BigButton overrides the height
 * through `xstyle` — the sanctioned escape hatch — rather than forking it.
 *
 * Full-width secondary actions use it too (`variant="secondary"`), so primary
 * and secondary are the same height and type (Will, 3 October, D-239).
 *
 * One primary per screen. If a screen needs two primary BigButtons, it is
 * doing two things and should be split (§0: "One primary action per screen").
 */
export interface BigButtonProps {
  /** Plain-language label. This is the accessible name, so write it as a verb. */
  label: string;
  onPress?: () => void;
  /** Renders as a link when set — used for tel: and maps deep links. */
  href?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary';
  isDisabled?: boolean;
  isLoading?: boolean;
  /**
   * A short count at the button's start — "2 of 7" on a step (Will, 7 October,
   * D-357), as quiet text and no pill (13 October, D-560). Drawn inside the button; part of its name.
   */
  badge?: string;
  /** What joins the label and the count in the button's name: the language's own comma (`nameJoinerOf(locale)`). */
  nameJoiner?: string;
  /** Escape hatch for layout only (margins). Never for colour or type. */
  xstyle?: stylex.StyleXStyles;
}

const styles = stylex.create({
  // The step count is a quiet line of text at the start of the button, not a pill (Will, 13 October): no fill, 12px, the
  // button's own text colour a little lighter. It is one of three equal-width cells in a row, the count, the label and an
  // invisible copy of the count at the other end, so the label stays centred whatever the count is called (in Chinese it
  // is wider than "2 of 7") and a long label wraps in the room between them.
  // The row is as wide as the button's inside (its 12px padding each side): the button is a size container, so `cqw` is its
  // own width, and the row does not shrink to its words the way a child of the button's centring wrapper would.
  withCount: { containerType: 'inline-size' },
  row: { display: 'flex', alignItems: 'center', width: 'calc(100cqw - 24px)', gap: '8px' },
  count: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 0,
    minWidth: 'max-content',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    textAlign: 'start',
    pointerEvents: 'none',
    color: 'inherit',
    opacity: 0.75,
  },
  // The same words, unseen, so the room at the end matches the room at the start.
  // Drawn from `data-count` by CSS, so the words are not in the page twice (a test, or a reader, finds the count once).
  countGhost: { visibility: 'hidden', textAlign: 'end', '::before': { content: 'attr(data-count)' } },
  label: { fontSize: '17px', fontWeight: 600, lineHeight: 1.15, color: 'inherit', textAlign: 'center', whiteSpace: 'normal', flexShrink: 1, minWidth: 0 },
  root: {
    // 56px with 17px text, full width (D-239, Will, 3 October: primary and
    // secondary matched — §2.5's 64px amended). Secondary uses this too.
    // `minHeight`, not `height`: a label that needs a second line grows the
    // button rather than being cut (D-422). One line is still exactly 56px.
    minHeight: '56px',
    fontSize: '17px',
    fontWeight: 600,
    // A full pill, like every button in Pam (Will, 3 October, D-253).
    borderRadius: '999px',
  },
});

export function BigButton({
  label,
  onPress,
  href,
  icon,
  variant = 'primary',
  isDisabled = false,
  isLoading = false,
  badge,
  nameJoiner = ', ',
  xstyle,
}: BigButtonProps) {
  // The count is drawn inside the button, never over its target (D-357), and never in the icon slot, where it pushed the
  // label off centre. It is a quiet line of text, level with the label (D-560). The name says both: "Next, 2 of 7".
  return (
    <Press>
      <Button
        label={badge ? `${label}${nameJoiner}${badge}` : label}
        variant={variant}
        size="lg"
        width="100%"
        icon={icon}
        href={href}
        isDisabled={isDisabled}
        isLoading={isLoading}
        clickAction={onPress}
        xstyle={[styles.root, badge ? styles.withCount : null, xstyle]}
      >
        {badge ? (
          <span {...stylex.props(styles.row)}>
            <Text aria-hidden xstyle={styles.count}>
              {badge}
            </Text>
            <Text aria-hidden xstyle={styles.label}>
              {label}
            </Text>
            <span aria-hidden="true" data-count={badge} {...stylex.props(styles.count, styles.countGhost)} />
          </span>
        ) : undefined}
      </Button>
    </Press>
  );
}
