# Research · Super admin flow, first pass (15 October 2026)

Iris. The merge desk's job at 14:18: the last role in the first pass over every flow. With this,
all four roles have had a first pass. From here, Iris's weekly Thursday pass covers the flows that
changed that week (`docs/team.md`).

## What changed

- `docs/research/2026-10-15-super-admin-flow.md`, the report, and five stub screenshots
  (`docs/research/shots/2026-10-15-sa-*`).

## What was wrong, and what missed it

- **W1: Deny on a staff request texts the person, on one tap, with no confirmation and no message
  after.** Approving a program and taking a place off the list are the same. The e2e tests check
  that the RPC is called, not that a person is asked first.

## Verified

- Storybook and `build:e2e` from `main` `7f850755`, with the stub settings: 0 files in the
  `build:e2e` output name the live project.
- Every other host was refused. One was asked for: `images.unsplash.com`, the example staff photo,
  which is allowed for example people only.
- Eleven screens × 4 setups: no sideways scroll on any.

## Left undone

- Sending a text from Answer by text: not pressed.

## Needs a human

- W2: what should a case manager request ask for before Will approves it?
