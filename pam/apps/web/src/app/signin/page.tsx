'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { readInvite } from '@/lib/appUrl';
import { SignInScreen } from './SignInScreen';

/**
 * Sign in (the screen itself lives in `SignInScreen`, D-248). An invite link
 * (`?invite=…&as=…`, D-254) is read inside a Suspense boundary so the page
 * stays static: it renders as plain Sign in, then gains the invite line.
 */
function SignInFromLink() {
  return <SignInScreen invite={readInvite(useSearchParams())} />;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInScreen />}>
      <SignInFromLink />
    </Suspense>
  );
}
