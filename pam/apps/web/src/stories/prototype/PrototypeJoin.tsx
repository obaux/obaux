'use client';

import { useSearchParams } from 'next/navigation';
import { JoinScreen } from '../../app/join/JoinScreen';
import type { JoinKind } from '../../lib/useJoin';

/**
 * Onboarding (D-249, D-253): the whole of creating an account as this kind
 * of person — the phone, the code, your details, (a program lead's program),
 * what PAM shares, texts, and the welcome — then Home as that role. Its own
 * story under Onboarding, apart from each role's Prototype, which only signs
 * in (Will, 3 October). The real join screen with a stand-in phone flow: any
 * code works and nothing is written. Storybook only.
 */
const NAMES: Record<JoinKind, string> = { member: 'Marcus', provider: 'Alice', admin: 'Dana' };

export function PrototypeJoin() {
  const params = useSearchParams();
  const raw = params?.get('kind');
  const kind: JoinKind = raw === 'provider' || raw === 'admin' ? raw : 'member';
  return <JoinScreen preview={{ kind, firstName: NAMES[kind] }} />;
}
