'use client';

import { SignInScreen } from '../../app/signin/SignInScreen';
import { usePreviewSignIn } from '../../lib/usePreviewSignIn';
import { navigate } from '../../lib/navigate';

/**
 * Sign in, in the prototype (D-248, D-253): the real screen with a stand-in
 * flow. "Send me a code" shows the code step (any code works, nothing is
 * sent), and its button goes Home as the story's role. Signing in only —
 * creating an account is its own story, under Onboarding (D-253).
 * Storybook only.
 */
export function PrototypeSignIn() {
  const stand = usePreviewSignIn();
  const flow = {
    ...stand,
    verifyCode: async () => {
      navigate('/');
    },
  };
  return <SignInScreen preview={{ flow, phone: '(215) 555-0100', code: '123456' }} />;
}
