'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BringFriendScreen } from '../../../screens/BringFriendView';
import { placeNameFor } from '../../../screens/MemberPoliciesView';

/** Bring a friend to a program (D-329). */
function Friend() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  return <BringFriendScreen placeId={id} placeName={placeNameFor(id, params.get('name'))} category={params.get('cat')} />;
}

export default function PlaceFriendPage() {
  return (
    <Suspense fallback={null}>
      <Friend />
    </Suspense>
  );
}
