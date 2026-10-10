'use client';

import { Suspense } from 'react';
import { MessagesScreen } from '../../screens/MessagesScreen';
import { useSession } from '@/lib/useSession';
import { TabGate } from '../TabGate';
import { LegacyMessagesPage } from './LegacyMessagesPage';

/**
 * Messages (D-213): the account's real conversations, on the tab-screen frame; a conversation opens at
 * `/messages/thread/`.
 *
 * Case managers and super admins still get the old page (`LegacyMessagesPage`): it has the "Reported"
 * section, which `MessagesScreen` does not (D-456). Everybody else gets the redesigned screen.
 */
export default function MessagesPage() {
  const { state: session } = useSession();
  const role = session.status === 'signed-in' ? session.session.role : null;
  if (role === 'admin' || role === 'super_admin') return <LegacyMessagesPage />;
  return (
    <TabGate>
      <Suspense fallback={null}>
        <MessagesScreen />
      </Suspense>
    </TabGate>
  );
}
