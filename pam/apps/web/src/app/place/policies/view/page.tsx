'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MemberPolicyScreen, placeNameFor } from '../../../../screens/MemberPoliciesView';

/** One policy: read it, then sign (D-270). */
function Policy() {
  const params = useSearchParams();
  const place = params.get('place') ?? '';
  return (
    <MemberPolicyScreen
      // A different policy is a different screen.
      key={params.get('id') ?? ''}
      placeId={place}
      placeName={placeNameFor(place, params.get('name'))}
      policyId={params.get('id')}
      via={params.get('via')}
      serviceId={params.get('service')}
    />
  );
}

export default function PlacePolicyPage() {
  return (
    <Suspense fallback={null}>
      <Policy />
    </Suspense>
  );
}
