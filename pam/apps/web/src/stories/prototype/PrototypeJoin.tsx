'use client';

import { useSearchParams } from 'next/navigation';
import { JoinScreen, type JoinPhase } from '../../app/join/JoinScreen';
import type { JoinKind } from '../../lib/useJoin';

/**
 * Onboarding (D-249, D-253): the whole of creating an account as this kind
 * of person — the phone, the code, your details, (a program lead's program),
 * what Pam shares, texts, and the welcome — then Home as that role. Its own
 * story under Onboarding, apart from each role's Prototype, which only signs
 * in (Will, 3 October). The real join screen with a stand-in phone flow: any
 * code works and nothing is written. Storybook only.
 */
const NAMES: Record<JoinKind, string> = { member: 'Marcus', provider: 'Alice', admin: 'Dana' };

const STEPS: readonly JoinPhase[] = ['details', 'waiting', 'waitingDone', 'privacy', 'texts', 'done'];

export function PrototypeJoin() {
  const params = useSearchParams();
  const raw = params?.get('kind');
  const kind: JoinKind = raw === 'provider' || raw === 'admin' ? raw : 'member';
  // From an invite link's Sign in (D-254): the phone is done, the code known.
  const code = params?.get('invite');
  // A visit booked for them before they joined (D-322).
  const trip = params?.get('trip');
  // One step on its own (D-319). The phone and code are Sign in's (D-359).
  const step = params?.get('step');
  const startAt: JoinPhase | undefined = step && STEPS.includes(step as JoinPhase) ? (step as JoinPhase) : undefined;
  // How What Pam shares is drawn: "icons" or "plain" (D-416).
  const decor = params?.get('decor');
  return (
    <JoinScreen
      preview={{
        kind,
        firstName: NAMES[kind],
        ...(code ? { invite: { code, role: kind, ...(trip ? { trip } : {}) } } : {}),
        ...(startAt ? { startAt } : {}),
        ...(decor ? { decor } : {}),
      }}
    />
  );
}
