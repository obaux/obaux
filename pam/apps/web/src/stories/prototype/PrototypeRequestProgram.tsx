'use client';

import { useSearchParams } from 'next/navigation';
import { RequestProgramScreen } from '../../screens/RequestProgramScreen';

/** A requested program in the prototype (D-262), reading `?id=` from the prototype's own address. */
export function PrototypeRequestProgram() {
  return <RequestProgramScreen userId={useSearchParams()?.get('id') ?? null} />;
}
