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
 * The import names the component's own module rather than the package, and
 * that is the whole trick: `import('@pam/ui')` pulls the barrel, which imports
 * every component in it, so the "lazy" chunk contained the entire library and
 * webpack hoisted the shared parts back into the first load anyway. Measured:
 * the split did nothing at all until the path changed.
 *
 * `ssr: false` because the strip only ever renders from data the browser
 * fetches after sign-in, so there is nothing for the server to render.
 */
export const SavedStripLazy = dynamic(
  () => import('@pam/ui/SavedStrip').then((mod) => mod.SavedStrip),
  { ssr: false },
);
