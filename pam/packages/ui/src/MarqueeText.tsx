'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';

/**
 * One line of words that, when it is cut off, slides sideways to show its end
 * and comes back (Will, 9 October, D-407: "keep asset title labels max at 1
 * line, but animate text through horizontally when text truncates so they
 * can see end of long named files").
 *
 * - Short enough to fit: plain words, nothing moves.
 * - Cut off: one line with an ellipsis. When it comes into view it waits a
 *   beat, slides left until the last letter shows ("…warehouse job.docx"),
 *   holds, and slides back — once, in five seconds at most. Moving text that
 *   starts by itself must stop within five seconds or offer a pause (WCAG
 *   2.2.2), so it never loops; it plays again each time the row comes back
 *   into view.
 * - Reduced motion: it never moves, and keeps its ellipsis.
 *
 * A screen reader reads the whole name either way; the motion is for eyes.
 * `delay` staggers rows that come into view together, so they do not all
 * slide at once.
 */
const slide = stylex.keyframes({
  '0%': { transform: 'translateX(0)' },
  '16%': { transform: 'translateX(0)' },
  '60%': { transform: 'translateX(var(--pam-marquee-shift))' },
  '82%': { transform: 'translateX(var(--pam-marquee-shift))' },
  '100%': { transform: 'translateX(0)' },
});

const styles = stylex.create({
  frame: {
    display: 'block',
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  words: { font: 'inherit', color: 'inherit', letterSpacing: 'inherit' },
  // While it slides it is one unbroken strip, clipped by the frame.
  moving: {
    display: 'inline-block',
    animationName: slide,
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 1,
    '@media (prefers-reduced-motion: reduce)': { animationName: 'none' },
  },
  run: (shift: number, ms: number, delay: number) => ({
    '--pam-marquee-shift': `${-shift}px`,
    animationDuration: `${ms}ms`,
    animationDelay: `${delay}ms`,
  }),
});

/** How fast the words travel, and the whole run's bounds. */
const PX_PER_SECOND = 45;
const SLIDE_SHARE = 0.44; // 16% → 60% of the run
const MIN_MS = 2600;
const MAX_MS = 5000;

export function runMs(shift: number): number {
  return Math.round(Math.min(MAX_MS, Math.max(MIN_MS, (shift / PX_PER_SECOND) * 1000 / SLIDE_SHARE)));
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

export interface MarqueeTextProps {
  readonly children: ReactNode;
  /** The frame's text styles (size, weight, colour). */
  readonly xstyle?: StyleXStyles;
  /** Milliseconds before it starts once in view (stagger a list with it). */
  readonly delay?: number;
  readonly as?: 'span' | 'p' | 'div';
}

export function MarqueeText({ children, xstyle, delay = 700, as = 'span' }: MarqueeTextProps) {
  const frame = useRef<HTMLElement>(null);
  const [shift, setShift] = useState(0);
  const [run, setRun] = useState(0);
  const [moving, setMoving] = useState(false);

  // How far past the edge the words reach, kept current as the row resizes.
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => {
      if (!moving) setShift(Math.max(0, el.scrollWidth - el.clientWidth));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, moving]);

  // Each time it comes into view, cut off, it plays once.
  useEffect(() => {
    const el = frame.current;
    if (!el || shift <= 1 || prefersReducedMotion()) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRun((n) => n + 1);
          setMoving(true);
        }
      },
      { threshold: 0.9 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shift]);

  return (
    <Text as={as} ref={frame} xstyle={[styles.frame, xstyle]}>
      <Text
        key={run}
        as="span"
        xstyle={[styles.words, moving && shift > 1 && [styles.moving, styles.run(shift, runMs(shift), delay)]]}
        onAnimationEnd={() => setMoving(false)}
        data-marquee={moving && shift > 1 ? 'moving' : shift > 1 ? 'cut' : 'fits'}
      >
        {children}
      </Text>
    </Text>
  );
}
