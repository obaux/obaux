'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { isFreshAccount } from './programSetup';

/**
 * Whether a staff Home with nobody on its list draws the example people (D-172:
 * the demo) or its own empty state (D-486). The demo is on for the app, but not
 * for an account that has just signed up (`isFreshAccount`, D-361): that one has
 * nothing yet, and says so. A story can say no too, so the empty state can be
 * looked at in Storybook. Nothing in the app provides the context.
 */
const ExamplePeople = createContext<boolean | null>(null);

export function useExamplePeople(): boolean {
  const override = useContext(ExamplePeople);
  return override ?? (USE_DUMMY_PEOPLE && !isFreshAccount());
}

export function ExamplePeopleProvider({ value, children }: { readonly value: boolean; readonly children: ReactNode }) {
  return <ExamplePeople.Provider value={value}>{children}</ExamplePeople.Provider>;
}
