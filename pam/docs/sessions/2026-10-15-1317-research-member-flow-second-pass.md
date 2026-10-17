# Research · Member flow, second pass (15 October 2026)

Iris. Run from the merge desk's weekly Thursday note: the first pass over every flow isn't finished
(only Member was done, on 10 October), so this is Member again, in place of the weekly pass.

## What changed

- `docs/research/2026-10-15-member-flow.md`, the report, and six stub screenshots
  (`docs/research/shots/2026-10-15-member-*`).
- This branch (`claude/research-member-flow`) also carries the 10 October report and its session
  log, which never reached `main`. Its findings were acted on in b25 to b33. The report itself is
  the record of what the first pass saw.

## What was wrong, and what missed it

- **The sign sheet's Sign button can be lit over an empty box and do nothing (W1).** `hasInk` in
  `SignSheet` outlives the pad, which unmounts when the sheet closes. Nothing tests opening the
  sheet a second time.
- **The prototype stopped keeping the signature (P8).** On 10 October it kept it. Now a signed-in
  member's kept signature is read from the account, while example places write it to session
  storage. The journeys' "no fixture" log for `member_signatures` and `policy_signatures` said so
  on every place screen, and nobody acted on it.
- **Ways to earn misses the two biggest earners (W2).** `AWARDED_TODAY` was not updated when D-535
  started paying for "I'm here" and "I went".

## Verified

- Storybook built from `main` `dc3789e9` (exit 0), served on 127.0.0.1 only. Every other host was
  refused; none was asked for.
- `build:e2e` output: 0 files name the live project, 9 name the stub.
- The full walk at 390×844 in English. Seven screens at 320×568 en (light), 390×844 es (dark) and
  320×568 ar (light): no sideways scroll on any of them.

## Left undone

- The case manager, program lead and super admin first passes: none started. Case manager is next.
- W6 and the keyboard need a real phone (Will, about 10 minutes).
- Dark-mode contrast was looked at, not measured.

## Needs a human

- W2: was attendance left off Ways to earn on purpose?
- P5: are the badge names meant to stay English in every language?
