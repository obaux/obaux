# 2026-10-15 — design case manager prototype gaps

**Branch:** `claude/pam-design-cm-prototype-gaps` · **Lane:** design system (Dot)

## What changed

- `stories/journeys/journey.tsx`: the prototype's router is passed as `parameters.nextjs.router` (D-581); P1.
- `stories/journeys/mockSupabase.ts`: an `appointments` fixture for member `m1`, three visits; P2.

## What was wrong, and what missed it

P1: Storybook 10 reads the app router's actions from `nextjs.router`, not `nextjs.navigation`, so `router.push` did nothing in any prototype story. Taps that are links, and `navigate()`, worked, which hid it. The mock's `getMockImplementation()` reads `undefined` for an `fn(impl)`, which sent the first guess (restored mocks) the wrong way for an hour.
P2: nothing answered the case manager's read of a real member's `appointments` (D-509).

## Decisions made

D-581.

## Verified

Case manager prototype driven in a browser: Message Marcus on Home and on his page opens the thread; Marcus's page shows his visit and one attended. All 620 stories loaded on the old and new build, first-screen text compared: no difference once settled. `build-storybook` passes.

## Left undone

Nothing. W4 (what a Home card could show) is its own job.

## Needs a human

Nothing.
