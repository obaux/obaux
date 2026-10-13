'use client';

import { useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { HOME } from '../content/home-copy';
import { website } from '../lib/website.stylex';
import { type } from '../lib/website-type.stylex';

/*
 * The deep green card, "Who is Pam for?" (Figma "Callout card" 18:517; Will, 12 October: the names do not go to the help
 * desk, each shows its own view). The three names are tabs: one picture and one line at a time, the others crossfade out.
 *
 * - Tabs pattern: arrows, Home and End move between the names, Tab goes on to the line.
 * - Each name keeps a 48px tap box; the chip drawn inside is the size of the design (34px high on a phone).
 * - All three lines sit in one grid cell, the hidden ones `visibility: hidden`, so the card is as tall as the longest and
 *   does not jump when you switch.
 * - The picture fades in 240ms on the app's easing; none under reduced motion.
 */
const IMAGES: Readonly<Record<string, { src: string; srcSet?: string; width: number; height: number }>> = {
  residents: { src: '/home/philly-1600.webp', srcSet: '/home/philly-900.webp 900w, /home/philly-1600.webp 1600w', width: 2048, height: 1494 },
  providers: { src: '/home/band-providers-630.webp', width: 630, height: 500 },
  managers: { src: '/home/band-managers-630.webp', width: 630, height: 500 },
};

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
  picture: {
    position: 'absolute',
    inset: 0,
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0,
    transitionProperty: { default: 'none', '@media (prefers-reduced-motion: no-preference)': 'opacity' },
    transitionDuration: '240ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
  },
  pictureOn: { opacity: 1 },
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
    transitionProperty: { default: 'none', '@media (prefers-reduced-motion: no-preference)': 'background-color, color, transform' },
    transitionDuration: '125ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
  },
  chipOn: { backgroundColor: website['--website-surface-green'], color: website['--website-text-primary'] },
  arrow: { width: { default: '12px', '@media (min-width: 900px)': '17px' }, height: { default: '12px', '@media (min-width: 900px)': '17px' }, flexShrink: 0 },
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
    transitionProperty: { default: 'none', '@media (prefers-reduced-motion: no-preference)': 'opacity' },
    transitionDuration: '240ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
  },
  lineOn: { visibility: 'visible', opacity: 1 },
});

function Arrow() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false" {...stylex.props(styles.arrow)}>
      <path d="M3 9 9 3M4 3h5v5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BandViews() {
  const views = HOME.band.views;
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const go = (to: number) => {
    const next = (to + views.length) % views.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div data-band="" {...stylex.props(styles.band)}>
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
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                go(active + 1);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                go(active - 1);
              } else if (e.key === 'Home') {
                e.preventDefault();
                go(0);
              } else if (e.key === 'End') {
                e.preventDefault();
                go(views.length - 1);
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
                onClick={() => setActive(i)}
                {...stylex.props(styles.tab)}
              >
                <span {...stylex.props(styles.chip, i === active && styles.chipOn)}>
                  {view.label}
                  <Arrow />
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
    </div>
  );
}
