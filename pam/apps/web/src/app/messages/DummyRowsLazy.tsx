'use client';

import dynamic from 'next/dynamic';

/**
 * The example reports, fetched only when a preview or a
 * genuinely empty real list actually needs them. Same reasoning as
 * `SavedStripLazy`: this pulls in `@pam/config/dummy-conversations` and the
 * example threads, which almost nobody with a real, populated list needs.
 */
export const DummyReportsLazy = dynamic(() => import('./DummyRows').then((mod) => mod.DummyReports), {
  ssr: false,
});
