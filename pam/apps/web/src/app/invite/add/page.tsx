'use client';

import { useEffect, useState } from 'react';
import { InviteAddScreen } from '../../../screens/InviteAddScreen';

/** A program invite a member can add to their account (D-374). */
export default function InviteAddPage() {
  const [params, setParams] = useState<{ code: string; from: string | null } | null>(null);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setParams({ code: query.get('code')?.trim() ?? '', from: query.get('from')?.trim() || null });
  }, []);
  return params ? <InviteAddScreen code={params.code} from={params.from} /> : null;
}
