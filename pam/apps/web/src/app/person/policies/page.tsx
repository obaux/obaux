'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DUMMY_ANYONE } from '@pam/config/dummy-people';
import { PersonPoliciesView } from '../../../screens/PersonPoliciesView';

/** Which of the program's policies a member has signed (D-324). */
function PersonPolicies() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const name = params.get('name') ?? DUMMY_ANYONE.find((p) => p.id === id)?.firstName ?? '';
  return <PersonPoliciesView personId={id} firstName={name} />;
}

export default function PersonPoliciesPage() {
  return (
    <Suspense fallback={null}>
      <PersonPolicies />
    </Suspense>
  );
}
