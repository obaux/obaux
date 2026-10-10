'use client';

import { Suspense } from 'react';
import { MessagesScreen } from '../../screens/MessagesScreen';
import { TabGate } from '../TabGate';

/** Messages (D-213): the account's real conversations, on the tab-screen frame; a conversation opens at `/messages/thread/`. */
export default function MessagesPage() {
  return (
    <TabGate>
      <Suspense fallback={null}>
        <MessagesScreen />
      </Suspense>
    </TabGate>
  );
}
