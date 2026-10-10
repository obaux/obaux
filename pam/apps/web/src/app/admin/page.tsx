'use client';

import { Suspense } from 'react';
import { InviteView } from '../../screens/InviteView';
import { TabGate } from '../TabGate';

/**
 * The old caseload-and-invites page is Invite someone now (D-218): the
 * caseload is the first tab, and making an invite is this screen. Its old
 * address still opens it.
 */
export default function AdminPage() {
  return (
    <TabGate>
      <Suspense fallback={null}>
        <InviteView />
      </Suspense>
    </TabGate>
  );
}
