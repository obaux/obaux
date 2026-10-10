'use client';

import { useEffect, useState } from 'react';
import { InviteNewView } from '../../../screens/InviteNewView';

/** One invite, for one person (D-442): `?role=member|provider|admin`. */
export default function InviteNewPage() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    setRole(new URLSearchParams(window.location.search).get('role') ?? '');
  }, []);
  return <InviteNewView role={role} />;
}
