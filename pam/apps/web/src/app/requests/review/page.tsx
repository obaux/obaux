'use client';

import { useEffect, useState } from 'react';
import { RequestReviewScreen } from '../../../screens/RequestReviewScreen';

/** One request to be staff, for the super admin to approve or deny (D-444). */
export default function RequestReviewPage() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    setId(new URLSearchParams(window.location.search).get('id') ?? '');
  }, []);
  return <RequestReviewScreen userId={id} />;
}
