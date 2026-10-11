'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { animate } from 'framer-motion';
import { Carousel, type CarouselHandle } from '@astryxdesign/core/Carousel';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { pam } from './tokens.stylex.js';

/**
 * What Pam is, before somebody has any reason to care.
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
 * `slide.image` takes the commissioned illustration directly — the Figma
 * MCP server's own asset URLs were unreachable from this sandbox (its
 * network policy blocks every request to figma.com), so the three files
 * came from Will via Google Drive instead and were resized/recompressed on
 * the way in (each roughly 600 kB of source art down to 30-70 kB of WebP at
 * 900px wide, well past what a phone hero needs).
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
 *
 * **Autoplays every 6 seconds** (Will, 17 September, 4 seconds; bumped to 6
 * the same day — "an extra 2 seconds of viewing time"), looping back to the
 * first slide after the last — but never for somebody who asked their
 * device for less motion. `prefers-reduced-motion` is the same check
 * `PointsBadge` already makes for its own count-up (§8, §12): unrequested
 * motion that keeps happening on a timer, with no way to stop it, is exactly
 * what that setting exists to turn off, not a nicety to skip only under a
 * spinner. A manual swipe resets the clock rather than fighting it, so a
 * slide somebody is still reading does not get yanked out from under them
 * mid-read.
 *
 * The wrap from the last slide back to the first is a direct `scrollTo(0)`,
 * not `Carousel`'s own `hasLoop`/`scrollNext()` wrap-around (Will, 17
 * September: "loop slides so there's no blank gap" — `hasLoop` scrolled
 * past the end looking for a fourth item that does not exist, showing empty
 * track before correcting itself). There is nothing to wrap around: three
 * real slides already exist at indices 0-2, so "loop" is just "go back to a
 * slide that's already there," the same call a manual dot-tap would make.
 *
 * That `scrollTo` used the browser's own native smooth scroll at first,
 * which reads as a blunt, short snap rather than a real transition (Will,
 * 17 September: "too abrupt... more ease in/out") — the Web platform has no
 * way to hand a native scroll a custom easing curve or duration. Framer
 * Motion's `animate()` drives `scrollLeft` by hand instead, frame by frame,
 * on a real ease-in-out curve — the same shape `motion.tsx`'s own
 * `PAM_MOTION` uses elsewhere in this package. Skipped entirely under
 * reduced motion, same as autoplay itself: the scroll simply jumps.
 *
 * A slide's artwork is preloaded before it is treated as ready, and a
 * `Skeleton` — the same shimmer placeholder the places and people lists
 * already use while they load — fills the frame until then (Will, 17
 * September: "so the layout doesn't jump with slower internet speeds"). The
 * hero's own height never actually depends on the image (it is a CSS
 * background, not an `<img>`, inside a frame sized by `vh`), so nothing here
 * reflows either way — the skeleton is about the image popping in abruptly
 * once it finally arrives, not about layout shift.
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
  /**
   * A flat black wash over the whole picture, 0 to 1, for artwork too light
   * behind the white mark (Will, 3 October, D-253: 0.2 on the first slide).
   */
  readonly scrim?: number;
}

