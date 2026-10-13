# D-519 — alerts follow texts_live; two texts lose the phone number

**Date:** 2026-10-11 · **Branch:** `claude/messages-honest-alerts-and-texts`

**Asked by the merge desk** (Lena's promise check, 11 October) and **signed by Will, a59, 11 October 2026**: the new English of the two texts and the HELP reply.

## Decisions

1. **Text alerts screen.** No switch is live while the server's `app_settings.texts_live` is not 'on' (D-481). The closed-place switch used to be live regardless, but the server holds that text, so it promised something that did not happen. The screen reads the setting when it opens (`lib/useTextsLive.ts`; `app_settings` is readable by everyone, so no migration), so it comes on without a deploy. Unknown counts as off. `ALERT_TEXTS_LIVE` still gates the other four, which need `claude/messages-reply-start`.
2. **Two account texts without Pam's number (A28: Pam has no phone line).** `staff_request_denied` and `access_limited_notice` now end "Questions? Visit joinpam.org/support". Spanish carries the English and the five later languages are left out (so they get English) until Lena's translations arrive. The queue still passes `supportPhone` in `vars`; the templates ignore it, so no migration was needed to stop using it.
3. **Not deployed.** Live `dispatch-sms` is version 23 and keeps saying "Call" until the refiling (Mira's decision (a)). Order: refile → approval → deploy → `texts_live` on. Account texts go out whatever `texts_live` says.

## What a later session might reverse

Reading `texts_live` per screen could become one shared read if other screens need it.
