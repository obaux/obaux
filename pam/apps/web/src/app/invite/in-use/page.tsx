'use client';

import { useEffect, useState } from 'react';
import { InviteInUseScreen } from '../../../screens/InviteInUseScreen';

/** A staff invite for a number already in Pam (D-373); the query says which. */
export default function InviteInUsePage() {
  const [params, setParams] = useState<{ as: 'program' | 'case-manager'; from: string | null } | null>(null);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setParams({
      as: query.get('as') === 'case-manager' ? 'case-manager' : 'program',
      from: query.get('from')?.trim() || null,
    });
  }, []);
  return params ? <InviteInUseScreen as={params.as} from={params.from} /> : null;
}
