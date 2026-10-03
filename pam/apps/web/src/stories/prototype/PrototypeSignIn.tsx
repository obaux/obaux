'use client';

import { useSearchParams } from 'next/navigation';
import { SignInScreen } from '../../app/signin/SignInScreen';
import { navigate } from '../../lib/navigate';

/**
 * Sign in, in the prototype (D-248, D-249): the real screen, with a phone
 * already filled in and a stand-in flow. Each role's prototype starts here.
 * With a `kind` (member, provider, admin), "Send me a code" carries on into
 * that person's whole onboarding (`PrototypeJoin`), which ends at Home; with
 * none — a super admin, who is never onboarded through the app — it goes
 * straight Home. Storybook only; nothing is sent.
 */
export function PrototypeSignIn() {
  const params = useSearchParams();
  const kind = params?.get('kind');
  const flow = {
    state: { step: 'phone' } as const,
    sendCode: async () => {
      navigate(kind ? `/prototype/join/?kind=${encodeURIComponent(kind)}` : '/');
    },
    verifyCode: async () => {},
    startOver: () => {},
    resendIn: 0,
  };
  return <SignInScreen preview={{ flow, phone: '(215) 555-0100' }} />;
}
