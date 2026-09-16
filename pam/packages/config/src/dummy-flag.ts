/**
 * The one switch behind every dummy-data file (`dummy-people.ts`,
 * `dummy-notifications.ts`, `dummy-places.ts`).
 *
 * Split into its own module, deliberately smaller than a single boolean would
 * need to be: `HeaderBell` — on every signed-in screen, including Home, which
 * §12's budget is measured on — only needs this flag and the notifications
 * set, never the people arrays. Importing anything from a shared module pulls
 * the whole module into whichever bundle asks for it first, so the flag lives
 * apart from the data it switches on, the same way `hours.ts` stayed out of
 * `@pam/config`'s own barrel on 16 September for the identical reason.
 *
 * `false` and every screen that reads it falls back to its own real empty
 * state — "Nobody on your list yet", "Nobody of that kind yet" — exactly as
 * it did before any of this existed.
 */
export const USE_DUMMY_PEOPLE = true;
