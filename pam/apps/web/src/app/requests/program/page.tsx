'use client';

import { useEffect, useState } from 'react';
import { RequestProgramScreen } from '../../../screens/RequestProgramScreen';

/** The program a pending program lead described, for the super admin (D-262). */
export default function RequestProgramPage() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    setId(new URLSearchParams(window.location.search).get('id'));
  }, []);
  return <RequestProgramScreen userId={id} />;
}
