'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * Only the chips now (Will, 7 October, D-337: "Only keep the shaded colors on
 * chips on explore"): every picture of a place is the category's
 * illustration, and `ToneGround`, `ToneIcon` and `ToneBakedIcon` are gone.
 *
 * A category's colour, in the illustrations' language (Will, 5 October,
 * D-297): flat shapes, cut clean, never blurred. It replaces the glow
 * (D-288, D-293), which was soft and photographic beside hard-edged art.
 *
 * Two pieces, both in the palest shade and a facet half a step darker,
 * so they stay faint:
 *   - `ToneDot`, behind a small icon (the category chips): a circle made
 *     of two half circles, the shaded half on the left, going strong to
 *     soft (D-298);
 *   - `ToneGround`, filling a square picture (Saved, trip cards, the next
 *     visit): the colour edge to edge, cut by two diagonal shards — the
 *     same ground the illustrations stand on.
 * The icon itself takes the deep shade (`ToneIcon`), so it reads on both.
 */
export type Tone = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'pink' | 'cyan' | 'gray';

// The palest shade of each tone, and a facet half a step darker — a mix of
// shades 1 and 2, because shade 2 alone was too strong to stay faint
// (Will: "keep the faint style"). The categories' "green" is shamrock.
// Literal strings: StyleX compiles these at build time.
const pale = stylex.create({
  blue: { fill: 'var(--color-data-blue-1)' },
  green: { fill: 'var(--color-data-shamrock-1)' },
  purple: { fill: 'var(--color-data-purple-1)' },
  orange: { fill: 'var(--color-data-orange-1)' },
  red: { fill: 'var(--color-data-red-1)' },
  teal: { fill: 'var(--color-data-teal-1)' },
  pink: { fill: 'var(--color-data-pink-1)' },
  cyan: { fill: 'var(--color-data-teal-1)' },
  gray: { fill: 'var(--color-data-gray-1)' },
});
const facet = stylex.create({
  blue: { fill: 'color-mix(in srgb, var(--color-data-blue-1), var(--color-data-blue-2))' },
  green: { fill: 'color-mix(in srgb, var(--color-data-shamrock-1), var(--color-data-shamrock-2))' },
  purple: { fill: 'color-mix(in srgb, var(--color-data-purple-1), var(--color-data-purple-2))' },
  orange: { fill: 'color-mix(in srgb, var(--color-data-orange-1), var(--color-data-orange-2))' },
  red: { fill: 'color-mix(in srgb, var(--color-data-red-1), var(--color-data-red-2))' },
  teal: { fill: 'color-mix(in srgb, var(--color-data-teal-1), var(--color-data-teal-2))' },
  pink: { fill: 'color-mix(in srgb, var(--color-data-pink-1), var(--color-data-pink-2))' },
  cyan: { fill: 'color-mix(in srgb, var(--color-data-teal-1), var(--color-data-teal-2))' },
  gray: { fill: 'color-mix(in srgb, var(--color-data-gray-1), var(--color-data-gray-2))' },
});

const icons = stylex.create({
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

const styles = stylex.create({
  dot: { position: 'relative', flexShrink: 0, isolation: 'isolate' },
  dotSize: { width: '26px', height: '26px' },
  dotArt: { position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none' },
});

/** A small icon on a circle of two half circles — the chips (D-297). */
export function ToneDot({ tone, children }: { readonly tone?: Tone | null; readonly children: ReactNode }) {
  if (!tone) return <>{children}</>;
  return (
    <HStack align="center" justify="center" xstyle={[styles.dot, styles.dotSize, icons[tone]]}>
      <svg viewBox="0 0 26 26" aria-hidden focusable="false" {...stylex.props(styles.dotArt)}>
        {/* Strong to soft (Will, D-298): the darker half on the left. */}
        <path d="M13 0a13 13 0 0 0 0 26z" {...stylex.props(facet[tone])} />
        <path d="M13 0a13 13 0 0 1 0 26z" {...stylex.props(pale[tone])} />
      </svg>
      {children}
    </HStack>
  );
}