export interface OnboardingSlidesProps {
  readonly slides: readonly OnboardingSlide[];
  /** Names the region for a screen reader, e.g. "How Pam works". */
  readonly label: string;
  /**
   * Rendered over the hero, pinned to its top edge — the mark, a region
   * badge, a locale switcher. The same slot on every slide rather than part
   * of each one, since it names the app, not the idea currently on screen.
   */
  readonly header?: ReactNode;
  /**
   * `hero` (default): full width, flush to the top, words at the foot — Sign
   * in. `inline` (D-259, About Pam): inside the page's margins, rounded
   * corners, shorter, and the words in the middle of the picture.
   */
  readonly variant?: 'hero' | 'inline';
  /**
   * Draw each slide's line over its picture (default). `false` (About Pam,
   * Will 10 October: "only tab and image — it's redundant text"): the
   * picture stands alone, with no wash over it, and the line moves to the
   * slide's accessible name, so nobody loses a word that a screen reader
   * reads. Pass the line through `tPlain` then — it is a name, not drawn text.
   */
  readonly showLines?: boolean;
  /**
   * Names of the pause and play button, passed through `tPlain`: a name, not
   * drawn text. Required, not optional: pictures that move by themselves for
   * more than five seconds need a way to stop them (WCAG 2.2.2, SOP §12), so a
   * caller cannot forget the control by forgetting the words.
   */
  readonly pauseLabel: string;
  readonly playLabel: string;
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
    // No corner radius under `pam['--pam-page-width']` (560px) — the hero runs flush
    // to the top and sides of the screen there, so a rounded corner has
    // nothing to read against. Above it, `Page` itself caps out and centres,
    // so the hero stops reaching the real viewport edges and a square corner
    // is what looks like a mistake instead — cut off sharp against page
    // background visible on both sides (Will, 17 September). Rounded to
    // match the sign-in card's own corners once that's true. `overflow:
    // hidden` stays regardless: it is what keeps a slide's full-bleed
    // background from spilling past the scroll track's own edge, not what
    // the radius was for.
    overflow: 'hidden',
    '@media (min-width: 561px)': {
      borderRadius: '25px',
    },
  },
  slide: {
    width: '100cqw',
    flexShrink: 0,
    // Roughly half the window (Will, 17 September), which is also the
    // ceiling `consent.spec.ts` sets from the other direction: the card's
    // own content — the field, the button, and the consent sentence
    // carriers review before Pam may send anything — has to fit in
    // whatever's left, unscrolled, on the shortest supported viewport.
    // Verified against that spec at 50vh rather than assumed.
    height: 'clamp(280px, 50vh, 520px)',
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
  skeleton: {
    position: 'absolute',
    inset: 0,
  },
  header: {
    position: 'absolute',
    // The hero now sits flush against the real top of the viewport, so this
    // offset is the only thing keeping the mark and the globe button clear
    // of a phone's own status bar / notch. `env(safe-area-inset-top)` adds
    // whatever room the device's own notch/Dynamic Island actually needs on
    // top of the flat 24px (Will, 17 September: Arc on iOS paints the photo
    // straight under its status bar — since `viewport-fit=cover` is already
    // set in `layout.tsx`, `env()` reports the real inset there — while
    // Chrome keeps its own opaque bar outside the page and never needs the
    // extra room, where `env()` reports 0 and this is just 24px, unchanged).
    top: 'calc(24px + env(safe-area-inset-top, 0px))',
    insetInline: '16px',
    zIndex: 1,
  },
  line: {
    position: 'relative',
    fontSize: '18px',
    fontWeight: 500,
    lineHeight: 1.45,
    color: '#FFFFFF',
    textAlign: 'center',
    textWrap: 'balance',
    maxWidth: '320px',
    marginInline: 'auto',
    // 28px, not the 20px this carried before: the dots sit at a fixed
    // 48px from the hero's own bottom edge (see `dots`, clear of the
    // sign-in card's overlap), and this is what leaves a clean 12px of air
    // between the text's own bottom edge and the top of the dots row
    // rather than the two nearly touching (Will, 17 September).
    paddingBlockEnd: '28px',
  },
  dots: {
    position: 'absolute',
    insetInline: 0,
    // Clear of the sign-in card's own overlap (it rides up 32px over the
    // hero's bottom edge — see signin/page.tsx's `overlapCard`): dots
    // positioned inside that band were sitting under the card, not
    // missing, just covered by an opaque white surface drawn on top of
    // them (Will, 17 September: "the dots are not showing").
    bottom: '48px',
    zIndex: 1,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    opacity: 0.4,
    // A photo has bright patches a plain white dot can vanish into; the
    // same reasoning as the hero's own gradient wash, just for a much
    // smaller shape.
    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45))',
    transitionProperty: 'opacity, width',
    transitionDuration: '150ms',
  },
  here: { opacity: 1, width: '20px', borderRadius: '4px' },
  // The pause/play button (D-501): a dark round button with a lighter rim and a white mark, the
  // photo viewer's own (D-401), 48px so it is a full touch target. Top corner, away from the words
  // (bottom) and the locale switcher (top, other side); the corner follows the reading direction.
  control: {
    position: 'absolute',
    insetInlineStart: '16px',
    top: 'calc(24px + env(safe-area-inset-top, 0px))',
    zIndex: 2,
    width: pam['--pam-touch-target-min'],
    height: pam['--pam-touch-target-min'],
    minWidth: pam['--pam-touch-target-min'],
    borderRadius: '50%',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: pam['--pam-viewer-control-rim'],
    backgroundColor: pam['--pam-viewer-control'],
    color: '#FFFFFF',
  },
  controlInline: { top: '8px', insetInlineStart: '8px' },
  // The inline frame (D-259): in line with the page, rounded, words centred.
  regionInline: { width: '100%', marginInline: 0 },
  trackInline: { borderRadius: '28px' },
  slideInline: {
    height: 'clamp(240px, 40vh, 360px)',
    justifyContent: 'center',
    paddingBlockEnd: 0,
  },
  lineInline: { fontSize: '21px', fontWeight: 600, lineHeight: 1.35, paddingBlockEnd: 0 },
  dotsInline: { bottom: '20px' },
});

