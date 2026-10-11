'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@pam/ui/Button';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { VStack } from '@astryxdesign/core/VStack';
import { radiusVars, shadowVars } from '@astryxdesign/core/theme/tokens.stylex';
import { website } from '../lib/website.stylex';
import { type } from '../lib/website-type.stylex';
import { tap } from '../lib/tap';

/*
 * The hero's pictures (Will, 11 October: "For the image carousel, have it be tappable and images flip through, to show
 * the brand, have images be floating up and down, so they look alive!").
 *
 * - One real button over the stack: tap, click, Enter and Space flip to the next picture; the arrow keys go either way.
 * - It may flip by itself, calmly (6 seconds), and stops while a finger or the pointer is on it, while focus is inside it,
 *   when it is off screen and, for good, when the reader pauses it. The labelled Pause / Play button stops the drift too
 *   (WCAG 2.2.2: anything that moves by itself for more than five seconds can be stopped).
 * - The drift is a few pixels, several seconds a cycle, each picture on its own delay. Transform and opacity only, so
 *   nothing moves the layout.
 * - Reduced motion: no drift, no automatic flip, no flip animation (a plain swap on tap), and no Pause button because
 *   nothing moves.
 * - A screen reader hears the new picture (politely) only when the reader caused the change, never on the timer.
 * - The timings are the app's (`PAM_MOTION` in packages/ui/src/motion-tempo.ts): arriving 240ms on (0.2, 0, 0, 1).
 */
export interface FlipSlide {
  readonly id: string;
  /** The picture. A `.webp` or `.avif` under `/public`. */
  readonly src: string;
  /** What the picture shows (read out when it changes). */
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

const AUTO_MS = 6000;

const flip = stylex.keyframes({
  '0%': { transform: 'var(--front)', zIndex: 5 },
  '50%': { transform: 'translate(-34%, -4%) rotate(-9deg) rotateY(78deg)', zIndex: 5 },
  '51%': { zIndex: 1 },
});
const drift = stylex.keyframes({
  from: { transform: 'translateY(-5px)' },
  to: { transform: 'translateY(5px)' },
});

const styles = stylex.create({
  group: { position: 'relative', width: '100%', maxWidth: '440px', marginInline: 'auto' },
  stage: {
    position: 'relative',
    display: 'block',
    width: '100%',
    aspectRatio: '4 / 5',
    padding: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    perspective: '1200px',
    borderRadius: radiusVars['--radius-page'],
  },
  // One picture in the stack: `--pos` 0 is the front.
  card: {
    position: 'absolute',
    inset: '6%',
    transformOrigin: '50% 60%',
    transitionProperty: { default: 'none', '@media (prefers-reduced-motion: no-preference)': 'transform' },
    transitionDuration: '240ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
    willChange: 'transform',
  },
  pos0: { transform: 'rotate(-2deg)', zIndex: 4, '--front': 'rotate(-2deg)' },
  pos1: { transform: 'translate(3%, 2%) rotate(3deg) scale(0.97)', zIndex: 3 },
  pos2: { transform: 'translate(-3%, 3%) rotate(-5deg) scale(0.94)', zIndex: 2 },
  // The picture that has just left the front flips away behind the others.
  flipping: {
    animationName: { default: 'none', '@media (prefers-reduced-motion: no-preference)': flip },
    animationDuration: '420ms',
    animationTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
    '--front': 'rotate(-2deg)',
  },
  floater: {
    width: '100%',
    height: '100%',
    animationName: { default: 'none', '@media (prefers-reduced-motion: no-preference)': drift },
    animationDuration: '5.6s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
  },
  stopped: { animationPlayState: 'paused' },
  staggered: (delay: string) => ({ animationDelay: delay }),
  picture: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: radiusVars['--radius-page'],
    boxShadow: shadowVars['--shadow-med'],
    backfaceVisibility: 'hidden',
  },
  wrap: { position: 'relative' },
  // The Pause / Play control sits on the picture stack, in its top corner, so it is on the first screen on a phone (Iris H1):
  // a pill that looks pressable (veil fill, hairline, an icon and the label).
  pause: {
    position: 'absolute',
    insetBlockStart: '8px',
    insetInlineEnd: '8px',
    zIndex: 10,
    borderRadius: '24px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: website['--website-border-strong'],
    backgroundColor: website['--website-surface-veil'],
    color: website['--website-text-primary'],
    paddingInline: '14px',
  },
});

function PauseMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="6" y="4" width="4.5" height="16" rx="1.2" fill="currentColor" />
      <rect x="13.5" y="4" width="4.5" height="16" rx="1.2" fill="currentColor" />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" fill="currentColor" />
    </svg>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function FlipCarousel({
  slides,
  label,
  nextLabel = 'Show the next picture',
  pauseLabel = 'Pause pictures',
  playLabel = 'Play pictures',
}: {
  readonly slides: readonly FlipSlide[];
  /** What the group is, read out: "Pam in pictures". */
  readonly label: string;
  readonly nextLabel?: string;
  readonly pauseLabel?: string;
  readonly playLabel?: string;
}) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState<number | null>(null); // the picture that just left the front
  const [paused, setPaused] = useState(false); // the reader's choice
  const [touching, setTouching] = useState(false); // pointer or finger on it, or focus inside it
  const [visible, setVisible] = useState(true);
  const [heard, setHeard] = useState('');
  const reduced = usePrefersReducedMotion();
  const groupRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (to: number, byReader: boolean) => {
      const next = (to + count) % count;
      setIndex((current) => {
        if (next !== current) setLeft(current);
        return next;
      });
      setHeard(byReader ? `Picture ${next + 1} of ${count}: ${slides[next]!.alt}` : '');
    },
    [count, slides],
  );

  // Only while it is allowed to move on its own: not paused, not touched, on screen, and the reader wants motion.
  const auto = !paused && !touching && visible && !reduced && count > 1;
  useEffect(() => {
    if (!auto) return;
    const timer = window.setInterval(() => goTo(index + 1, false), AUTO_MS);
    return () => window.clearInterval(timer);
  }, [auto, index, goTo]);

  useEffect(() => {
    const el = groupRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? true), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const moving = !paused && visible && !reduced;

  return (
    <VStack
      gap={2}
      xstyle={styles.group}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={() => setTouching(true)}
      onPointerLeave={() => setTouching(false)}
      onFocus={() => setTouching(true)}
      onBlur={() => setTouching(false)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          goTo(index + 1, true);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goTo(index - 1, true);
        }
      }}
    >
      <div ref={groupRef} {...stylex.props(styles.wrap)}>
        <button type="button" aria-label={nextLabel} onClick={() => goTo(index + 1, true)} {...stylex.props(styles.stage)}>
          {slides.map((slide, i) => {
            const pos = (i - index + count) % count;
            return (
              <span
                key={slide.id}
                aria-hidden="true"
                onAnimationEnd={() => setLeft((l) => (l === i ? null : l))}
                {...stylex.props(styles.card, pos === 0 ? styles.pos0 : pos === 1 ? styles.pos1 : styles.pos2, left === i && styles.flipping)}
              >
                <span {...stylex.props(styles.floater, !moving && styles.stopped, styles.staggered(`${-i * 1.9}s`))}>
                  <img
                    src={slide.src}
                    alt=""
                    width={slide.width}
                    height={slide.height}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    {...stylex.props(styles.picture)}
                  />
                </span>
              </span>
            );
          })}
        </button>
        {reduced ? null : (
          <Button
            label={paused ? playLabel : pauseLabel}
            variant="secondary"
            size="sm"
            hasEdge={false}
            icon={paused ? <PlayMark /> : <PauseMark />}
            onClick={() => setPaused((p) => !p)}
            xstyle={[type.label_14, styles.pause, tap.target]}
          />
        )}
      </div>
      <VisuallyHidden role="status" aria-live="polite">
        {heard}
      </VisuallyHidden>
    </VStack>
  );
}
