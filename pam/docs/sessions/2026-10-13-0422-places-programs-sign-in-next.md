# 2026-10-13 — a way on after Sign in (S1)

**Branch:** `claude/places-programs-signin-next` · **Lane:** Places & programs (Piper)

## What changed

- `/signin/?next=/profile/add-program/` takes a person to Add my program once they are in (signed-in already, or after sign-up). The website's
  "Add your program" can point here (Wren).
- `lib/signinNext.ts`: the way on is one exact screen on a short list (`NEXT_ALLOWED`), never an address, scheme, `//`, backslash, query or any other
  screen; kept in the tab's session storage for the length of the sign-up, used once, ignored for a program lead (profile role `provider`) and for an invite
  to join as staff. No new sentence.
- Tests: `signinNext.test.ts` (the list; what is refused), `signin-next.spec.ts` (a member goes; outside addresses and other screens are ignored; a lead is not sent).

## What was wrong, and what missed it (Iris's b25 re-test, S1)

The website's "Add your program" went to Sign in, where a new person signs up as a member and then had to find Profile › Add my program (D-525) alone.

## Left undone

A brand-new person's path (sign in → join → Home) is covered by reading, not by an e2e: `JoinScreen` takes the remembered way on in place of Home, only when there is no invite.
Wren points the website's link at `/signin/?next=/profile/add-program/`.

## Needs a human

Nothing.
