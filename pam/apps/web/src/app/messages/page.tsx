'use client';

import { Suspense } from 'react';
import { MessagesScreen } from '../../screens/MessagesScreen';
import { TabGate } from '../TabGate';

/**
 * Messages (D-213): the account's real conversations, on the tab-screen frame; a conversation opens at
 * `/messages/thread/`. Everybody gets the same screen; a case manager or super admin also gets the
 * "Conversations | Reported" switch inside it (D-464).
 */
export default function MessagesPage() {
  return (
    <TabGate>
      <Suspense fallback={null}>
        <MessagesScreen />
      </Suspense>
    </TabGate>
  );
}
