'use client';

import { useSearchParams } from 'next/navigation';
import { ProgramReviewScreen } from '../../screens/ProgramReviewScreen';

/** A program to check in the prototype (D-386), reading `?id=` from the prototype's own address. */
export function PrototypeProgramReview() {
  return <ProgramReviewScreen id={useSearchParams()?.get('id') ?? ''} />;
}
