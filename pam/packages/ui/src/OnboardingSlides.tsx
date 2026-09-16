'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Carousel } from '@astryxdesign/core/Carousel';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';

/**
 * What PAM is, before somebody has any reason to care.
 *
 * Three slides, one idea each, as a full-bleed hero the sign-in card floats
 * over — replacing an earlier build where each slide was a small icon on a
 * pale card, sitting above the sign-in card rather than behind it (Will, 16
 * September, working from a Figma redesign: a photo-style hero with the mark,
 * a "Philadelphia" badge and the locale switcher laid over it, white text on
 * a dark wash, and the card riding up over the bottom edge). Somebody arriving
 * here has been handed a link by a case manager and has no idea what they are
 * about to type their phone number into — and the answer has to land in the
 * seconds before they decide it is not worth it.
 *
 * **`slide.image` still points at the placeholder icon set, not the
 * commissioned photography the Figma file shows.** Pulling those
 * illustrations in was the ask, and this session could not: the sandbox's
 * network policy refuses every request to figma.com, including the Figma
 * MCP server's own asset URLs, so there was no way to fetch the actual
 * bytes. Once real photography exists, `slide.image` is a straight URL
 * swap — the background treatment below is already built for it.
 *
 * The gradient is the exact stop set Will asked for (16 September): fully
 * transparent through 40.88%, opaque to 50% black by 66.12%, so white text
 * and a white mark stay legible over the bottom third of whatever photo
 * lands there. `lightgray` is the CSS spec's own fallback fill while an
 * image is loading or missing, not a design choice.
 *
 * `header` is a slot rather than a prop for the mark/badge/switcher
 * themselves, the same reasoning `AppHeader`'s own `trailing` slot uses: this
 * component should not know what a locale switcher is, only that something
 * sits over the top-left and top-right corners of the hero.
 *
 * One point per slide, because two points per slide is a paragraph. The line
 * carries the meaning; the art carries the mood.
 *
 * Dots over the image near the bottom, and no arrows — a carousel that looks
 * like a single picture is a carousel nobody swipes, so something has to say
 * there are three, but arrows are controls and this screen's whole job is to
 * have one. They are hidden from assistive technology: the carousel already
 * announces "slide 2 of 3", and a row of buttons repeating that is noise to
 * somebody who cannot see it. Nothing here is the only route to anything —
 * every slide's words are in the page whether or not anybody swipes.
 */

export interface OnboardingSlide {
  readonly id: string;
  /**
   * Artwork for the slide, as a URL. Decorative: it is hidden from assistive
   * technology and the line below carries the meaning, so nothing is lost if
   * it never loads.
   */
  readonly image: string;
  /** One sentence, plain language. */
  readonly text: string;
}

export interface OnboardingSlidesProps {
  readonly slides: readonly OnboardingSlide[];
  /** Names the region for a screen reader, e.g. "How PAM works". */
  readonly label: string;
  /**
   * Rendered over the hero, pinned to its top edge — the mark, a region
   * badge, a locale switcher. The same slot on every slide rather than part
   * of each one, since it names the app, not the idea currently on screen.
   */
  readonly header?: ReactNode;
}

