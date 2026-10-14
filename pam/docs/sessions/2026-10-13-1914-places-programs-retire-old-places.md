# 2026-10-13 — places-programs retire old places

**Branch:** `claude/places-programs-retire-old-places` · **Lane:** Places & programs (Piper)

## What changed

- `/places/` and `/places/?filter=reported` forward on the client with replace (D-565).
- Ways back: `from=reported`, a `reported` back entry (`nav.back.reported`, new English), `/places/` out of `tabFor`, stories off `/places/`.
- E2E moved off `/places/` (new helper `asMember.ts`; new `places-retired.spec.ts` for each role).

## What was wrong, and what missed it

Twelve specs drove the old list. They went to Sign in when pointed at `/` signed out, because Explore is gated, hence `asMember`.

## Decisions made

D-565.

## Verified

Targeted Playwright set in all three projects; web and config unit tests; tsc; build (see the READY).

## Left undone

Street search still off (key). `nav.back.reported` was signed by Sage and translated by Lena (911312da), merged.
Checks that only made sense on the old list: the Reported chip `aria-pressed` check (messages); the Contact Pam link inside the failed-load alert (places; Explore is a looking-around screen, A26); the full-width search box and "bell only when notifications exist" with its remembered note (explore-bell, explore-bell-shift; no screen uses `hideWhenEmpty` now); the header role chip (role-badge-fit, retargeted to Profile's role label); the search box "in the header" (area-picker).

## Needs a human

