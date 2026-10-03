'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePersonName } from '@/lib/usePersonName';
import { SavedByView } from '../../../screens/SavedByView';

/** Programs saved by {name} (D-243), from a member's page. */
function SavedBy() {
  const id = useSearchParams().get('id') ?? '';
  const name = usePersonName(id);
  return <SavedByView personId={id} name={name} />;
}

export default function SavedByPage() {
  return (
    <Suspense fallback={null}>
      <SavedBy />
    </Suspense>
  );
}
