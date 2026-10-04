'use client';

import { useEffect, useState } from 'react';
import { readInvite, type Invite } from '@/lib/appUrl';
import { InviteExpiredScreen } from '../../../screens/InviteExpiredScreen';

/** An expired invite link (D-258); the link's own query says which. */
export default function InviteExpiredPage() {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [read, setRead] = useState(false);
  useEffect(() => {
    setInvite(readInvite(new URLSearchParams(window.location.search)));
    setRead(true);
  }, []);
  return read ? <InviteExpiredScreen invite={invite} /> : null;
}
