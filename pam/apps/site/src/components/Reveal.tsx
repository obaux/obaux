'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';

/*
 * A thing arrives once, when the reader scrolls it into view: opacity and a short rise, the app's "enter" (240ms on
 * (0.2, 0, 0, 1), `PAM_MOTION`). Rules, from Mira's brief:
 *  - only for a reader who has not asked for less motion;
 *  - never above the fold on load, and never without JavaScript (the page is complete before this runs);
 *  - transform and opacity only, so nothing shifts the layout;
 *  - nothing moves that the reader did not scroll to.
 * The hidden state is set by script after the first paint (`data-reveal='pending'`, styled in globals.css), only on blocks
 * that are below the screen at that moment.
 */
const styles = stylex.create({
  base: {
    transitionProperty: 'opacity, transform',
    transitionDuration: '240ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
  },
});

export function Reveal({ children }: { readonly children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof IntersectionObserver === 'undefined') return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave it
    el.dataset['reveal'] = 'pending';
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        delete el.dataset['reveal'];
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} {...stylex.props(styles.base)}>
      {children}
    </div>
  );
}
