# D-496 — the approval text for a new program lead opens Add your program, with its own preview picture

**Date:** 2026-10-10 · **Branch:** `claude/places-programs-add-program-link`

## Decision

Will, 10 October 2026, after his approval text arrived ("Pam: Your request was approved. Open Pam to get started: …") with a plain "Pam" preview: "We'll need a social image with logo, and under 'Add your program' for this. And use the proper link." (The proper link, https://app.joinpam.org, is `app_settings.app_url`, set by the merge desk.)

- **The picture.** `public/og/add-program.jpg`, 1200×630, in the invite picture's look (a carousel picture with a light veil, a soft shade only behind the words, the white wordmark in the centre) with "Add your program" under the logo. English, one picture, like the invite's. It uses the first carousel picture (the city: a program is a place). Made by `scripts/og-add-program.mjs`; listed in `stories/foundations/imagery.ts`.
- **The page.** `/programs/new/` has its own title ("Add your program to Pam"), a one-line description and the picture as og:image and twitter:image, absolute from APP_URL.
- **The link.** `review_staff_request` puts `<app_url>/programs/new/` in the `staff_request_approved` text when it approves a program lead who has no program yet (none in the request, none on the account). A lead whose approval added a program, and a case manager, keep the bare app_url.
- **A cold link.** `/programs/new/` is behind the tab gate: signed out, it goes to Sign in and then Home, whose getting-started card is the same step. It never shows a visitor a form that saves nothing. (Sign in does not carry the page it was asked for, so the person lands on Home, not on the form.)

## What a later session might reverse

Sign in could remember where a cold link was headed and go there after sign-in; today every cold link ends at Home. The picture is English only; a Spanish one is a new file and a per-language choice in the layout.
