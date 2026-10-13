'use client';

import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { VStack } from '@astryxdesign/core/VStack';
import { Button } from '@pam/ui/Button';
import { HOME } from '../content/home-copy';
import { website } from '../lib/website.stylex';
import { type } from '../lib/website-type.stylex';
import { tap } from '../lib/tap';

/*
 * The deep green card, "Who is Pam for?" (Figma "Callout card" 18:517; Will, 12 October: the names do not go to the help
 * desk, each shows its own view). The three names are tabs: one picture and one line at a time, the others crossfade out.
 *
 * - Tabs pattern: arrows, Home and End move between the names, Tab goes on to the line.
 * - Each name keeps a 48px tap box; the chip drawn inside is the size of the design (34px high on a phone).
 * - All three lines sit in one grid cell, the hidden ones `visibility: hidden`, so the card is as tall as the longest and
 *   does not jump when you switch.
 * - The picture cross-fades over 650ms and the line swaps in 160 + 320ms (Dot, D-556); none under reduced motion.
 * - It moves on by itself (Will, 13 October, a77): Residents, Program Providers, Case managers, round again, every 6
 *   seconds, shown by a translucent fill growing across the active name. The fill's `animationend` is the timer, so the
 *   picture and the clock cannot drift apart, and pausing the animation pauses the cycle. Choosing a name shows it and
 *   stops the cycle for good (until Play). It also waits while the pointer or focus is in the card or it is off screen.
 *   A Pause / Play pill on the picture stops it (WCAG 2.2.2). Reduced motion: no cycle, no fill, no pill.
 * - A screen reader hears a view only when a person chose it, never on the timer.
 * - The fill's look is Dot's (D-553): see `fill` below. It grows from the inline start, so Arabic runs right to left.
 */
const DWELL_MS = 6000;

const IMAGES: Readonly<Record<string, { src: string; srcSet?: string; width: number; height: number }>> = {
  residents: { src: '/home/philly-1600.webp', srcSet: '/home/philly-900.webp 900w, /home/philly-1600.webp 1600w', width: 2048, height: 1494 },
  providers: { src: '/home/band-providers-630.webp', width: 630, height: 500 },
  managers: { src: '/home/band-managers-630.webp', width: 630, height: 500 },
};

const keyframesFill = stylex.keyframes({
  from: { width: '0%' },
  to: { width: '100%' },
});

