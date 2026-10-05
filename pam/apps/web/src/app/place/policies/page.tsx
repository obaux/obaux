'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MemberPoliciesScreen, placeNameFor } from '../../../screens/MemberPoliciesView';

/** A program's policies, for a member to read and sign (D-270). */
function Policies() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  return <MemberPoliciesScreen placeId={id} placeName={placeNameFor(id, params.get('name'))} />;
}

export default function PlacePoliciesPage() {
  return (
    <Suspense fallback={null}>
      <Policies />
    </Suspense>
  );
}