/**
 * `background` is a shorthand StyleX cannot express statically once one of
 * its layers is a per-slide URL — the same reason a dynamic `<img src>` is
 * ordinary here and elsewhere in this codebase rather than a token. Kept as
 * one string, verbatim, rather than split into layers: it is easier to tell
 * this still matches what was asked for than to prove two or three separate
 * declarations still compose to it.
 */
function heroBackground(image: string, scrim = 0, isInline = false, hasLine = true): string {
  // Inline with no words on it (About Pam): the picture as it is, no wash.
  if (isInline && !hasLine) return `url(${image}) lightgray 50% / cover no-repeat`;
  // Inline, the words sit in the middle, so the wash is even rather than a
  // gradient to the foot (D-259).
  if (isInline) {
    return `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url(${image}) lightgray 50% / cover no-repeat`;
  }
  // Darker than the stop set first specified (0.50 at 66.12%) — Will, 17
  // September, after the taller hero and some of the brighter photos left
  // the white text and mark reading thin in places. Same two stops, same
  // shape, just a deeper floor.
  const wash = scrim > 0 ? `linear-gradient(rgba(0, 0, 0, ${scrim}), rgba(0, 0, 0, ${scrim})), ` : '';
  return `${wash}linear-gradient(180deg, rgba(0, 0, 0, 0.00) 40.88%, rgba(0, 0, 0, 0.70) 66.12%), url(${image}) lightgray 50% / cover no-repeat`;
}

