'use client';

import { useSearchParams } from 'next/navigation';
import { PolicyScreen } from '../../screens/PoliciesView';

/** One policy in the prototype (D-261), reading `?id=` from the prototype's own address. */
export function PrototypePolicy() {
  return <PolicyScreen id={useSearchParams()?.get('id') ?? null} />;
}
