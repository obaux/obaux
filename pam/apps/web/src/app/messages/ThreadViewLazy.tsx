'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

/**
 * `ThreadView`, and with it the whole of `@astryxdesign/core/Chat`, loaded
 * only on the screen that draws a conversation. The Chat family is the
 * largest thing this route touches — a rich composer, dictation, a scrolling
 * log — and nothing on Home or the conversation list needs any of it. Same
 * reasoning as `SavedStripLazy` (D-125): the import names the subpath, not
 * the package barrel, so the chunk holds Chat and not the library.
 */
export const ThreadViewLazy = dynamic(() => import('./ThreadView').then((mod) => mod.ThreadView), {
  ssr: false,
});

/**
 * Fetches the conversation's code ahead of time (Will, 9 October, D-400):
 * the header is in the route itself and `ThreadView` is not, so opening a
 * conversation cold drew the header first and the composer — with its blur
 * and its fade — a moment later. The Messages list calls this once it is
 * idle, so the code is already here by the time a conversation is opened.
 * The example conversation's (`DemoThread`) comes with it.
 */
export function preloadThreadView(): void {
  void import('./ThreadView');
  void import('./DemoThread');
}

/**
 * `preloadThreadView` once the screen is idle — not while it is still
 * drawing its own list — and not at all with Data Saver on: a person
 * saving data pays for the conversation's code only when they open one.
 */
export function usePreloadThreadView(): void {
  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData) return;
    const w = window as Window & {
      requestIdleCallback?: (run: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(preloadThreadView);
      return () => w.cancelIdleCallback?.(id);
    }
    const timer = setTimeout(preloadThreadView, 300);
    return () => clearTimeout(timer);
  }, []);
}

