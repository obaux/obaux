'use client';

import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Carousel } from '@astryxdesign/core/Carousel';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * What PAM is, before somebody has any reason to care.
 *
 * Three slides, one idea each, above the sign-in card. Somebody arriving here
 * has been handed a link by a case manager and has no idea what they are about
 * to type their phone number into — and the answer has to land in the seconds
 * before they decide it is not worth it.
 *
 * One point per slide, because two points per slide is a paragraph. The picture
 * carries the drama and the line carries the meaning; neither is decoration for
 * the other.
 *
 * It takes half the screen, which is what makes it read as an onboarding
 * slideshow rather than an icon somebody left above a form (Will, 13
 * September). "Half" is bounded, not literal: the sign-in card below it carries
 * the sentence about text messages that US carriers require to be on screen
 * before a number is typed, so the picture gives way on a short phone rather
 * than pushing that sentence under the fold.
 *
 * No card, no border: the slides sit on the page itself so the card below is
 * unmistakably the thing to act on. One primary action per screen (§2.5), and
 * nothing up here competes with it.
 *
 * Dots under the slides, and no arrows. A carousel that looks like a single
 * picture is a carousel nobody swipes, so something has to say there are three
 * — but arrows are controls, and this screen's whole job is to have one. The
 * first attempt let the next slide peek in at the edge instead, which on a
 * 390px phone cut a sentence mid-word and read as a rendering fault rather than
 * an invitation.
 *
 * The dots are a picture of where you are, not a way to move: they are hidden
 * from assistive technology, because the carousel already announces "slide 2 of
 * 3" and a row of buttons repeating that is noise to somebody who cannot see
 * it. Nothing here is the only route to anything — every slide's words are in
 * the page whether or not anybody swipes.
 */

export interface OnboardingSlide {
  readonly id: string;
  /**
   * Artwork for the slide, as a URL. Decorative: it is hidden from assistive
   * technology and the line below carries the meaning, so nothing is lost if it
   * never loads.
   */
  readonly image: string;
  /** One sentence, plain language. */
  readonly text: string;
}

export interface OnboardingSlidesProps {
  readonly slides: readonly OnboardingSlide[];
  /** Names the region for a screen reader, e.g. "How PAM works". */
  readonly label: string;
}

const styles = stylex.create({
  region: {
    width: '100%',
    // Named as a container so a slide can be sized against it. The carousel
    // wraps every child in a flex item of its own with no width, so a slide
    // asking for 100% is asking its own content how wide it is — and a
    // sentence answers "as wide as one line", which is how the first build ran
    // a slide off the side of the phone. `cqw` measures the region instead,
    // which is the phone minus the page's own padding.
    containerType: 'inline-size',
  },
  slide: {
    // One slide per screen, snapping, so a swipe lands on a whole idea rather
    // than half of two.
    width: '100cqw',
    flexShrink: 0,
    // 24px each side. A line of text running to the edge of a phone is harder
    // to read and looks like an accident; the card below it is inset by the
    // same amount, so the two now line up.
    paddingInline: spacingVars['--spacing-6'],
    paddingBlock: spacingVars['--spacing-1'],
    textAlign: 'center',
  },
  art: {
    /*
     * Half the screen, with a floor and a ceiling.
     *
     * The picture plus its line and the dots comes to a little under half the
     * window, which is the proportion that makes this read as onboarding. The
     * third term is the one that matters and is measured, not guessed: the
     * mark, the line, the dots and the sign-in card down to the last word of
     * the consent sentence occupy 536px at the narrowest supported width,
     * where the text wraps hardest — and that sentence has to be on screen
     * without scrolling, because US carriers require it there before a number
     * is typed. So on a tall phone the picture takes its 26vh, and on a 640px
     * one it gives way instead of pushing the sentence under the fold.
     */
    height: 'clamp(96px, 26vh, calc(100vh - 536px))',
    // Centred on the slide and capped, so the artwork stays a picture on a
    // wide screen instead of stretching into a banner.
    width: '100%',
    maxWidth: '280px',
    marginInline: 'auto',
    objectFit: 'contain',
    display: 'block',
  },
  line: {
    fontSize: '18px',
    lineHeight: 1.45,
    minHeight: '52px',
    // 24px of air under the words, before the dots and the card below them.
    paddingBlockEnd: spacingVars['--spacing-6'],
    /*
     * Narrower than the slide it sits in, and centred (Will, 16 September:
     * "reduce it, so we have more balance, bring in more into 2nd line to
     * avoid any widows"). At the full slide width a short sentence wraps to a
     * long first line and a one- or two-word second line — the classic
     * widow. Matching the artwork's own 280px cap wraps every current slide
     * to two lines of comparable length instead. `textWrap: balance` is the
     * actual fix where a browser supports it — it asks the layout engine to
     * even the lines out for whatever text ends up here, rather than this
     * component guessing a width against three sentences that will not stay
     * these three sentences — and degrades to ordinary wrapping, against the
     * same 280px cap, where it is not supported (§12's low-end Android 9
     * target predates it).
     */
    maxWidth: '280px',
    marginInline: 'auto',
    textWrap: 'balance',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'currentColor',
    opacity: 0.25,
    // Colour is inherited, so the dots follow the text and stay legible in both
    // themes without either one being named here.
    transitionProperty: 'opacity',
    transitionDuration: '150ms',
  },
  here: { opacity: 1, backgroundColor: colorVars['--color-accent'] },
});

export function OnboardingSlides({ slides, label }: OnboardingSlidesProps) {
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
      <Carousel gap={0} hasSnap hasButtons={false} hasEdgeFade={false}>
        {slides.map((slide, index) => (
          <div key={slide.id} data-slide={index} {...stylex.props(styles.slide)}>
            <VStack gap={2} align="center">
              {/*
                `alt=""` and aria-hidden together: the artwork says nothing the
                line does not, and a screen reader announcing a filename or a
                second description of the same idea is noise.
              */}
              <img src={slide.image} alt="" aria-hidden="true" {...stylex.props(styles.art)} />
              <Text xstyle={styles.line}>{slide.text}</Text>
            </VStack>
          </div>
        ))}
      </Carousel>

      <HStack gap={1} justify="center" align="center" aria-hidden="true">
        {slides.map((slide, index) => (
          <span
            key={slide.id}
            {...stylex.props(styles.dot, index === here && styles.here)}
          />
        ))}
      </HStack>
    </section>
  );
}
