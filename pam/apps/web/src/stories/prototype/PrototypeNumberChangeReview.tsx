'use client';

import { useSearchParams } from 'next/navigation';
import { NumberChangeReviewScreen } from '../../screens/NumberChangeReviewScreen';

/** A request to move an account to a new number, in the prototype (D-567), reading `?id=` from its address. */
export function PrototypeNumberChangeReview() {
  return <NumberChangeReviewScreen id={useSearchParams()?.get('id') ?? ''} />;
}
