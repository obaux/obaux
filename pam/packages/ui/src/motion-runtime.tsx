'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from 'framer-motion';
import { PAM_MOTION } from './motion-tempo.js';

/**
 * The animated implementations, and the only module that imports framer-motion.
 *
 * `motion.tsx` imports this dynamically, so the whole library lands in a chunk
 * of its own that is fetched after the app is usable and only when the
 * connection can carry it. A single static import anywhere else pulls it back
 * into the first load, and the budget check fails the build when that happens.
 *
 * Each wrapper carries its own `LazyMotion`. Nesting them is free — it is a
 * context provider — and it means the app's provider never has to change shape
 * when this module arrives, which is what stops the tree remounting under
 * somebody's fingers.
 */

const styles = stylex.create({
  full: { width: '100%' },
});

function Features({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

export function CardEnterImpl({ children, index = 0 }: { children: ReactNode; index?: number }) {
  return (
    <Features>
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...PAM_MOTION.enter, delay: Math.min(index, 6) * 0.04 }}
        {...stylex.props(styles.full)}
      >
        {children}
      </m.div>
    </Features>
  );
}

export function ScrollRevealImpl({ children, index = 0 }: { children: ReactNode; index?: number }) {
  return (
    <Features>
      <m.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15, margin: '0px 0px -40px 0px' }}
        transition={{ ...PAM_MOTION.enter, delay: Math.min(index, 6) * 0.04 }}
        {...stylex.props(styles.full)}
      >
        {children}
      </m.div>
    </Features>
  );
}

export function MaskedListImpl({ children }: { children: ReactNode }) {
  return (
    <Features>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </Features>
  );
}

export function MaskedItemImpl({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0% round 16px)' }}
      exit={{
        // The mask: the square wipes away to its left edge and fades, so the
        // eye follows the removal rather than noticing a gap.
        clipPath: 'inset(0% 100% 0% 0% round 16px)',
        opacity: 0,
        transition: PAM_MOTION.exit,
      }}
      transition={PAM_MOTION.enter}
    >
      {children}
    </m.div>
  );
}
