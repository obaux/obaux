# 12 September 2026 — The dispatcher, and who hears about a flag

## What changed

**PAM can now send a text message, and does not.** The dispatcher is written,
deployed to the live project as the `dispatch-sms` Edge Function, and running on
a five-minute schedule. It refuses every message, because no human has signed
off the copy. That is the design: the schedule was switched on *before* the copy
was signed, so the plumbing could be proved with nothing at stake.

The split is deliberate. Everything that decides **whether** a message may go out
is in the database (migration 0039): quiet hours, the STOP list, no-phone-number,
and atomic claiming so two overlapping runs cannot both send the same reminder.
The function decides only **how** a message is worded, and re-checks the finished
words against §9 before they leave — PAM identifies itself, 160 characters, no
emoji, nothing that reveals justice involvement.

Also this session:

- **Who hears about a flag** (A7, D-080). A flagged place goes to every super
  admin and to the case managers of the members who saved it. A reported message
  goes to every super admin and to the case manager of the member the report is
  *about* — the sender, not the reporter. Already wired in 0038; now written down
  where it can be referred to, because it is a rule about people, not a detail of
  a trigger.
- **0041**, closing two trigger functions that the security advisor found were
  published as endpoints.

## What was wrong, and what missed it

**The dispatcher's first live run left a message marked sent that was never
sent.** The function claims a row as sent up front, then reports back if it
fails. Reporting back called a database function that returns nothing — which
answers with an empty body — and asking an empty body for JSON throws. So the
report died, the exception escaped, and the row stayed marked sent. The one
outcome the queue exists to prevent: a member who is silently never told.

The unit tests did not miss a case; they could not see this at all. Every test
covered rendering, which is pure, and nothing covered the shape of an answer
coming back over the network. What caught it was running the deployed function
against the live database with one real queued row — five minutes of work that
no amount of local testing would have substituted for.

Fixed two ways: empty answers are now handled, and reporting a failure can no
longer throw at all, so one unreportable message cannot stop a batch. Re-run on
the live project afterwards: `claimed 1, sent 0, reason: copy is not signed off`,
and the row itself came back `failed` with that reason on it.

The lesson worth keeping: the refusal path is the path that runs in production
for as long as the copy is unsigned. It deserved the first live test, not the
last.

## Decisions made

- **D-080** — a flag is routed to the people it is about, not broadcast. The
  audience comes from the relationship (who saved the place; who sent the
  message), never from a role list, and the reporter is never notified as the
  reporter.
- Quiet hours, the STOP list and claiming live in the database rather than in the
  dispatcher, because a promise enforced in something anyone can redeploy is not
  enforced (recorded in 0039's own header).
- The schedule runs regardless of whether the copy is signed. A clock that is
  already ticking turns "PAM can text people" into one signature instead of a
  deployment.

## Verified

- `pnpm --filter @pam/config test` — 192 tests pass, including 23 new ones that
  run the real renderer against the real message bundle.
- `pnpm --filter @pam/db test` — 152 checks pass, six of them new: quiet hours
  wrap midnight, a STOP and a missing number never reach the dispatcher, a STOP
  leaves the queue for good, a second overlapping run finds nothing left, and a
  message that did not send stops being recorded as sent.
- The generated bundle is asserted, word for word, against the reviewed source,
  so a hand-edited `templates.json` fails a test rather than reaching a phone.
- Live, on the pilot project: quiet hours true at 22:30 and 06:00, false at 13:00
  and 07:00. Dispatcher on an empty queue: `claimed 0, sent 0`. Dispatcher on one
  real queued notice: `claimed 1, sent 0`, refused for unsigned copy, row marked
  failed with the reason. Test row deleted afterwards.
- Security advisor re-run after the schema changes: none of the new functions are
  reachable from outside; the two it did flag are closed in 0041. The remaining
  warnings are the pre-existing list in D-025.

## Left undone

- The notification bar in the top header of the case manager and super admin
  panels, and the person profile the notices should also appear inside. The
  notices themselves are being written to the database now, with nowhere yet to
  read them in the app.
- Program managers blocking messages from one member.
- Sign-up screens with the role pills.
- Super admin surfaces: error log, manual program entry, database view.
- The five-tab member shell.

## Needs a human

1. **Supabase → Authentication → Providers → Phone.** Twilio is paid for and
   working, but Supabase has not been pointed at it, so `Unsupported phone
   provider` comes back and **nobody can sign in at all**. Account SID, Auth
   Token, Verify Service SID. This is the single setting blocking the product.
2. **A name against the SMS copy.** Thirteen templates, all reviewed-by empty.
   The dispatcher will keep refusing every message until there is a name. The
   review sheet is linked from `docs/sms-setup.md`.
3. **Twilio credentials into the dispatcher's secrets** once the copy is signed.
