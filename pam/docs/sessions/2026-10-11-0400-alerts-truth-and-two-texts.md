# 2026-10-11 — alerts truth and two texts

**Branch:** `claude/messages-honest-alerts-and-texts` · **Lane:** Messages & notifications

## What changed

AlertsView reads `texts_live` at run time (`lib/useTextsLive.ts`); none of its switches is live while that is off. The `staff_request_denied` and `access_limited_notice` templates lose `{supportPhone}` for "Visit joinpam.org/support" (English; Spanish carries English until Lena's; later languages fall back). Samples file: no embedded phone numbers, new HELP reply. `before-launch.md`: version 23, the order rule, the HELP console step. D-519.

## What was wrong, and what missed it

The closed-place switch was live in code while the server held its text. I also wrote to Mira that `texts_live` held these two account texts; it does not (migration 20261010141859 exempts account texts). Docs now say so.

## Decisions made

D-519.

## Verified

Config tests twice (1027), alerts e2e, tsc.

## Left undone

Nothing deployed. `access_limited_notice` is not among the registered samples (it never was): Will may want it filed. Spanish and five translations are Lena's. The queue functions still pass `supportPhone` (ignored).

## Needs a human

Mira: confirm the `reviewedBy` lines of the two templates, which I did not touch.
