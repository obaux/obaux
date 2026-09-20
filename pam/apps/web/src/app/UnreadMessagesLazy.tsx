'use client';

import dynamic from 'next/dynamic';

/** `UnreadMessages` and `useConversations` behind it, kept out of Home's first load (D-182). */
export const UnreadMessagesLazy = dynamic(() => import('./UnreadMessages').then((mod) => mod.UnreadMessages), {
  ssr: false,
});
