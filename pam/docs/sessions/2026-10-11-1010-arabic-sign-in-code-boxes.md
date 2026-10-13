# 2026-10-11 — Arabic sign-in code boxes

**Branch:** `claude/pam-design-code-boxes-ltr` · **Lane:** Dot, Design Systems Lead · **Decision:** D-530

## What changed

`packages/ui/src/CodeBoxes.tsx`: the boxes and hidden field are wrapped in a `<div dir="ltr">` (the `VStack` did not pass `dir` through). New `apps/web/e2e/signin-code-boxes-ltr.spec.ts`.

## What was wrong, and what missed it

The boxes inherited the page's right-to-left direction. No test ran the code step in Arabic; `languages.spec.ts` checks words and cropping, not digit order.

## Decisions made

D-530.

## Verified

The new spec fails without the attribute (digits read 5, 4 … from the right) and passes with it; `signin-short` and `signin-wrong-code` still pass; `pnpm build` of web passes; web typecheck passes.

## Left undone

Lena's confirmation that left-to-right is right for Arabic readers (asked). Screen readers: the field is the single real input, so what is read out is unchanged.

## Needs a human

Nothing.
