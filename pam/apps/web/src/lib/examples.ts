import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';

/**
 * Example people, conversations, alerts and offers are for pretending, never for a real account
 * (Will, 11 October 2026: "a real account sees only its real things, never examples").
 *
 * They show in exactly two places:
 *   - Storybook's clickable prototype, which answers every Supabase call itself (`mockSupabase`
 *     marks `window` once it does), and the Sign in / About Pam previews; and
 *   - an account a super admin has put in the demo view (`profiles.is_demo`, 0057), which is a
 *     pretend account by its owner's choice.
 *
 * Everything else — a member, a case manager, a program lead, a super admin, previewing a role or
 * not — sees what is really there and, when nothing is, a short empty state. A screen asks
 * `useExamplesOn()` (`useExamplesOn.ts`); a plain function that cannot use a hook asks `examplesOn()`, which reads the
 * same answer (the session records whether the account is a demo one the moment it is known).
 */
let demoAccount = false;

/** Called by the session when it learns whether the signed-in account is a demo one. */
export function setDemoAccount(isDemo: boolean): void {
  demoAccount = isDemo;
}

/** Storybook's prototype: whoever is signed in there is pretending. */
export function isPrototype(): boolean {
  return typeof window !== 'undefined' && (window as { __pamRealFetch?: unknown }).__pamRealFetch !== undefined;
}

/** Whether example data may be shown to whoever is looking right now. */
export function examplesOn(): boolean {
  return USE_DUMMY_PEOPLE && (isPrototype() || demoAccount);
}