const styles = stylex.create({
  band: {
    display: 'grid',
    overflow: 'hidden',
    borderRadius: { default: '24px', '@media (min-width: 900px)': '40px' },
    backgroundColor: website['--website-surface-brand-deep'],
    color: website['--website-text-on-brand-deep'],
    gridTemplateColumns: { default: 'minmax(0, 1fr)', '@media (min-width: 900px)': 'minmax(0, 1fr) minmax(0, 1fr)' },
    minHeight: { default: 'auto', '@media (min-width: 900px)': '400px' },
  },
  pictures: {
    position: 'relative',
    height: { default: '229px', '@media (min-width: 900px)': '100%' },
    minHeight: { default: '229px', '@media (min-width: 900px)': '400px' },
  },
  // The pictures cross-fade (Will, a80; Dot, D-556): the one coming in fades up over 650ms while the one leaving stays fully
  // visible under it for those 650ms and then drops to 0, so the card's green never shows through in the middle. No scale
  // or drift: every picture has the same white frame in the same place.
  picture: {
    position: 'absolute',
    inset: 0,
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0,
    zIndex: 1,
    transitionProperty: { default: 'none', '@media (prefers-reduced-motion: no-preference)': 'opacity' },
    transitionDuration: { default: '0s', '@media (prefers-reduced-motion: no-preference)': '0ms' },
    transitionTimingFunction: { default: 'linear', '@media (prefers-reduced-motion: no-preference)': 'linear' },
    transitionDelay: { default: '0s', '@media (prefers-reduced-motion: no-preference)': '650ms' },
  },
  pictureOn: {
    opacity: 1,
    zIndex: 2,
    transitionDuration: { default: '0s', '@media (prefers-reduced-motion: no-preference)': '650ms' },
    transitionTimingFunction: { default: 'linear', '@media (prefers-reduced-motion: no-preference)': 'cubic-bezier(0.4, 0, 0.2, 1)' },
    transitionDelay: { default: '0s', '@media (prefers-reduced-motion: no-preference)': '0s' },
  },
  text: {
    justifyContent: 'space-between',
    gap: { default: '20px', '@media (min-width: 900px)': '32px' },
    boxSizing: 'border-box',
    padding: { default: '32px 20px 48px', '@media (min-width: 900px)': '48px 48px 48px 60px' },
  },
  label: { color: website['--website-text-on-brand-deep'], margin: 0 },
  tabs: { display: 'flex', flexWrap: 'wrap', columnGap: '8px', rowGap: '0px' },
  // The tap box: 48px high, transparent. The chip inside is what is drawn.
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '48px',
    padding: 0,
    margin: 0,
    border: 'none',
    background: 'none',
    color: 'inherit',
    cursor: 'pointer',
    borderRadius: '24px',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: { default: '4px', '@media (min-width: 900px)': '6px' },
    boxSizing: 'border-box',
    paddingBlock: { default: '6px', '@media (min-width: 900px)': '10px' },
    paddingInline: { default: '12px', '@media (min-width: 900px)': '18px' },
    borderRadius: { default: '15px', '@media (min-width: 900px)': '24px' },
    borderWidth: { default: '1.3px', '@media (min-width: 900px)': '1.8px' },
    borderStyle: 'solid',
    borderColor: website['--website-border-green'],
    color: website['--website-text-on-brand-deep'],
    fontSize: { default: '14px', '@media (min-width: 900px)': '20px' },
    lineHeight: { default: '20px', '@media (min-width: 900px)': '28px' },
    // The name that lets go eases out over 240ms (Dot).
    transitionProperty: { default: 'none', '@media (prefers-reduced-motion: no-preference)': 'background-color, color' },
    transitionDuration: '240ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
  },
  chipOn: { backgroundColor: website['--website-surface-green'], color: website['--website-text-primary'] },
  chipText: { position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 'inherit' },
  // The progress: a translucent shade that grows from the start edge across the active name (transform only).
  fill: {
    position: 'absolute',
    insetBlock: 0,
    insetInlineStart: 0,
    width: '0%',
    // Dot's look (D-553): the brand deep green at 28% on light, white at 22% on dark; a hard leading edge; the label above it.
    backgroundColor: `light-dark(color-mix(in srgb, ${website['--website-surface-brand-deep']} 28%, transparent), color-mix(in srgb, ${website['--website-text-on-brand-deep']} 22%, transparent))`,
    animationName: keyframesFill,
    animationDuration: `${DWELL_MS}ms`,
    animationTimingFunction: 'linear',
    animationFillMode: 'forwards',
    willChange: 'width',
    pointerEvents: 'none',
  },
  fillHeld: { animationPlayState: 'paused' },
  chipClip: { position: 'relative', overflow: 'hidden' },
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
  lines: { display: 'grid' },
  line: {
    gridArea: '1 / 1',
    maxWidth: { default: '300px', '@media (min-width: 900px)': 'none' },
    paddingBlockStart: { default: '12px', '@media (min-width: 900px)': '0px' },
    color: website['--website-text-on-brand-deep'],
    margin: 0,
    fontFamily: 'var(--font-family-body)',
    fontSize: { default: '20px', '@media (min-width: 900px)': '44px' },
    fontWeight: { default: 600, '@media (min-width: 900px)': 500 },
    lineHeight: { default: '28px', '@media (min-width: 900px)': '57px' },
    letterSpacing: { default: '0px', '@media (min-width: 900px)': '-1px' },
    visibility: 'hidden',
    opacity: 0,
    // Out 160ms, hidden at its end; in 320ms after a 160ms wait, visible from the start: two lines are never on screen together.
    transitionProperty: { default: 'none', '@media (prefers-reduced-motion: no-preference)': 'opacity, visibility' },
    transitionDuration: { default: '0s', '@media (prefers-reduced-motion: no-preference)': '160ms, 0s' },
    transitionTimingFunction: { default: 'linear', '@media (prefers-reduced-motion: no-preference)': 'cubic-bezier(0.4, 0, 1, 1), linear' },
    transitionDelay: { default: '0s', '@media (prefers-reduced-motion: no-preference)': '0s, 160ms' },
  },
  lineOn: {
    visibility: 'visible',
    opacity: 1,
    transitionDuration: { default: '0s', '@media (prefers-reduced-motion: no-preference)': '320ms, 0s' },
    transitionTimingFunction: { default: 'linear', '@media (prefers-reduced-motion: no-preference)': 'cubic-bezier(0, 0, 0.2, 1), linear' },
    transitionDelay: { default: '0s', '@media (prefers-reduced-motion: no-preference)': '160ms, 0s' },
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

export function BandViews({ pauseLabel = 'Pause who Pam is for', playLabel = 'Play who Pam is for' }: { readonly pauseLabel?: string; readonly playLabel?: string } = {}) {
  const views = HOME.band.views;
  const [active, setActive] = useState(0);
  // The reader's choice: `false`, `control` (the Pause button: the fill freezes where it is) or `tap` (a name was chosen: no fill).
  const [paused, setPaused] = useState<false | 'control' | 'tap'>(false);
  const [run, setRun] = useState(0); // a new run restarts the 6 seconds
  const [inside, setInside] = useState(false); // pointer or focus in the card
  const [visible, setVisible] = useState(true);
  const [heard, setHeard] = useState('');
  const reduced = usePrefersReducedMotion();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const bandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bandRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? true), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // A person chose a view: show it, say it, and stop the cycle.
  const choose = (to: number, focus = false) => {
    const next = (to + views.length) % views.length;
    setActive(next);
    setPaused('tap');
    setHeard(`${views[next]!.label}: ${views[next]!.line}`);
    if (focus) tabRefs.current[next]?.focus();
  };

  const showFill = !reduced && paused !== 'tap';
  const held = inside || !visible || paused === 'control'; // the fill waits, and so does the cycle

  return (
    <div
      ref={bandRef}
      data-band=""
      {...stylex.props(styles.band)}
      onPointerEnter={() => setInside(true)}
      onPointerLeave={() => setInside(false)}
      // Keyboard focus holds the cycle; a tap that merely leaves focus on a button does not.
      onFocus={(e) => {
        try {
          if ((e.target as HTMLElement).matches(':focus-visible')) setInside(true);
        } catch {
          setInside(true); // an old browser that cannot tell: hold, as before
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setInside(false);
      }}
    >
      <div {...stylex.props(styles.pictures)}>
        {views.map((view, i) => {
          const image = IMAGES[view.id]!;
          return (
            <img
              key={view.id}
              src={image.src}
              {...(image.srcSet ? { srcSet: image.srcSet } : {})}
              sizes="(min-width: 900px) 630px, 100vw"
              width={image.width}
              height={image.height}
              alt={i === active ? view.alt : ''}
              aria-hidden={i === active ? undefined : true}
              loading="lazy"
              decoding="async"
              {...stylex.props(styles.picture, i === active && styles.pictureOn)}
            />
          );
        })}
        {reduced ? null : (
          <Button
            label={paused ? playLabel : pauseLabel}
            variant="secondary"
            size="sm"
            hasEdge={false}
            icon={paused ? <PlayMark /> : <PauseMark />}
            onClick={() => {
              if (paused) {
                setInside(false); // Play lets go of any hold, so a tap that left the pointer or focus here cannot keep it still
                setPaused(false);
                setRun((r) => r + 1); // Play starts the active name's 6 seconds again
              } else {
                setPaused('control');
              }
            }}
            xstyle={[type.label_14, styles.pause, tap.target]}
          />
        )}
      </div>
      <VStack xstyle={styles.text}>
        <VStack gap={4}>
          <Text id="band-label" xstyle={[type.label_large, styles.label]}>
            {HOME.band.label}
          </Text>
          <div
            role="tablist"
            aria-labelledby="band-label"
            {...stylex.props(styles.tabs)}
            onKeyDown={(e) => {
              const here = Math.max(0, tabRefs.current.indexOf(document.activeElement as HTMLButtonElement));
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                choose(here + 1, true);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                choose(here - 1, true);
              } else if (e.key === 'Home') {
                e.preventDefault();
                choose(0, true);
              } else if (e.key === 'End') {
                e.preventDefault();
                choose(views.length - 1, true);
              }
            }}
          >
            {views.map((view, i) => (
              <button
                key={view.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`band-tab-${view.id}`}
                aria-selected={i === active}
                aria-controls="band-panel"
                tabIndex={i === active ? 0 : -1}
                onClick={() => choose(i)}
                {...stylex.props(styles.tab)}
              >
                <span {...stylex.props(styles.chip, styles.chipClip, i === active && styles.chipOn)}>
                  {i === active && showFill ? (
                    <span
                      key={`${active}-${run}`}
                      aria-hidden="true"
                      data-band-fill=""
                      onAnimationEnd={() => setActive((a) => (a + 1) % views.length)}
                      {...stylex.props(styles.fill, held && styles.fillHeld)}
                    />
                  ) : null}
                  <span {...stylex.props(styles.chipText)}>{view.label}</span>
                </span>
              </button>
            ))}
          </div>
        </VStack>
        <div role="tabpanel" id="band-panel" aria-labelledby={`band-tab-${views[active]!.id}`} {...stylex.props(styles.lines)}>
          {views.map((view, i) => (
            <Heading key={view.id} level={2} aria-hidden={i === active ? undefined : true} xstyle={[styles.line, i === active && styles.lineOn]}>
              {view.line}
            </Heading>
          ))}
        </div>
      </VStack>
      <VisuallyHidden role="status" aria-live="polite">
        {heard}
      </VisuallyHidden>
    </div>
  );
}
