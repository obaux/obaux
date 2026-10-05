'use client';

import { useEffect, useState } from 'react';
import { PolicyScreen } from '../../../../screens/PoliciesView';

/** One policy: Preview and Signed (D-261). */
export default function PolicyPage() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    setId(new URLSearchParams(window.location.search).get('id'));
  }, []);
  return <PolicyScreen id={id} />;
}
