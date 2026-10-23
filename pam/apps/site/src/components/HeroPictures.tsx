'use client';

import { useSyncExternalStore } from 'react';
import * as stylex from '@stylexjs/stylex';
import { FlipCarousel, type FlipSlide } from './FlipCarousel';

/*
 * The hero's pictures on a desktop only (Will, 23 October: "remove the image carousel from hero on mobile website. Only show on
 * desktop"). Under 900px, where the pictures would sit under the words, nothing is drawn and no picture is asked for: the
 * carousel is not hidden, it is not rendered. The words come first, as they always did.
 *
 * The static page has no pictures (the server cannot know the width); from 900px the carousel mounts as soon as the page
 * wakes. Its place is held from the first paint (the same 4:5 box, up to 440px), so nothing moves when it arrives.
 */
const WIDE = '(min-width: 900px)';

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(WIDE);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const styles = stylex.create({
  place: {
    display: { default: 'none', '@media (min-width: 900px)': 'block' },
    width: '100%',
    maxWidth: '440px',
    marginInline: 'auto',
    aspectRatio: '4 / 5',
  },
});

export function HeroPictures({ slides, label }: { readonly slides: readonly FlipSlide[]; readonly label: string }) {
  const wide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
  return <div {...stylex.props(styles.place)}>{wide ? <FlipCarousel slides={slides} label={label} /> : null}</div>;
}
