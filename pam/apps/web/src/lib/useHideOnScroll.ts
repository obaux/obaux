'use client';

import { useEffect, useState } from 'react';

/**
 * True while the person is scrolling down the page and past `threshold`;
 * false again the moment they scroll up, or are near the top (D-222, Will,
 * 2 October: Explore's search "hides scrolling down … if they scroll up they
 * see the search"). Small moves are ignored, so a resting thumb does not make
 * the bar flicker.
 */
export function useHideOnScroll({ threshold = 120, slack = 8, isDisabled = false } = {}): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (isDisabled) {
      setHidden(false);
      return;
    }
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < threshold) setHidden(false);
      else if (y > last + slack) setHidden(true);
      else if (y < last - slack) setHidden(false);
      else return;
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold, slack, isDisabled]);

  return hidden;
}
