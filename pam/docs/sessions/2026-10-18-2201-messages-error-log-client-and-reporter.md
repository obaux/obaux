# 2026-10-18 — messages error log client and reporter

**Branch:** `claude/messages-app-errors` · **Lane:** Messages & notifications

## What changed

D-616, the error log, my part, in four commits on `claude/messages-app-errors` (migration `20261018211942`, not live; `app_errors_live` off):
- Database: `app_errors` (nine columns, no free text), closed action list (`@pam/config` `APP_ERROR_ACTIONS`) and code shapes, a deny-all table read only through `app_errors_grouped(p_days)` for super admins, `report_app_error` (switch, rate limit: 10/min per signed-in account, 30/min shared by everyone signed out, 60 service, 200 overall; no per-address key), a bell row per action per hour, 30-day retention from one constant, counters cleared every five minutes.
- App: `lib/reportAppError.ts` (`reportAppError({ action, code }): void`; never throws; waits in memory offline, ten at most; sends only the closed-shape code).
- Edge: `dispatch-sms/reportError.ts`, called when Twilio fails or the function errors (`function.dispatch-sms`).

## What was wrong, and what missed it

My first design hashed the network address for the signed-out rate limit. Mira caught that an md5 of an IPv4 address can be reversed in minutes. Dropped for one shared signed-out cap; a test fails if any counter key starts with `n:`. Lena found the counters could outlive five minutes if nobody reported (only the nightly sweep cleared them); they now have their own five-minute job.

## Decisions made

D-616 (rewritten, in the repo).

## Verified

DB suite passes; mutations: grouped-read guard, counter cleanup, per-address key put back, each fails its check. Web vitest (221) and tsc green; config suite (1,464) green. Reporter test: sending the raw code fails the "error words never leave the phone" check; Edge helper: sending the message as the code fails its check.

## Left undone

Call sites: Dot and Ava wire `reportAppError` into their screens (`messages.*` in `useThread` is mine and not wired yet). Sage's plain names for each action key (`appError.action.<key>`, 18 keys) and the Privacy line before `app_errors_live` goes on. Ava's Problems list. Neither the migration nor the Edge Function is deployed.

## Needs a human

Will signs the Privacy line (Lena, Sage) before the switch is turned on.
