# 2026-09-17 — Finishing the demo view, and the HELP auto-reply

**Phase:** 2 · **Sessions so far:** many (see git log)

## What changed

STATUS.md row 14 named four screens the demo view (`is_demo`, D-155) was not
yet wired into: `place`, `person`, `HomePeoplePreview`, and the saved-places
dummy path. Read all four in full before changing anything.

Only the saved-places path was a real gap. `useSavedPlaces` already has a
dummy branch, but it only takes it for `demoRole` — a super admin actively
*previewing* a role, a separate mechanism from an account's own `is_demo`
flag. A member account granted the demo view hit the real
`saved_places_mine()` RPC like anyone else and saw a real, empty list, never
PAM's example saved places. Fixed at the four call sites
(`apps/web/src/app/page.tsx`, `places/page.tsx`, `saved/page.tsx`,
`place/page.tsx`) by passing `demoRole ?? (isDemo ? trueRole : null)` instead
of `demoRole` alone — the hook itself needed no change.

`person` and `HomePeoplePreview` turned out not to be gaps at all:

- `person/page.tsx` never resolves a real profile, for any account — its own
  docblock says so, and the reason is the §4.1 `ADMIN_CAN_SEE` transparency
  limit, not an oversight. There is no real data behind it to leak.
- `HomePeoplePreview` is documented to render only during an active role
  preview, never on a real account's own Home. Making it also fire for
  `isDemo` would be new behaviour, not the mechanical fix STATUS.md's own
  framing implied.

Full reasoning for both, and the exact steps for the HELP auto-reply
(Twilio Console, Advanced Opt-Out, matched against what was filed with the
carrier), are in D-159.

## What was wrong, and what missed it

STATUS.md's own row 14 said finishing the remaining four screens was "the
same pattern repeated, not new design." That was wrong for two of the four —
nothing caught it because nobody had read `person/page.tsx` or
`HomePeoplePreview.tsx` closely enough to notice they don't share the
real-query-with-dummy-fallback shape the other five screens (`directory`,
`admin`, `notifications`, and now saved places) have. The fix here was
reading each file before writing anything, and updating STATUS.md's own
framing rather than trusting it a second time.

## Decisions

- D-159 — the saved-places fix, why `person` and `HomePeoplePreview` were
  left alone, and the Console steps for the HELP auto-reply.

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/web typecheck` | Green |
| Read `place/page.tsx`, `person/page.tsx`, `HomePeoplePreview.tsx`, `useSavedPlaces.ts`, `savedPlacesDemo.ts`, `useDirectory.ts` in full | Confirmed which screens have a real query behind them and which don't |

Not run: `next lint` (interactive first-run config prompt in this
environment, unrelated to this change) and the UI itself in a browser — no
new screen state was added, only which data source four existing call sites
read from, so this was judged low-risk to ship without a manual click-through
this session; worth a real demo-account walkthrough of Home/Places/Saved/a
place screen next time someone is in the app.

## Left undone

- The HELP auto-reply itself is not set — no tool here can write to Twilio.
  D-159 has the exact Console steps; this needs five minutes from Will.
- No manual browser verification of the saved-places demo-view change (see
  above).

## Needs a human

- Will: set the HELP auto-reply in the Twilio Console per D-159, then text
  HELP to a PAM number from a verified test phone to confirm.
