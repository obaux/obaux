'use client';

import dynamic from 'next/dynamic';

/**
 * The bar and the machinery behind it (a session, the conversations' unread
 * count, a lead's program) kept out of the root layout's chunk, which every
 * route loads, `/help` and `/terms` included (§12; `Providers` makes the same
 * call for `LocaleSync`). It arrives just after the screen does, which a fixed
 * bar at the foot of the page can afford.
 *
 * If its chunk cannot be fetched (a dropped connection) the bar is simply not
 * drawn: the screen above it stays up, rather than the whole page falling over
 * for want of a navigation strip. `languages.spec.ts` blocks every chunk and
 * found this.
 */
export const AppTabBarLazy = dynamic(
  () => import('./AppTabBar').then((mod) => mod.AppTabBar).catch(() => () => null),
  { ssr: false },
);
