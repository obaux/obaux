import { DUMMY_TRIPS } from '@pam/config/dummy-trips';

/**
 * When example data is shown (D-509, Will, 11 October 2026: "I haven't signed up
 * to any trips, but it shows I did").
 *
 * A real account sees only what is really theirs: no example trips, no example
 * visits, no example places' policies. The examples stay for the two places they
 * were made for:
 *
 * - **Storybook's clickable prototype**, which answers every Supabase call itself
 *   (`stories/journeys/mockSupabase.ts` marks `window` once it does), where whoever
 *   is signed in is pretending;
 * - **a demo**: a super admin previewing another role (`useViewAs`, which only a
 *   super admin can set), or a tab that asked for them outright
 *   (`sessionStorage['pam.examples'] = '1'`, which the end-to-end tests use).
 *
 * Read in the browser only; on the server (the static export) it is false, and
 * every reader runs after mount.
 */
export function isPrototype(): boolean {
  return typeof window !== 'undefined' && (window as { __pamRealFetch?: unknown }).__pamRealFetch !== undefined;
}

export function showsExamples(): boolean {
  if (typeof window === 'undefined') return false;
  if (isPrototype()) return true;
  try {
    return sessionStorage.getItem('pam.view-as') !== null || sessionStorage.getItem('pam.examples') === '1';
  } catch {
    return false;
  }
}

/** The example trips, or none for a real account. */
export function exampleTrips(): typeof DUMMY_TRIPS {
  return showsExamples() ? DUMMY_TRIPS : [];
}
