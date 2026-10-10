'use client';

import dynamic from 'next/dynamic';

/**
 * The bar and the machinery behind it (a session, the conversations' unread
 * count, a lead's program) kept out of the root layout's chunk, which every
 * route loads, `/help` and `/terms` included (§12; `Providers` makes the same
 * call for `LocaleSync`). It arrives just after the screen does, which a fixed
 * bar at the foot of the page can afford.
 */
export const AppTabBarLazy = dynamic(() => import('./AppTabBar').then((mod) => mod.AppTabBar), {
  ssr: false,
});
