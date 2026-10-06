'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ServiceView } from '../../../screens/ServiceView';

/** One of a program's services, for a member (D-313). */
function Service() {
  const params = useSearchParams();
  return <ServiceView placeId={params.get('place') ?? ''} serviceId={params.get('id') ?? ''} />;
}

export default function ServicePage() {
  return (
    <Suspense fallback={null}>
      <Service />
    </Suspense>
  );
}
