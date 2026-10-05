import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * An icon in its category's colour with a soft, blurred circle of the same
 * colour behind it (D-288, D-292): the category chips' small version, and
 * the Saved tiles' large one. The icon keeps the deep tone so it reads on
 * the glow; the glow takes the bright data shade.
 *
 * Its own stacking context, so the glow sits behind the icon and never
 * behind whatever white face the icon is on. Decoration only — the glow
 * takes no taps and says nothing to a screen reader.
 */
export type GlowTone = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'pink' | 'cyan' | 'gray';

export interface GlowIconProps {
  readonly tone?: GlowTone | null;
  /** `sm` behind an 18px chip icon; `lg` behind a 52px tile icon. */
  readonly size?: 'sm' | 'lg';
  readonly children: ReactNode;
}

const styles = stylex.create({
  wrap: { position: 'relative', isolation: 'isolate', flexShrink: 0 },
  glow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    zIndex: -1,
    pointerEvents: 'none',
  },
  sm: { width: '24px', height: '24px', filter: 'blur(5px)', opacity: 0.6 },
  lg: { width: '76px', height: '76px', filter: 'blur(16px)', opacity: 0.55 },
});

const tones = stylex.create({
  blue: { color: colorVars['--color-icon-blue'] },
  green: { color: colorVars['--color-icon-green'] },
  purple: { color: colorVars['--color-icon-purple'] },
  orange: { color: colorVars['--color-icon-orange'] },
  red: { color: colorVars['--color-icon-red'] },
  teal: { color: colorVars['--color-icon-teal'] },
  pink: { color: colorVars['--color-icon-pink'] },
  cyan: { color: colorVars['--color-icon-cyan'] },
  gray: { color: colorVars['--color-icon-gray'] },
});

// Literal strings: StyleX compiles these at build time.
const glows = stylex.create({
  blue: { backgroundColor: 'var(--color-data-blue-3)' },
  green: { backgroundColor: 'var(--color-data-shamrock-3)' },
  purple: { backgroundColor: 'var(--color-data-purple-3)' },
  orange: { backgroundColor: 'var(--color-data-orange-3)' },
  red: { backgroundColor: 'var(--color-data-red-3)' },
  teal: { backgroundColor: 'var(--color-data-teal-3)' },
  pink: { backgroundColor: 'var(--color-data-pink-3)' },
  cyan: { backgroundColor: 'var(--color-data-teal-3)' },
  gray: { backgroundColor: 'var(--color-data-gray-3)' },
});

export function GlowIcon({ tone = null, size = 'sm', children }: GlowIconProps) {
  return (
    <HStack align="center" justify="center" xstyle={[styles.wrap, tone && tones[tone]]}>
      {tone ? <HStack aria-hidden xstyle={[styles.glow, styles[size], glows[tone]]} /> : null}
      {children}
    </HStack>
  );
}
