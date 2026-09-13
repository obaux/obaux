'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { LazyMotion, MotionConfig, AnimatePresence, domAnimation, m } from 'framer-motion';

/**
 * How PAM moves.
 *
 * Motion here is doing a job, not decorating: it says where a thing came from,
 * that a tap landed, and that something left rather than vanished. PAM's member
 * may be on a cheap phone, in a hurry, outside — so everything is short, small,
 * and interruptible. Nothing bounces, nothing slides in from off-screen, and
 * nothing waits for an animation before it is usable.
 *
 * Three rules the numbers come from:
 *
 *   - **Under a quarter second.** 180–260ms. Long enough to read as movement,
 *     short enough that a second tap never queues behind it.
 *   - **Opacity and transform only.** Those are the two properties a phone
 *     animates on the compositor. Animating height or colour on a four-year-old
 *     Android is where "premium" turns into a stutter.
 *   - **The user's setting wins.** `MotionConfig reducedMotion="user"` means
 *     every transform and fade below is skipped for somebody who asked their
 *     phone for less motion, with no per-component checks to forget. §8 and §12
 *     both require that, and vestibular sensitivity is not a niche.
 *
 * `LazyMotion` with `domAnimation` and `strict` is why this costs about 18 kB
 * rather than 34: the full `motion` component is never imported, and `strict`
 * makes that a build error rather than a thing somebody undoes by habit.
 */

/** The tempo. One place, so two screens cannot disagree about what "quick" is. */
export const PAM_MOTION = {
  /** A tap acknowledging itself. */
  press: { duration: 0.12 },
  /** A thing arriving: a screen, a card, a row. */
  enter: { duration: 0.24, ease: [0.2, 0, 0, 1] as const },
  /** A thing leaving. Slightly faster than arriving — waiting on an exit is dead time. */
  exit: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
} as const;

/**
 * Wraps the app. Without it the `m` components below render static, which is
 * the safe failure: the app works, it just does not move.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

const styles = stylex.create({
  full: { width: '100%' },
  // A press target has to be the thing that scales, and it has to keep its own
  // layout — an inline wrapper around a full-width button would shrink it.
  press: { display: 'block', width: '100%' },
});

/**
 * A screen arriving.
 *
 * Eight pixels and a fade, not a slide: a page that travels across the screen
 * on every navigation is a page somebody waits for. This is the difference
 * between "it appeared" and "it snapped".
 */
export function PageEnter({ children }: { children: ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={PAM_MOTION.enter}
      {...stylex.props(styles.full)}
    >
      {children}
    </m.div>
  );
}

/**
 * A card, arriving in its turn.
 *
 * `index` staggers a list by 40ms a row, capped: a twelve-item list should not
 * take half a second to finish arriving, so after the sixth row everything
 * lands together.
 */
export function CardEnter({ children, index = 0 }: { children: ReactNode; index?: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...PAM_MOTION.enter, delay: Math.min(index, 6) * 0.04 }}
      {...stylex.props(styles.full)}
    >
      {children}
    </m.div>
  );
}

/**
 * A card arriving as it is scrolled to, once.
 *
 * `once` matters: a row that re-animates every time it passes the fold is a
 * page that never settles, and on a list somebody is scanning for an address
 * that is actively unhelpful.
 */
export function ScrollReveal({ children, index = 0 }: { children: ReactNode; index?: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -40px 0px' }}
      transition={{ ...PAM_MOTION.enter, delay: Math.min(index, 6) * 0.04 }}
      {...stylex.props(styles.full)}
    >
      {children}
    </m.div>
  );
}

/**
 * A tap, acknowledged.
 *
 * Three per cent, for 120ms. Enough that a thumb covering the button still
 * feels the press at the edges, small enough that nothing reflows — and it is
 * the one piece of motion in PAM that a member will feel hundreds of times.
 */
export function Press({ children }: { children: ReactNode }) {
  return (
    <m.div
      whileTap={{ scale: 0.97 }}
      transition={PAM_MOTION.press}
      {...stylex.props(styles.press)}
    >
      {children}
    </m.div>
  );
}

export { AnimatePresence, m };
