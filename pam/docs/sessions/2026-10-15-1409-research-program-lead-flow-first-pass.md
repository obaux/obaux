# Research · Program lead flow, first pass (15 October 2026)

Iris. The merge desk's job at 13:51: the third role in the first pass over every flow.

## What changed

- `docs/research/2026-10-15-program-lead-flow.md`, the report, and six stub screenshots
  (`docs/research/shots/2026-10-15-pl-*`).

## What was wrong, and what missed it

- **S1: a real program lead's "Book a visit for a member" never lists anyone.** D-509 (11 October)
  made the list example-only (`BookForMemberView.tsx:106`), but the screen still says "People who
  have written to your program. Pick one".
  - The prototype draws the example people, so Storybook looks right.
  - No e2e test signs in a real lead and expects a person there.
  - Seen in the `build:e2e` app: "Nobody has written to your program yet."
- **P10 was checked, not assumed.** A lead seeing "Saved a new place" looked like more than members
  are told. It is D-199, and members are told under the guide card, but not on the "A program can
  see:" card.

## Verified

- Storybook from `main` `7b58b1f9`; no app code changed up to `73f96b76`. Every other host was
  refused and none was asked for.
- `build:e2e`: 0 files name the live project, 9 name the stub.
- Eleven screens × 4 setups (390 en, 320 en, 390 es dark, 320 ar): no sideways scroll on any.

## Left undone

- The super admin first pass.
- Uploading a policy, Messages, and Add a person (it texts in the real app).

## Needs a human

- W3: should Coming in open on today?
- W4: what should a real new lead see above Add your program?
