'use client';

import { useId, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';

/**
 * The illustration kit (D-287, D-295): what every small PAM picture is made
 * of, so the place cards, the badges and Profile's tiles read as one set.
 *
 * The language is the sign-in carousel's: flat, angular colour, a ground cut
 * by one or two diagonal shards, an object lit from the left with a darker
 * right half, no outlines, a loud palette. Every colour is a theme data
 * token (`--color-data-<hue>-<1..5>`), never a raw hex — 1 is palest, 5
 * deepest — written as literal strings because StyleX compiles them at
 * build time and cannot call a helper.
 *
 * Pictures are drawn on a 56 × 56 grid and are decoration: hidden from
 * screen readers, never focusable. The words beside them say what they are.
 */
export const fills = stylex.create({
  orange1: { fill: 'var(--color-data-orange-1)' },
  orange2: { fill: 'var(--color-data-orange-2)' },
  orange3: { fill: 'var(--color-data-orange-3)' },
  orange4: { fill: 'var(--color-data-orange-4)' },
  orange5: { fill: 'var(--color-data-orange-5)' },
  shamrock1: { fill: 'var(--color-data-shamrock-1)' },
  shamrock2: { fill: 'var(--color-data-shamrock-2)' },
  shamrock3: { fill: 'var(--color-data-shamrock-3)' },
  shamrock4: { fill: 'var(--color-data-shamrock-4)' },
  shamrock5: { fill: 'var(--color-data-shamrock-5)' },
  purple1: { fill: 'var(--color-data-purple-1)' },
  purple2: { fill: 'var(--color-data-purple-2)' },
  purple3: { fill: 'var(--color-data-purple-3)' },
  purple4: { fill: 'var(--color-data-purple-4)' },
  purple5: { fill: 'var(--color-data-purple-5)' },
  pink1: { fill: 'var(--color-data-pink-1)' },
  pink2: { fill: 'var(--color-data-pink-2)' },
  pink3: { fill: 'var(--color-data-pink-3)' },
  pink4: { fill: 'var(--color-data-pink-4)' },
  pink5: { fill: 'var(--color-data-pink-5)' },
  yellow1: { fill: 'var(--color-data-yellow-1)' },
  yellow2: { fill: 'var(--color-data-yellow-2)' },
  yellow3: { fill: 'var(--color-data-yellow-3)' },
  yellow4: { fill: 'var(--color-data-yellow-4)' },
  yellow5: { fill: 'var(--color-data-yellow-5)' },
  teal1: { fill: 'var(--color-data-teal-1)' },
  teal2: { fill: 'var(--color-data-teal-2)' },
  teal3: { fill: 'var(--color-data-teal-3)' },
  teal4: { fill: 'var(--color-data-teal-4)' },
  teal5: { fill: 'var(--color-data-teal-5)' },
  red1: { fill: 'var(--color-data-red-1)' },
  red2: { fill: 'var(--color-data-red-2)' },
  red3: { fill: 'var(--color-data-red-3)' },
  red4: { fill: 'var(--color-data-red-4)' },
  red5: { fill: 'var(--color-data-red-5)' },
  blue1: { fill: 'var(--color-data-blue-1)' },
  blue2: { fill: 'var(--color-data-blue-2)' },
  blue3: { fill: 'var(--color-data-blue-3)' },
  blue4: { fill: 'var(--color-data-blue-4)' },
  blue5: { fill: 'var(--color-data-blue-5)' },
  gray1: { fill: 'var(--color-data-gray-1)' },
  gray2: { fill: 'var(--color-data-gray-2)' },
  gray3: { fill: 'var(--color-data-gray-3)' },
  gray4: { fill: 'var(--color-data-gray-4)' },
  gray5: { fill: 'var(--color-data-gray-5)' },
  none: { fill: 'none' },
});

export type Fill = keyof typeof fills;

const lines = stylex.create({
  base: { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' },
});

const strokes = stylex.create({
  orange1: { stroke: 'var(--color-data-orange-1)' },
  orange2: { stroke: 'var(--color-data-orange-2)' },
  orange3: { stroke: 'var(--color-data-orange-3)' },
  orange4: { stroke: 'var(--color-data-orange-4)' },
  orange5: { stroke: 'var(--color-data-orange-5)' },
  shamrock1: { stroke: 'var(--color-data-shamrock-1)' },
  shamrock2: { stroke: 'var(--color-data-shamrock-2)' },
  shamrock3: { stroke: 'var(--color-data-shamrock-3)' },
  shamrock4: { stroke: 'var(--color-data-shamrock-4)' },
  shamrock5: { stroke: 'var(--color-data-shamrock-5)' },
  purple1: { stroke: 'var(--color-data-purple-1)' },
  purple2: { stroke: 'var(--color-data-purple-2)' },
  purple3: { stroke: 'var(--color-data-purple-3)' },
  purple4: { stroke: 'var(--color-data-purple-4)' },
  purple5: { stroke: 'var(--color-data-purple-5)' },
  pink1: { stroke: 'var(--color-data-pink-1)' },
  pink2: { stroke: 'var(--color-data-pink-2)' },
  pink3: { stroke: 'var(--color-data-pink-3)' },
  pink4: { stroke: 'var(--color-data-pink-4)' },
  pink5: { stroke: 'var(--color-data-pink-5)' },
  yellow1: { stroke: 'var(--color-data-yellow-1)' },
  yellow2: { stroke: 'var(--color-data-yellow-2)' },
  yellow3: { stroke: 'var(--color-data-yellow-3)' },
  yellow4: { stroke: 'var(--color-data-yellow-4)' },
  yellow5: { stroke: 'var(--color-data-yellow-5)' },
  teal1: { stroke: 'var(--color-data-teal-1)' },
  teal2: { stroke: 'var(--color-data-teal-2)' },
  teal3: { stroke: 'var(--color-data-teal-3)' },
  teal4: { stroke: 'var(--color-data-teal-4)' },
  teal5: { stroke: 'var(--color-data-teal-5)' },
  red1: { stroke: 'var(--color-data-red-1)' },
  red2: { stroke: 'var(--color-data-red-2)' },
  red3: { stroke: 'var(--color-data-red-3)' },
  red4: { stroke: 'var(--color-data-red-4)' },
  red5: { stroke: 'var(--color-data-red-5)' },
  blue1: { stroke: 'var(--color-data-blue-1)' },
  blue2: { stroke: 'var(--color-data-blue-2)' },
  blue3: { stroke: 'var(--color-data-blue-3)' },
  blue4: { stroke: 'var(--color-data-blue-4)' },
  blue5: { stroke: 'var(--color-data-blue-5)' },
  gray1: { stroke: 'var(--color-data-gray-1)' },
  gray2: { stroke: 'var(--color-data-gray-2)' },
  gray3: { stroke: 'var(--color-data-gray-3)' },
  gray4: { stroke: 'var(--color-data-gray-4)' },
  gray5: { stroke: 'var(--color-data-gray-5)' },
});

/** A filled path in one palette colour. */
export function P({ d, f }: { readonly d: string; readonly f: Fill }) {
  return <path d={d} {...stylex.props(fills[f])} />;
}

/** A circle in one palette colour. */
export function C({ cx, cy, r, f }: { readonly cx: number; readonly cy: number; readonly r: number; readonly f: Fill }) {
  return <circle cx={cx} cy={cy} r={r} {...stylex.props(fills[f])} />;
}

/** A rectangle in one palette colour. */
export function R({
  x,
  y,
  w,
  h,
  rx = 0,
  f,
}: {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly rx?: number;
  readonly f: Fill;
}) {
  return <rect x={x} y={y} width={w} height={h} rx={rx} {...stylex.props(fills[f])} />;
}

/** A stroked line in a palette colour — a handle, a tassel, a ray. */
export function L({ d, f, w = 2 }: { readonly d: string; readonly f: Fill; readonly w?: number }) {
  return <path d={d} strokeWidth={w} {...stylex.props(lines.base, strokes[f as keyof typeof strokes])} />;
}

/** The ground: a flat colour and up to two diagonal shards. */
export function Ground({ base, shards = [] }: { readonly base: Fill; readonly shards?: readonly { d: string; f: Fill }[] }) {
  return (
    <>
      <R x={0} y={0} w={56} h={56} f={base} />
      {shards.map((s) => (
        <P key={s.d} d={s.d} f={s.f} />
      ))}
    </>
  );
}

const frame = stylex.create({ svg: { display: 'block', flexShrink: 0 } });

/**
 * The frame every picture is drawn in: a 56-grid scaled to `size`, clipped
 * to a rounded square (place cards, Profile) or a circle (badges, the
 * ladder — a medal).
 */
export function ArtFrame({
  size,
  shape = 'square',
  children,
}: {
  readonly size: number;
  readonly shape?: 'square' | 'circle';
  readonly children: ReactNode;
}) {
  const clip = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden focusable="false" {...stylex.props(frame.svg)}>
      <defs>
        <clipPath id={clip}>
          {shape === 'circle' ? <circle cx="28" cy="28" r="28" /> : <rect width="56" height="56" rx="16" />}
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>{children}</g>
    </svg>
  );
}
