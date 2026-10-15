# Research · Case manager flow, first pass (15 October 2026)

Iris. The merge desk's job at 13:24: the second role in the first pass over every flow.

## What changed

- `docs/research/2026-10-15-case-manager-flow.md`, the report, and five stub screenshots
  (`docs/research/shots/2026-10-15-cm-*`).

## What was wrong, and what missed it

- **The case manager prototype's Message does nothing (P1).** The app is fine: in the
  `build:e2e` app the same tap opens the conversation. The prototype answers the call but never
  changes screen, and it logs nothing, so no story or check notices.
- **Storybook is still built against the live project's address.** `src/lib/project.ts` falls back
  to it, and the Storybook build doesn't take `NEXT_PUBLIC_SUPABASE_URL`: 8 bundles name it even
  with the stub env set.
  - Nothing reached it this pass. The pretend database answers inside the page, and the browser
    refused every other host; none was asked for.
  - D-576's guard covers the e2e suite, not Storybook. Reported to the merge desk, not fixed.

## Verified

- `build:e2e`: 0 files name the live project, 9 name the stub.
- The walk at 390×844 in English.
- Eleven screens at 390 en, 320 en, 390 es (dark) and 320 ar: no sideways scroll on any.
- Message, checked in the app built for tests: it opens the conversation.

## Left undone

- The program lead and super admin first passes.
- Star and Saved, inviting staff, and reporting a message: not walked.

## Needs a human

- W4: should Home show visits? It's a question for a real case manager.
