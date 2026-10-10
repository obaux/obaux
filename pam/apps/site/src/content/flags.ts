/** Switches for what the site may say is live. One line each. */
/**
 * THE ONE LINE TO EDIT when the day-before visit reminder goes live (Piper's trips work, 10 October;
 * Mira: "write the post so that change is a one-line edit, and make that edit the day it lands").
 * Set it to `true` only when the reminder is merged AND the LIVE `dispatch-sms` queues it — check the
 * deployed function and the live database, not the repo (the repo is ahead of what is live). It adds the
 * reminder to the table and takes it out of "does not send yet" and out of the first "did not come" step,
 * and it lets the home page's "Keep going" card say Pam texts a reminder before a visit.
 */
export const VISIT_REMINDERS_LIVE = false;
