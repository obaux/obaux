'use client';

import { useEffect, useState } from 'react';
import { ProgramReviewScreen } from '../../../../screens/ProgramReviewScreen';

/** One program to check, for the super admin to approve, ask for changes to, or discard. */
export default function ProgramReviewPage() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    setId(new URLSearchParams(window.location.search).get('id') ?? '');
  }, []);
  return <ProgramReviewScreen id={id} />;
}
