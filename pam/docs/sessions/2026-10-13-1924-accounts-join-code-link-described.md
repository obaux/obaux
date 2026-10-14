# 2026-10-13 — Accounts & invites: Join's "Click here" is read with its question

**Branch:** `claude/pam-join-code-link-described` (from `mira/batch-b32` at `72562dba`) · **Lane:** Accounts & invites

Iris's b32 run-through, P2 (relayed by Mira, 19:14): out of reading order, the reveal link under "Did someone invite you
via code?" was heard as "Click here" alone. Will's words stay exactly as signed (card a82).

## What changed

- `@pam/ui` `TextLink` takes `describedBy` (an element id), passed as `aria-describedby`. Additive; no other link changes.
  It is the design system's file (Dot's lane): one optional prop, flagged here and in the READY.
- `JoinScreen`: the question gets an id (`useId`), and the reveal link is described by it.
- `e2e/join.spec.ts`: the button's accessible description is the question, in English and Arabic.

## What was wrong, and what missed it

- Nothing broke; the gap was found by Iris reading the screen with a screen reader's link list, which no test did.

## Decisions made

- None that a later session would question: the words are Will's, and a description is the standard way to tie a link
  to the sentence that gives it its meaning.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | clean |
| Unit: config / ui / web | 1310 (+1 skipped) / 124 / 173 pass |
| `@pam/web` build, build-storybook | build |
| Playwright join, account, a11y (320, dark-320, iPhone SE) | 147 passed |
| The new test without the change | fails (en and ar), passes with it |

## Left undone

- Nothing for this job. The two plans (new number, case manager request) went to Mira at 19:20 and wait for her read.

## Needs a human

- None.
