# 2026-10-10 — messages bell links

**Branch:** `claude/messages-bell-links` · **Lane:** Messages & notifications (Nico)

## What changed

Tests only: `e2e/messages.spec.ts` gains "the bell's rows land on real screens in the new layout".

## What was wrong, and what missed it

Nothing found. The database writes five kinds of bell row. Four have a link and all four land on a real
screen in the new layout; the fifth has none by design.

| Row | Goes to | Lands on |
|---|---|---|
| message_received | `/messages/thread/?id=…` | the conversation |
| message_reported | `/messages/?show=reported` | Messages, Reported selected |
| service_flagged | `/places/reported/?from=notifications` | Piper's reported places |
| staff_request_pending | `/requests/` | the requests list |
| service_removed | no link (text only) | stays a line of text |

Nothing in the bell links to `/account/`, `/admin/` or `/reminders/`, so Dot's shell change does not touch it.

## Decisions made

None.

## Verified

The four tests on narrow-320, dark-320 and iphone-se-viewport: 12 passed. Build clean.

## Left undone

Nothing.

## Needs a human

Nothing.
