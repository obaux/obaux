/**
 * Whether the day-before visit reminder is live (the app's copy of the site's `VISIT_REMINDERS_LIVE`, D-474, `docs/before-launch.md` ›
 * *Visit reminders go live*). It is `false` until the whole path is checked on the LIVE function and database: the trigger that queues the
 * text (`sync_trip_reminder`), the reviewed template, the dispatcher on its clock, and `texts_live`.
 *
 * One flag for the badge as well as the promises: while it is false the kind "A reminder before your trip" says "Coming soon" on the
 * agree screens and on Text alerts even when `texts_live` is on, and the lines that say Pam does not remind you stay true. The day it is
 * flipped, flip `VISIT_REMINDERS_LIVE` in `apps/site/src/content/flags.ts` with it (`promises-of-texts.test.ts` fails if only one moves).
 */
export const VISIT_REMINDERS_LIVE_IN_APP = false;
