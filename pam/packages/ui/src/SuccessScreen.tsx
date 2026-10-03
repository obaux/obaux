'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

/**
 * The "it worked" template (D-240, Will, 3 October): a moment, not a page
 * to work on. No bar, no back, no bell — the one way on is the action under
 * the words. Everything centred, in the middle of the screen, with confetti
 * falling from the top to the bottom once.
 *
 * The confetti is decoration only: hidden from screen readers, never in the
 * way of a tap, and stilled by the global reduced-motion rule (globals.css),
 * so somebody who has asked for less movement sees the words and the button
 * without it. The words carry the news; the confetti only celebrates it.
 */
export interface SuccessScreenProps {
  /** "You're helping Marcus on their way!" */
  readonly title: string;
  /** What happened and what happens next, in a sentence or two. */
  readonly body: string;
  /** The way on — a secondary button, not full width. */
  readonly action: ReactNode;
  /** A quiet line under the action — "An example: nothing is sent yet." */
  readonly note?: string;
}

const fall = stylex.keyframes({
  from: { transform: 'translate3d(0, -12vh, 0) rotate(0deg)', opacity: 1 },
  '85%': { opacity: 1 },
  to: { transform: 'translate3d(var(--drift, 0px), 112vh, 0) rotate(720deg)', opacity: 0 },
});

// The theme's bright data palette (its icon colours are deliberately dark,
// and confetti in them read as muddy specks).
const TONES = [
  'var(--color-data-blue-3)',
  'var(--color-data-shamrock-3)',
  'var(--color-data-yellow-3)',
  'var(--color-data-orange-3)',
  'var(--color-data-pink-3)',
  'var(--color-data-purple-3)',
  'var(--color-data-teal-3)',
] as const;

/** Fixed, so the same screen draws the same confetti — and stories stay stable. */
const PIECES = (() => {
  // A small fixed-seed generator: evenly spread, the same on every render.
  let seed = 20261003;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  return Array.from({ length: 44 }, (_, i) => ({
    // Spread across the width in order, then nudged, so no two stack up.
    left: Math.round(((i + next()) / 44) * 100),
    delay: Math.round(next() * 1200),
    duration: 2400 + Math.round(next() * 1600),
    drift: Math.round((next() - 0.5) * 120),
    width: 6 + Math.round(next() * 6),
    tall: next() > 0.5,
    tone: TONES[Math.floor(next() * TONES.length)]!,
  }));
})();

const styles = stylex.create({
  screen: {
    minHeight: '100dvh',
    width: '100%',
    paddingInline: '24px',
    paddingBlock: '48px',
    boxSizing: 'border-box',
  },
  words: { maxWidth: '420px', width: '100%' },
  title: { fontSize: '30px', lineHeight: 1.2, fontWeight: 700, textAlign: 'center' },
  body: { fontSize: '18px', lineHeight: 1.5, textAlign: 'center' },
  note: { fontSize: '15px', lineHeight: 1.5, textAlign: 'center' },
  sky: {
    position: 'fixed',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 10,
  },
  piece: {
    position: 'absolute',
    top: 0,
    borderRadius: '2px',
    animationName: fall,
    animationTimingFunction: 'cubic-bezier(0.25, 0.6, 0.4, 1)',
    animationFillMode: 'both',
    animationIterationCount: 1,
  },
  place: (left: number, delay: number, duration: number, drift: number, width: number, tall: boolean, tone: string) => ({
    left: `${left}%`,
    width: `${width}px`,
    height: `${tall ? width * 2 : width}px`,
    backgroundColor: tone,
    animationDelay: `${delay}ms`,
    animationDuration: `${duration}ms`,
    '--drift': `${drift}px`,
  }),
});

export function SuccessScreen({ title, body, action, note }: SuccessScreenProps) {
  return (
    <VStack align="center" justify="center" gap={6} xstyle={styles.screen}>
      <VStack aria-hidden xstyle={styles.sky}>
        {PIECES.map((p, i) => (
          <HStack
            key={i}
            xstyle={[styles.piece, styles.place(p.left, p.delay, p.duration, p.drift, p.width, p.tall, p.tone)]}
          />
        ))}
      </VStack>
      <VStack align="center" gap={3} xstyle={styles.words}>
        <Heading level={1} xstyle={styles.title}>
          {title}
        </Heading>
        <Text type="supporting" xstyle={styles.body} role="status">
          {body}
        </Text>
      </VStack>
      {action}
      {note ? (
        <Text type="supporting" xstyle={styles.note}>
          {note}
        </Text>
      ) : null}
    </VStack>
  );
}
