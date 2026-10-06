'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ServiceEditView } from '../../../screens/ServiceEditView';

/** A program lead adds or edits one of their services (D-313). */
function Service() {
  const params = useSearchParams();
  const id = params.get('id');
  return <ServiceEditView key={id ?? 'new'} serviceId={id} />;
}

export default function ProgramServicePage() {
  return (
    <Suspense fallback={null}>
      <Service />
    </Suspense>
  );
}
