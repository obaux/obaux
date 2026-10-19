# 2026-10-19 — design D-619 notice toast

**Branch:** `claude/pam-design-warning-toast` (off my D-618 branch `b2c9c3fd`, which has Nico's classifier and ef8b19af/88975d23 in it) · **Lane:** design system (Dot)

## What changed

- `packages/ui/src/noticeSink.ts` (new, own export `@pam/ui/noticeSink`): the context a status `Notice` hands its words to. `Notice` registers a toast spec where a sink exists (and draws nothing in place), unregisters on unmount, takes an optional `closable`. With no sink (packages/ui tests, the Notice stories) it draws the card as before.
- `apps/web/src/lib/malfunction.tsx`: the provider holds the registered notices and the closed ones, supplies the sink, and renders one host: the lazily loaded `BottomStack`, or the plain stand-in until it has loaded.
- `BottomStack.tsx` (lazy): the toasts above, the D-618 banner at the bottom edge, one flex column. All of the failure words, kinds and actions moved in here from the provider.
- `NoticeToast.tsx` (lazy): Astryx's toast look drawn here (Astryx's `Toast` component and its `MediaTheme` add 4.5 kB gz to the first load, found by taking them out one at a time). Error is the red card; warning and info the inverse-of-the-page card (warning keeps `role="alert"`). No swipe at all; a lasting state has no close, a one-off has one.
- `PlainStack.tsx` (root): the stand-in: same place and ground, title, line, Contact Pam as a link. Shown until the stack has loaded, and for good if it cannot be (offline).
- `SignInScreen`: an invalid number is the one-line `CompactNotice`; a failed send keeps Contact Pam (A9, A28: "help is absent while nothing is wrong and present the moment something is") as a closable toast. `PoliciesView`: the upload problems are the one-line `CompactNotice`.
- Budget on the merged tree (main after b77, D-618, D-619): 1.9 kB spare with the `settle` re-export kept for Ava's five files, **2.1 kB** once they import from `./settle` (measured by changing them in the working tree and reverting). Reporter and classifier fetched at idle and out of the root, `settle.ts` its own module (identical to Piper's, with `AlertsView` importing it directly), the words and kinds in the lazy stack.
- Stories: Notice toast (offline, paused, turned off, won't load, invite expired, closable, with the failure banner, Arabic); the Notice stories keep the card (no sink).

## What was wrong, and what missed it

Nothing: Will asked for the style to change.

## Decisions made

D-619.

## Verified

- Targeted run of the specs that touch a notice (21 files, 1,134 tests): 3 failures, all one test: `consent.spec` "when sending the code fails, the number to call is on the screen", correctly failing because I had made that notice a `CompactNotice`. Fixed (it keeps Contact Pam), then 96/96 on it and the new spec. After the budget work: malfunction-banner, alerts, notice-toast, consent, account, signin-wrong-code, 255 passed on all three projects. **The full 2,667-test run was started and stopped (it takes over an hour here); the desk's full run covers the rest.**
- `e2e/notice-toast.spec.ts`: the paused-account toast is fixed at the bottom inside 320×568, has a 48px Contact Pam, no close, survives a tap, a key and a touch, and the page behind it still has its header. The first test fails on main's real build (not a fixed element); the other two (announced once, axe) hold on both, as invariants.
- `@pam/ui` 130, `@pam/config` 1522, tsc clean. Bundle: within budget with 0.0 kB to spare (see below).

## Left undone

- The full e2e run, for the desk.
- The 16 one-off failed actions become a banner as their owners convert them; until then they are toasts with no close.
- The gallery's two examples follow whatever the default is.
- D-618's own pending items (Lena's keys, Nico's next classifier, the seven-language pictures) are on the D-618 branch.

## Needs a human

Will to see the pictures beside D-618's.
