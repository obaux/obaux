'use client';

import dynamic from 'next/dynamic';

/**
 * The saved strip, fetched when there is something to put in it.
 *
 * It is the only thing on the home screen that needs a carousel, and it renders
 * for nobody until they have saved a place — which on a first visit is nobody
 * at all. Loading it with the page spends a new member's first seconds on a
 * component they cannot see, and §12's budget is measured on exactly that first
 * load.
 *
 * `ssr: false` because the strip only ever renders from data the browser
 * fetches after sign-in, so there is nothing for the server to render.
 */
export const SavedStripLazy = dynamic(
  () => import('@pam/ui').then((mod) => mod.SavedStrip),
  { ssr: false },
);
