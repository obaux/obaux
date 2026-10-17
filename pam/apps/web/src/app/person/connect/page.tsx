'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePersonName } from '@/lib/usePersonName';
import { useExamplesOn } from '@/lib/useExamplesOn';
import { useSession } from '@/lib/useSession';
import { ConnectView } from '../../../screens/ConnectView';

/**
 * Connect a member to a program (D-231), from their page. The name comes
 * from the example cast, or from the case manager's own caseload list —
 * nothing about a real member is fetched that the caseload does not show.
 *
 * Only for examples (D-509): a recommendation is not stored or sent yet, so a
 * real account opening this address goes back to the person's page instead of
 * being told something was recommended. When recommending is built, this and
 * the row on the person's page come back for real accounts.
 */
function Connect() {
  const id = useSearchParams().get('id') ?? '';
  const name = usePersonName(id);
  const examples = useExamplesOn();
  const router = useRouter();
  const { state: session } = useSession();
  // A demo account is only known once the session settles; wait for it.
  const settled = session.status !== 'loading';

  useEffect(() => {
    if (settled && !examples) router.replace(`/person/?id=${encodeURIComponent(id)}`);
  }, [settled, examples, id, router]);

  if (!examples) return null;
  return <ConnectView personId={id} name={name} />;
}

export default function ConnectPage() {
  return (
    <Suspense fallback={null}>
      <Connect />
    </Suspense>
  );
}
