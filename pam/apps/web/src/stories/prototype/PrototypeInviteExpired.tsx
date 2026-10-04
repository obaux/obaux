'use client';

import { useSearchParams } from 'next/navigation';
import { readInvite } from '../../lib/appUrl';
import { InviteExpiredScreen } from '../../screens/InviteExpiredScreen';

/** The expired-link page in the prototype (D-258), reading the link's query. */
export function PrototypeInviteExpired() {
  return <InviteExpiredScreen invite={readInvite(useSearchParams())} />;
}
