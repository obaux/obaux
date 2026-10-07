'use client';

import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import type { ReactNode } from 'react';
import { HStack } from '@astryxdesign/core/HStack';
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
   * A short count tucked into the button's left end — "2 of 7" on a step
   * (Will, 7 October, D-357). Plain text over the button, read out after it.
   */
  badge?: string;
  /** Escape hatch for layout only (margins). Never for colour or type. */
  xstyle?: stylex.StyleXStyles;
}

const styles = stylex.create({
  wrap: { position: 'relative', width: '100%' },
  // As far from the left end as from the top and bottom (D-357): 32px tall
  // in a 56px button, so 12px all round.
  badge: {
    position: 'absolute',
    insetInlineStart: '12px',
    top: '12px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    paddingInline: '12px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: 1,
    pointerEvents: 'none',
    backgroundColor: pam['--pam-on-accent-deep'],
    color: colorVars['--color-on-accent'],
  },
  root: {
    // 56px with 17px text, full width (D-239, Will, 3 October: primary and
    // secondary matched — §2.5's 64px amended). Secondary uses this too.
    height: '56px',
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
  xstyle,
}: BigButtonProps) {
  const button = (
      <Button
        label={label}
        variant={variant}
        size="lg"
        width="100%"
        icon={icon}
        href={href}
        isDisabled={isDisabled}
        isLoading={isLoading}
        clickAction={onPress}
        xstyle={[styles.root, xstyle]}
      />
  );
  return (
    <Press>
      {badge ? (
        <HStack xstyle={styles.wrap}>
          {button}
          {/* Read after the button, as the words it is (D-357). */}
          <Text xstyle={styles.badge}>
            {badge}
          </Text>
        </HStack>
      ) : (
        button
      )}
    </Press>
  );
}
