'use client';

import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { isPrototype } from './examples';
import { useSession } from './useSession';

/** Whether example data may be shown to whoever is looking (`examples.ts`): a component redraws when the session settles. */
export function useExamplesOn(): boolean {
  const { state } = useSession();
  const isDemo = state.status === 'signed-in' && state.session.isDemo;
  return USE_DUMMY_PEOPLE && (isPrototype() || isDemo);
}
