'use client';

import { useSearchParams } from 'next/navigation';
import { SignInScreen } from '../../app/signin/SignInScreen';
import { readAudience, readInvite } from '../../lib/appUrl';
import { usePreviewSignIn } from '../../lib/usePreviewSignIn';
import { navigate } from '../../lib/navigate';

/**
 * Sign in, in the prototype (D-248, D-253, D-254): the real screen with a
 * stand-in flow. "Send me a code" shows the code step (any code works,
 * nothing is sent); its button goes Home as the story's role.
 *
 * With `?invite=…&as=…` it is the invite link's Sign in — the black line,
 * the slides for that role — which is how a case manager and a program
 * arrive (D-254). With `next=join` as well (the Onboarding stories), the code
 * leads into joining instead of Home, as it does for somebody new.
 */
export function PrototypeSignIn() {
  const params = useSearchParams();
  const invite = readInvite(params);
  const intoJoin = params?.get('next') === 'join';
  const stand = usePreviewSignIn();
  const flow = {
    ...stand,
    verifyCode: async () => {
      navigate(
        intoJoin && invite
          ? `/prototype/join/?kind=${invite.role}&invite=${encodeURIComponent(invite.code)}`
          : '/',
      );
    },
  };
  return (
    <SignInScreen
      preview={{ flow, phone: '(215) 555-0100', code: '123456' }}
      invite={invite}
      audience={readAudience(params)}
    />
  );
}
