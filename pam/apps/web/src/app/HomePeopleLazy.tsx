'use client';

import dynamic from 'next/dynamic';

/**
 * The real people strip, fetched only for a signed-in case manager or
 * program admin. Same reasoning as `UnreadMessagesLazy`: it carries
 * `useConversations` and two more queries, and Home is what §12's budget
 * is measured on. While it loads, Home shows the Messages tile with no
 * count, exactly as before.
 */
export const HomePeopleLazy = dynamic(() => import('./HomePeople').then((mod) => mod.HomePeople), {
  ssr: false,
});
