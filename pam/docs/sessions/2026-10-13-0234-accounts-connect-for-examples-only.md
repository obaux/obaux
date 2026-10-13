# 2026-10-13 — Accounts & invites: "Connect {name} to…" only for examples

**Branch:** `claude/pam-connect-examples-only` (from `main` at `0a36ada1`; local, not pushed) · **Lane:** Accounts & invites

Mira (merge desk), 13 October, on Sage's finding: a case manager's "Connect {name} to…" opens
ConnectView, which says "{program} is recommended to {name}. They will see it on their Home…",
but nothing is stored or sent. Her decision, under D-509's rule (no examples for real accounts):
the row only when examples are on; the address sends a real account back.

## What changed

- `app/person/page.tsx`: the Connect row needs `useExamplesOn()` as well as a case manager's view.
- `app/person/connect/page.tsx`: a real account (once the session has settled, so a demo account
  is not bounced while it loads) is sent back to `/person/?id=…`; examples still draw ConnectView.
- No strings removed (the example view still uses them). New `e2e/connect-examples-only.spec.ts`.

## Comes back when

Recommending a program is built for real (stored, and shown on the member's Home): then the row
and the page return for real accounts, and this gate goes.

## Verified

| Check | Result |
|---|---|
| web typecheck, web unit | clean, 139 pass |
| `e2e/connect-examples-only.spec.ts` | 9 pass; against `main` without the change the two real-account tests fail |
| messages, people-strip, program-visits, a11y specs | with the above, 336 passed |

## Found, not fixed (FINDING)

- A real case manager's member page lists **example trips** ("Example Food Pantry…") under
  "Coming up trips" and "Programs attended in the past": `dummyTripsFor(person.id)` in
  `app/person/page.tsx` is not gated by `useExamplesOn()`. Same rule (D-509); not in this job.
