'use client';

import { useSearchParams } from 'next/navigation';
import { InviteNewView } from '../../screens/InviteNewView';

/** One invite in the prototype (D-444), reading `?role=` from the prototype's own address. */
export function PrototypeInviteNew() {
  return <InviteNewView role={useSearchParams()?.get('role') ?? ''} />;
}
