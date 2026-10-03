'use client';

import { useState } from 'react';
import type { PhoneSignIn, SignInStep } from './usePhoneSignIn';

/**
 * A stand-in for `usePhoneSignIn` in the Storybook prototype (D-249): the
 * same steps — phone, code, done — with nothing sent and any code accepted,
 * so an onboarding preview walks through every screen a real person would.
 * Never used by the real routes.
 */
export function usePreviewSignIn(initial: SignInStep = { step: 'phone' }): PhoneSignIn {
  const [state, setState] = useState<SignInStep>(initial);
  return {
    state,
    sendCode: async (phone: string) => setState({ step: 'code', phone }),
    verifyCode: async () => setState({ step: 'done' }),
    startOver: () => setState({ step: 'phone' }),
    resendIn: 0,
  };
}
