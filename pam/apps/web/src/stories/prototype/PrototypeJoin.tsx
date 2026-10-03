'use client';

import { useSearchParams } from 'next/navigation';
import { JoinScreen } from '../../app/join/JoinScreen';
import type { JoinKind } from '../../lib/useJoin';

/**
 * Onboarding, in the prototype (D-249, Will, 3 October): after Sign in, the
 * whole of joining as this kind of person — the code, your details, (a
 * program lead's program), what PAM shares, texts, and the welcome — then
 * Home as the story's role. The real join screen with a stand-in phone flow:
 * any code works and nothing is written. Storybook only.
 */
const NAMES: Record<JoinKind, string> = { member: 'Marcus', provider: 'Alice', admin: 'Dana' };

export function PrototypeJoin() {
  const params = useSearchParams();
  const raw = params?.get('kind');
  const kind: JoinKind = raw === 'provider' || raw === 'admin' ? raw : 'member';
  return <JoinScreen preview={{ kind, firstName: NAMES[kind], phone: '(215) 555-0100' }} />;
}
