'use client';

import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import type { ReactNode } from 'react';
import { Press } from './motion.js';

/**
 * The primary call to action, everywhere in PAM (§2.4).
 *
 * Astryx's own Button tops out at 36px tall (`size="lg"`), which is right for a
 * dense desktop tool and wrong for this product. §2.5 sets the primary button at
 * 64px, so BigButton overrides the height through `xstyle` — the sanctioned
 * escape hatch — rather than forking the component.
 *
 * One per screen. If a screen needs two BigButtons, the screen is doing two
 * things and should be split (§0: "One primary action per screen").
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
    // §2.5 — 64px, and full width so the target is impossible to miss.
    height: '64px',
    minHeight: '64px',
    fontSize: '18px',
    fontWeight: 600,
    borderRadius: '12px',
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
