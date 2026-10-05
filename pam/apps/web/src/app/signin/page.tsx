'use client';

import { useEffect, useState } from 'react';
import { readAudience, readInvite, type Invite, type InviteRole } from '@/lib/appUrl';
import { SignInScreen } from './SignInScreen';

/**
 * Sign in (the screen itself lives in `SignInScreen`, D-248). An invite link
 * (`?invite=…&as=…`, D-254) is read once the page is running, so the static
 * page is plain Sign in and gains the invite line a moment later — without
 * swapping the screen out, which a Suspense boundary did, and which could
 * drop a number somebody had already started typing.
 */
export default function SignInPage() {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [audience, setAudience] = useState<InviteRole | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInvite(readInvite(params));
    setAudience(readAudience(params));
  }, []);
  return <SignInScreen invite={invite} audience={audience} />;
}