const styles = stylex.create({
  // Full-bleed: the hero runs past the page's own side gutter, the same
  // negative-margin technique `SavedStrip`/`PeopleStrip` use, so the photo
  // reaches both edges of the phone the way it does in the design.
  region: {
    width: 'calc(100% + 32px)',
    marginInline: '-16px',
    containerType: 'inline-size',
    position: 'relative',
  },
  track: {
    // Rounded only at the bottom: the top is the very top of the screen, and
    // rounding a corner nothing else meets would look like a mistake.
    borderBottomLeftRadius: '25px',
    borderBottomRightRadius: '25px',
    overflow: 'hidden',
  },
  slide: {
    width: '100cqw',
    flexShrink: 0,
    // Bounded well short of "about half the window": the consent sentence
    // under the card's button is what carriers review before PAM may send
    // anything (`consent.spec.ts` asserts it stays on screen with no
    // scrolling, on the shortest supported viewport), and the card sits
    // below this hero, not beside it — so the hero's own height is a
    // budget the card's content has to fit under, not a proportion chosen
    // for looks alone.
    height: 'clamp(220px, 38vh, 420px)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    paddingInline: '24px',
    paddingBlockEnd: '40px',
  },
  art: {
    position: 'absolute',
    inset: 0,
  },
  header: {
    position: 'absolute',
    top: '16px',
    insetInline: '16px',
    zIndex: 1,
  },
  line: {
    position: 'relative',
    fontSize: '18px',
    lineHeight: 1.45,
    color: '#FFFFFF',
    textAlign: 'center',
    textWrap: 'balance',
    maxWidth: '320px',
    marginInline: 'auto',
    paddingBlockEnd: '20px',
  },
  dots: {
    position: 'absolute',
    insetInline: 0,
    bottom: '24px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    opacity: 0.4,
    transitionProperty: 'opacity, width',
    transitionDuration: '150ms',
  },
  here: { opacity: 1, width: '20px', borderRadius: '4px' },
});

/**
 * `background` is a shorthand StyleX cannot express statically once one of
 * its layers is a per-slide URL — the same reason a dynamic `<img src>` is
 * ordinary here and elsewhere in this codebase rather than a token. Kept as
 * one string, verbatim, rather than split into layers: it is easier to tell
 * this still matches what was asked for than to prove two or three separate
 * declarations still compose to it.
 */
function heroBackground(image: string): string {
  return `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 40.88%, rgba(0, 0, 0, 0.50) 66.12%), url(${image}) lightgray 50% / cover no-repeat`;
}

export function OnboardingSlides({ slides, label, header }: OnboardingSlidesProps) {
  const region = useRef<HTMLElement>(null);
  const [here, setHere] = useState(0);

  /**
   * Which slide is being looked at.
   *
   * Read from the slides themselves rather than from the carousel's scroll
   * position: the scroll container belongs to Astryx and is not ours to reach
   * into, and an observer keeps working if it ever changes how it scrolls.
   */
  useEffect(() => {
    const root = region.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;

    const items = Array.from(root.querySelectorAll('[data-slide]'));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.slide);
          if (!Number.isNaN(index)) setHere(index);
        }
      },
      { threshold: 0.6 },
    );

    for (const item of items) observer.observe(item);
    return () => observer.disconnect();
  }, [slides]);

  return (
    <section ref={region} aria-label={label} {...stylex.props(styles.region)}>
      {/*
        The name lives on the section, not on the carousel inside it. Both
        carrying it made two regions with the same name, which a screen reader
        reads as two different things to move between.
      */}
      <Carousel gap={0} hasSnap hasButtons={false} hasEdgeFade={false} xstyle={styles.track}>
        {slides.map((slide, index) => (
          <div key={slide.id} data-slide={index} {...stylex.props(styles.slide)}>
            {/*
              `aria-hidden` here, not `alt=""` on an `<img>`: the artwork is a
              CSS background precisely so the dynamic per-slide URL never has
              to be a StyleX token (see `heroBackground`'s own comment). It
              says nothing the line below does not, so nothing is lost by
              keeping it out of the accessibility tree entirely.
            */}
            <div
              aria-hidden="true"
              {...stylex.props(styles.art)}
              style={{ background: heroBackground(slide.image) }}
            />
            <Text xstyle={styles.line}>{slide.text}</Text>
          </div>
        ))}
      </Carousel>

      {header ? <div {...stylex.props(styles.header)}>{header}</div> : null}

      <HStack gap={1} justify="center" align="center" aria-hidden="true" xstyle={styles.dots}>
        {slides.map((slide, index) => (
          <span key={slide.id} {...stylex.props(styles.dot, index === here && styles.here)} />
        ))}
      </HStack>
    </section>
  );
}
