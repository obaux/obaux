# 2026-10-11 — thread direction in Arabic

**Branch:** `claude/messages-thread-direction` · **Lane:** Messages & notifications

## What changed

`dir="auto"` on the message text, the thread's name and who-they-are line, the bar's name (`SubPageHeader`), and the Messages list's name and last-message line (staff). D-533. Four e2e tests in Arabic pin it (they fail without the fix; checked).

## What was wrong, and what missed it

Words people wrote were drawn inside the page's direction. Nothing tested a thread in Arabic with English words in it: the Arabic threads in tests were all Arabic.

## Decisions made

D-533.

## Verified

`messages.spec` on three projects, the new Arabic tests and the rest; full e2e, web and config unit, Storybook build and fit audit (see the READY).

## Left undone

The large heading of other pages (place and program names in an Arabic page) is not given the attribute: for Dot.

## Needs a human

Nothing.
