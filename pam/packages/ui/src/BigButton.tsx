'use client';

import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import type { ReactNode } from 'react';
import { Press } from './motion.js';

/**
 * The primary call to action, everywhere in PAM (§2.4).
 *
 * Astryx's own Button tops out at 36px tall (`size="lg"`), which is right for a
 * dense desktop tool and wrong for this product. PAM sets the button at 56px
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
  /** Escape hatch for layout only (margins). Never for colour or type. */
  xstyle?: stylex.StyleXStyles;
}

const styles = stylex.create({
  root: {
    // 56px with 17px text, full width (D-239, Will, 3 October: primary and
    // secondary matched — §2.5's 64px amended). Secondary uses this too.
    height: '56px',
    minHeight: '56px',
    fontSize: '17px',
    fontWeight: 600,
    // A full pill, like every button in PAM (Will, 3 October, D-253).
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
  xstyle,
}: BigButtonProps) {
  return (
    <Press>
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
    </Press>
  );
}
