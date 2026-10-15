# D-581 — The Storybook prototype's router is wired through parameters.nextjs.router

**Date:** 2026-10-15 · **Branch:** `claude/pam-design-cm-prototype-gaps`

**Asked by:** Mira, relaying Iris's Case manager pass (P1): "Message Marcus" did nothing in the prototype, on Home or on his page.

## What was wrong

The prototype hands its own `push`, `replace` and `back` to Storybook so that `router.*` in a screen moves the prototype (`prototypeRouter`, D-211). `asRole` passed them under `parameters.nextjs.navigation`. In Storybook 10 (`@storybook/nextjs` 10.6) that key only says where the story is (`pathname`, `query`, `segments`); the router's actions are read from `parameters.nextjs.router` (`createNavigation(router)`). So `router.push` was a bare spy in every prototype story: a link tap worked (the prototype listens for clicks), and so did `navigate()` (it announces `pam:navigate`), but any screen that moves with `router.push` after work, such as opening a conversation, stayed where it was. The pretend database answered; nothing showed.

## What was decided

`asRole` passes `router: { ...prototypeRouter }` and keeps `navigation: { pathname, query }`. Marcus's visits (P2) get a fixture too: `appointments` for `member_id=eq.m1` (the case manager reading a real member's page, D-509), one coming up, one marked as there, one missed.

## Proof

In the case manager prototype (Sign in, code, Home), "Message Marcus" on Home and on his page opens the conversation; his page shows "1 Trips coming up", the visit under "Coming up trips" and one under "Programs attended in the past"; no `[journey] no fixture` line. Every one of the 620 stories was loaded before and after (text of the first screen, 390 wide): after allowing for time and loading, none changed.

## What a later session might reverse

Nothing. If Storybook changes the key again, "Message Marcus" going nowhere is the symptom; the fix is where `prototypeRouter` is passed.
