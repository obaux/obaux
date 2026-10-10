# 2026-10-10 — add program link and preview

**Branch:** `claude/places-programs-add-program-link` · **Lane:** Places & programs (Piper)

## What changed

Will's ask via Mira (19:19): a social image with the logo and "Add your program" for the approval text, the proper link. (1) `public/og/add-program.jpg` (1200×630, invite look, city picture, white wordmark, "Add your program"), made by `scripts/og-add-program.mjs`, listed in `stories/foundations/imagery.ts`. (2) `/programs/new/` layout with title, description, og:image and twitter:image absolute from APP_URL. (3) Migration `20261010192105`, create or replace `review_staff_request` (same signature): the approval text's {link} is `<app_url>/programs/new/` for a program lead with no program yet (none in the request, none on the account — existing members too), the bare app_url otherwise; a trailing slash on app_url is not doubled. (4) `/programs/new/` is behind `TabGate`: signed out → Sign in → Home (its getting-started card is the same step).

## What was wrong, and what missed it

A cold signed-out visit to /programs/new/ showed the example form, which saves nothing — nothing had been routed to it from outside the app before.

## Decisions made

D-496.

## Verified

Whole database suite passes (new test 51: no-program lead, existing member with none, lead with a program, case manager, trailing slash). Config 1067 (new test: the approved text fits one message in all seven languages with the 37-character link), web 93, ui 117, tsc, e2e add-program-link (new, 2), program-resend and a11y on three phones. The built page's HTML carries the absolute og:image.

## Left undone

Sign in does not remember where a cold link was going, so the person lands on Home. No Spanish picture.

## Needs a human

Mira: apply `20261010192105`. Screens: none (no screen changes; /programs/new/ gains a sign-in gate).
