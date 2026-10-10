/**
 * Whether the four Text alerts switches work (D-478, the merge desk's hold of 10 October 2026).
 *
 * The database side is live and harmless: every switch is off for everyone, and nothing is sent to a
 * person who has not turned one on. But the switches are the only way to turn one on, so while this is
 * `false` each of them says "Coming soon" exactly as it did before, and nothing in the app writes the
 * `alert_*` columns. Pam sends no text before Will says go and the carrier registration is approved —
 * sending ahead of approval is how a campaign gets suspended.
 *
 * **The day:** flip this to `true` in the same change that merges `claude/messages-reply-start` (the
 * runbook at the top of `docs/sms-setup.md`, "The day"). `promises-of-texts.test.ts` fails if it is
 * `true` while the visit reminders are not live, so it is not flipped alone.
 */
export const ALERT_TEXTS_LIVE = false;
