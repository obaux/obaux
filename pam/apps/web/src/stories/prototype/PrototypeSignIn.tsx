'use client';

import { SignInScreen } from '../../app/signin/SignInScreen';
import { navigate } from '../../lib/navigate';

/**
 * Sign in, in the prototype (D-248, Will, 3 October): the real screen, with a
 * phone already filled in and a stand-in flow — pressing "Send me a code"
 * goes straight to Home as the story's role, so each role's prototype can
 * start at Sign in without a code to type. Storybook only; nothing is sent.
 */
const flow = {
  state: { step: 'phone' } as const,
  sendCode: async () => {
    navigate('/');
  },
  verifyCode: async () => {},
  startOver: () => {},
  resendIn: 0,
};

export function PrototypeSignIn() {
  return <SignInScreen preview={{ flow, phone: '(215) 555-0100' }} />;
}
