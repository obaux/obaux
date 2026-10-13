'use client';

import { useEffect, useState } from 'react';
import { NumberChangeReviewScreen } from '../../../screens/NumberChangeReviewScreen';

/** One request to move an account to a new number, for the case manager or super admin who decides it (D-567). */
export default function NumberChangeReviewPage() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    setId(new URLSearchParams(window.location.search).get('id') ?? '');
  }, []);
  return <NumberChangeReviewScreen id={id} />;
}
