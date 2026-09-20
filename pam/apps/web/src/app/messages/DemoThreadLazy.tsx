'use client';

import dynamic from 'next/dynamic';

/** `DemoThread` and its example data, loaded only when a preview opens one (D-180). */
export const DemoThreadLazy = dynamic(() => import('./DemoThread').then((mod) => mod.DemoThread), {
  ssr: false,
});
