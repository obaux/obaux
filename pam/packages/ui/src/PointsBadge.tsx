import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';

/**
 * The points counter (§2.4, §8).
 *
 * Counts up when the value rises, because the count-up is the reward — but only
 * for people who want motion. §8 and §12 both require respecting
 * `prefers-reduced-motion`, so that check is not a nicety here: a member with
 * vestibular sensitivity gets the number, immediately, with no animation.
 */
export interface PointsBadgeProps {
  points: number;
  /** Localised, e.g. "Your points". Used as the accessible label. */
  label: string;
  /** Milliseconds for the count-up. Ignored under reduced motion. */
  durationMs?: number;
}

const styles = stylex.create({
  root: { alignItems: 'baseline' },
  value: { fontSize: '32px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  label: { fontSize: '16px' },
});

function usePrefersReducedMotion(): boolean {
  // Starts true so the first paint is motionless. If we guessed "animate" and
  // the user prefers reduced motion, they would see the very animation they
  // asked not to see before the effect corrected it.
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

export function PointsBadge({ points, label, durationMs = 700 }: PointsBadgeProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [shown, setShown] = useState(points);
  const previous = useRef(points);

  useEffect(() => {
    const from = previous.current;
    previous.current = points;

    if (reducedMotion || from === points) {
      setShown(points);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      // Ease-out: fast at first, settling at the end.
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round(from + (points - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [points, durationMs, reducedMotion]);

  return (
    <HStack gap={1.5} xstyle={styles.root}>
      {/*
        The animated number is hidden from assistive tech and the real value is
        announced instead — otherwise a screen reader reads every intermediate
        frame aloud.
      */}
      <Text aria-hidden="true" xstyle={styles.value}>
        {shown.toLocaleString()}
      </Text>
      <Text type="supporting" xstyle={styles.label}>
        {label}
      </Text>
      <span className="sr-only">{`${points.toLocaleString()} ${label}`}</span>
    </HStack>
  );
}
