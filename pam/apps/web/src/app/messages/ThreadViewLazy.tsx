'use client';

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
