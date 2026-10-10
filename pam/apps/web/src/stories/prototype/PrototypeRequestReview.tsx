'use client';

import { useSearchParams } from 'next/navigation';
import { RequestReviewScreen } from '../../screens/RequestReviewScreen';

/** A request to review in the prototype (D-444), reading `?id=` from the prototype's own address. */
export function PrototypeRequestReview() {
  return <RequestReviewScreen userId={useSearchParams()?.get('id') ?? ''} />;
}
