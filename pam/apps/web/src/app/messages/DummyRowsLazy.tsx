'use client';

import dynamic from 'next/dynamic';

/**
 * `DummyConversations` and `DummyStartable`, fetched only when a preview or a
 * genuinely empty real list actually needs them. Same reasoning as
 * `SavedStripLazy` and `HomePeoplePreviewLazy`: this pulls in
 * `@pam/config/dummy-conversations`, which almost nobody hitting this route
 * with a real, populated conversation list needs to download.
 *
 * `ssr: false` because whether either renders depends on client-only state
 * (`useSession`, `useConversations`, `useRoleView`) that does not exist on
 * the server.
 */
export const DummyConversationsLazy = dynamic(
  () => import('./DummyRows').then((mod) => mod.DummyConversations),
  { ssr: false },
);

export const DummyStartableLazy = dynamic(
  () => import('./DummyRows').then((mod) => mod.DummyStartable),
  { ssr: false },
);
