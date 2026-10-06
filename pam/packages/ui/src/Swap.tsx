'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';

/**
 * Two small motions for a card whose words change under somebody's eyes
 * (D-313, Will, 6 October: "use a text mask effect so it looks like text
 * was updated, and have cards resize gradually (smoothly), otherwise the
 * screen jumps abruptly").
 *
 * - `TextSwap`: give it a `token` for what the words are about (the
 *   service's id). When the token changes, the new words are revealed
 *   left to right through a soft mask, as if written over the old ones.
 * - `AutoHeight`: wraps content whose height changes; the box eases from
 *   the old height to the new instead of snapping, so what is below
 *   slides rather than jumps.
 *
 * Both are CSS, both stop for `prefers-reduced-motion`, and neither
 * remounts anything but the text it is asked to.
 */
const reveal = stylex.keyframes({
  '0%': { maskPosition: '100% 0', opacity: 0.4 },
  '100%': { maskPosition: '0% 0', opacity: 1 },
});

const styles = stylex.create({
  swap: {
    maskImage: 'linear-gradient(90deg, #000 0%, #000 45%, transparent 65%, transparent 100%)',
    maskSize: '300% 100%',
    maskRepeat: 'no-repeat',
    maskPosition: '0% 0',
    animationName: reveal,
    animationDuration: '520ms',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'both',
    '@media (prefers-reduced-motion: reduce)': { animationName: 'none' },
  },
  box: {
    overflow: 'hidden',
    transitionProperty: 'height',
    transitionDuration: '320ms',
    transitionTimingFunction: 'ease',
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
  },
  height: (px: number) => ({ height: `${px}px` }),
  auto: { height: 'auto' },
});

/** The words, revealed anew each time `token` changes. */
export function TextSwap({ token, children }: { readonly token: string; readonly children: ReactNode }) {
  const [first, setFirst] = useState(true);
  const seen = useRef(token);
  useEffect(() => {
    if (seen.current !== token) {
      seen.current = token;
      setFirst(false);
    }
  }, [token]);
  // No reveal on first paint — only when the words actually change.
  return (
    <div key={token} {...stylex.props(!first && styles.swap)}>
      {children}
    </div>
  );
}

/** A box that eases to its content's height. */
export function AutoHeight({ children }: { readonly children: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => setHeight(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div {...stylex.props(styles.box, height === null ? styles.auto : styles.height(height))}>
      <div ref={inner}>{children}</div>
    </div>
  );
}