/** Mirrors `PointsBadge`'s own hook — see that file for why it starts `true`. */
function usePrefersReducedMotion(): boolean {
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

const AUTOPLAY_MS = 6000;
// Astryx's own `Skeleton` doc and `PAM_MOTION` both settle on this shape for
// "something is finishing" — not a fixed guess at how long a photo takes to
// arrive, but a ceiling long enough that a slow connection still gets a
// smoothly-eased scroll rather than a hard jump.
const SCROLL_EASE_MS = 600;

export function OnboardingSlides({ slides, label, header, variant = 'hero', showLines = true, pauseLabel, playLabel }: OnboardingSlidesProps) {
  const isInline = variant === 'inline';
  const region = useRef<HTMLElement>(null);
  const carousel = useRef<CarouselHandle>(null);
  const [here, setHere] = useState(0);
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(new Set());
  const reducedMotion = usePrefersReducedMotion();
  // Stopped by the person (stays stopped until Play), or held while focus is inside, so a
  // keyboard user arriving at the button is not carried to another picture mid-reach.
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const running = !reducedMotion && !paused && !focused;

  /**
   * Preload every slide's artwork up front (there are only three, each
   * already trimmed to 30-70 kB — see the file comment) rather than one at
   * a time as the carousel reaches it, so autoplay never advances into a
   * slide whose image hasn't arrived yet.
   */
  useEffect(() => {
    let cancelled = false;
    const images = slides.map((slide) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        setLoaded((prev) => (prev.has(slide.id) ? prev : new Set(prev).add(slide.id)));
      };
      img.src = slide.image;
      return img;
    });
    return () => {
      cancelled = true;
      for (const img of images) img.onload = null;
    };
  }, [slides]);

  /**
   * The eased scroll `scrollTo`'s own file comment describes — animates
   * `scrollLeft` on the actual scroll container by hand, since the native
   * smooth-scroll the DOM offers has no way to take a custom curve. Finds
   * the container itself (two levels above a slide: `Carousel` wraps every
   * slide in its own APG `group` wrapper, which the actual scroller then
   * wraps) rather than trusting a ref Astryx doesn't expose.
   */
  const scrollToEased = (index: number) => {
    const slideEl = region.current?.querySelector<HTMLElement>(`[data-slide="${index}"]`);
    const scroller = slideEl?.parentElement?.parentElement;
    if (!scroller) {
      carousel.current?.scrollTo(index);
      return;
    }
    // Right to left, slide 0 is at the right edge and `scrollLeft` counts down from 0.
    const sign = getComputedStyle(scroller).direction === 'rtl' ? -1 : 1;
    const target = sign * index * scroller.clientWidth;
    if (reducedMotion) {
      scroller.scrollLeft = target;
      return;
    }
    animate(scroller.scrollLeft, target, {
      duration: SCROLL_EASE_MS / 1000,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (value) => {
        scroller.scrollLeft = value;
      },
    });
  };

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

  /**
   * Advance one slide every 4 seconds, looping past the last back to the
   * first. Restarted whenever `here` changes — including from a manual
   * swipe, via the same observer above — so a slide somebody just moved to
   * gets its own full 4 seconds rather than inheriting whatever was left on
   * the clock. Never runs at all under reduced motion (see the file
   * comment).
   */
  useEffect(() => {
    if (!running || slides.length < 2) return;
    const timer = setInterval(() => {
      scrollToEased((here + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scrollToEased closes over `here`/`reducedMotion`, both already deps
  }, [here, running, slides.length]);

  return (
    <section
      ref={region}
      aria-label={label}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      {...stylex.props(styles.region, isInline && styles.regionInline)}
    >
      {/*
        The name lives on the section, not on the carousel inside it. Both
        carrying it made two regions with the same name, which a screen reader
        reads as two different things to move between.
      */}
      <Carousel
        gap={0}
        hasSnap
        hasButtons={false}
        hasEdgeFade={false}
        handleRef={carousel}
        xstyle={[styles.track, isInline && styles.trackInline]}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            data-slide={index}
            // With the line not drawn, the picture is the slide, and the line
            // is its name; drawn, the line is the slide and the picture is
            // decoration (below).
            role={showLines ? undefined : 'img'}
            aria-label={showLines ? undefined : slide.text}
            {...stylex.props(styles.slide, isInline && styles.slideInline)}
          >
            {/*
              `aria-hidden` here, not `alt=""` on an `<img>`: the artwork is a
              CSS background precisely so the dynamic per-slide URL never has
              to be a StyleX token (see `heroBackground`'s own comment). It
              says nothing the line below does not, so nothing is lost by
              keeping it out of the accessibility tree entirely.
            */}
            {loaded.has(slide.id) ? (
              <div
                aria-hidden="true"
                {...stylex.props(styles.art)}
                style={{ background: heroBackground(slide.image, slide.scrim, isInline, showLines) }}
              />
            ) : (
              <Skeleton width="100%" height="100%" radius="none" xstyle={styles.skeleton} />
            )}
            {showLines ? <Text xstyle={[styles.line, isInline && styles.lineInline]}>{slide.text}</Text> : null}
          </div>
        ))}
      </Carousel>

      {header ? <div {...stylex.props(styles.header)}>{header}</div> : null}

      {/* Only when something moves: with reduced motion the carousel never advances, so there is nothing to stop. */}
      {!reducedMotion && slides.length > 1 ? (
        <IconButton
          label={paused ? playLabel : pauseLabel}
          onClick={() => setPaused((p) => !p)}
          icon={
            paused ? (
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <rect x="6" y="4" width="4.5" height="16" rx="1.2" fill="currentColor" />
                <rect x="13.5" y="4" width="4.5" height="16" rx="1.2" fill="currentColor" />
              </svg>
            )
          }
          xstyle={[styles.control, isInline && styles.controlInline]}
        />
      ) : null}

      <HStack gap={1} justify="center" align="center" aria-hidden="true" xstyle={[styles.dots, isInline && styles.dotsInline]}>
        {slides.map((slide, index) => (
          <span key={slide.id} {...stylex.props(styles.dot, index === here && styles.here)} />
        ))}
      </HStack>
    </section>
  );
}
