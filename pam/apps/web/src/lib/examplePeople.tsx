'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { isFreshAccount } from './programSetup';
import { useExamplesOn } from './useExamplesOn';

/**
 * Whether a staff Home with nobody on its list draws the example people (D-172:
 * the demo) or its own empty state (D-486). The demo is on for Storybook and demo
 * accounts only, never a real one (lib/examples.ts), and not
 * for an account that has just signed up (`isFreshAccount`, D-361): that one has
 * nothing yet, and says so. A story can say no too, so the empty state can be
 * looked at in Storybook. Nothing in the app provides the context.
 */
const ExamplePeople = createContext<boolean | null>(null);

export function useExamplePeople(): boolean {
  const override = useContext(ExamplePeople);
  // Never for a real account (lib/examples.ts): only Storybook and a demo account draw example people.
  const allowed = useExamplesOn();
  return override ?? (allowed && !isFreshAccount());
}

export function ExamplePeopleProvider({ value, children }: { readonly value: boolean; readonly children: ReactNode }) {
  return <ExamplePeople.Provider value={value}>{children}</ExamplePeople.Provider>;
}
