'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DUMMY_ANYONE } from '@pam/config/dummy-people';
import { recalledPersonName } from '@/lib/personNames';
import { PersonPoliciesView } from '../../../screens/PersonPoliciesView';

/** Which of the program's policies a member has signed (D-324). */
function PersonPolicies() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  // The name is not in the address (D-536): the person's page left it in this tab.
  const [recalled, setRecalled] = useState<string | null>(null);
  useEffect(() => setRecalled(recalledPersonName(id)), [id]);
  const name = DUMMY_ANYONE.find((p) => p.id === id)?.firstName ?? recalled ?? '';
  return <PersonPoliciesView personId={id} firstName={name} />;
}

export default function PersonPoliciesPage() {
  return (
    <Suspense fallback={null}>
      <PersonPolicies />
    </Suspense>
  );
}
