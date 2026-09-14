# 2026-09-14 — The way in, and the way out

**Phase:** 1 (member-facing) · **Sessions so far:** 9

Third log for the 14th. Will tried the app on two phones the same night sign-up
shipped and said it was not working well. He was right, and the live auth logs
say exactly how: one phone asked for a sign-in code three times in eight
minutes and never got in; the other signed up as a member and then had no way
to get back to his super admin account, because there was no way to sign out.

This session was an audit of every path from "has a phone" to "sees a screen",
for each of the four kinds of account, and then the fixes.

## What the audit found

1. **No sign-out** anywhere a member could reach. The one that existed was a
   text link at the foot of the case manager's screen. On a phone handed round
   at a program, the first person to sign in stayed signed in for ninety days.
2. **`/signin/` asked a signed-in person for their phone.** They would type it,
   get a second code, and land where they started.
3. **Six screens told a half-signed-up person to "Sign in"** — the door they had
   just come through. A verified phone with no account was treated as signed
   out everywhere except the flow itself.
4. **Invite codes could be made and never typed in.** `redeem_invite` had
   existed since 0008. Nothing called it.
5. **The person running PAM could not bring anybody in.** `is_admin()` is
   `role = 'admin'`, so a super admin calling `create_invite` was refused, and
   `create_invite` refused the `admin` role for everybody. A case manager could
   only be made by the seeding script, from a laptop with the service key.
6. **No cooldown on "Send it again."** Three taps, three codes, and a carrier
   that stops delivering to that number.
7. **A paused account met a wall of "something went wrong"**, each notice
   offering a call about a thing that was not broken.

## What changed

**Every signed-in screen has the same button, in the same corner, to
`/account/`** — who PAM thinks you are, in the words sign-up used, and one
action: sign out, which lands on the sign-in screen and says so (D-115).

**The four doors, one each** (D-116, 0049):

| Who | How they get in |
|---|---|
| member | signs themselves up, or a code from a case manager |
| program (provider) | asks at sign-up; a case manager or super admin makes the code |
| case manager (admin) | a code only a super admin can make, into a named city |
| super admin | the seeding script, and nothing else |

Nobody chooses their own role. A member self-serves because a member sees only
their own rows; every role that sees somebody else's is handed out by a person
who is answerable for it, and the invite carries the role. The directory has an
invite card that asks which city first.

**The code goes in step 2 of sign-up**, above the three sentences, which
disappear when it is filled — the person who made the code answered them.
`/join/?code=XXXX` prefills it, so an invite can be a link. The invite decides
the role and the city; the screen sends the name alongside so a person who came
in by code is not the one person PAM has no last name for.

**Thirty seconds between codes**, counted down on the link itself.

**`useSession` knows five states**, not three: `no-profile` and `suspended`
each have one shared answer (`NotIn`) that every screen renders, so a seventh
screen cannot forget one. It also listens to the sign-in system, so a sign-out
in one tab changes every screen without a reload.

## What was wrong, and what missed it

**The auth listener stalled every signed-in screen.** The first version
re-asked for the session on every `SIGNED_IN` event. supabase-js announces
that event every time a client wakes up with a stored session, and this app
makes a client per call — so each re-ask caused the announcement that caused
the re-ask. Every screen sat on "loading". The listener now acts on
`SIGNED_OUT`, and on `SIGNED_IN` only for a different person than the one the
screen was drawn for. *An event named for what you want to hear is not
necessarily fired only when it happens.*

**A check constraint from 0002 still forbade admin invites** after the
function allowed them. `invites_role_not_admin`, in the table itself. The
function's tests said so on the first run; the constraint now forbids only
`super_admin`, which is the rule that has not changed.

**The seventh screen.** The account button is rendered by `AppHeader` whenever
a screen passes a `roleLabel`. Two screens did not — Places and Reminders — so
they had no way out. The browser test that walks four screens looking for the
button is what found the first; the second was found by reading.

## Decisions

D-115 (one account screen, one way out), D-116 (four doors, one each; nobody
chooses their own role), D-117 (a code is optional and replaces the question),
D-118 (thirty seconds between codes, said on the screen).

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | clean, 5/5 |
| `pnpm --filter @pam/config test` | 202 tests; en/es parity at 488 keys |
| `pnpm --filter @pam/ui test` | 63 tests, axe clean |
| `pnpm --filter @pam/db test` | all checks pass, 8 new on 0049 |
| `pnpm --filter @pam/web test:a11y` | 381 browser tests across 3 viewports |
| `node scripts/check-bundle-budget.mjs` | 499.7 kB first load, 0.3 kB to spare; animation 36.5 kB of its own 40 kB |

Migration applied live: 0049. Supabase advisors: no new warning classes; the
three-argument `redeem_invite` is gone from the list and the five-argument one
is in it.

## Left undone

- **Nothing reviews `staff_requests`.** A super admin can now make the code
  the request asks for, but no screen shows the requests. The invite card and
  the request list belong together.
- **Nobody can edit their own name or city.** The account screen says to call
  PAM. A real edit screen is small; it was not this session's job.
- **The Twilio account is still in trial**, so only hand-verified numbers get
  a code. That is the most likely reason the second phone on the 14th never
  signed in, and no cooldown fixes it.
- **The bundle has 0.3 kB left.** The account screen and the invite card cost
  1.4 kB of shared JavaScript. Splitting the Astryx imports has to come before
  the next screen.

## Needs a human

1. **Take Twilio out of trial** (or verify each tester's number by hand). Until
   then a code to an unverified number is silently not sent.
2. **Who calls the people who ask to help?** Unchanged from the last log; the
   code they need can now be made from the directory.
3. The two open design questions from earlier today: the coral dark-mode
   wordmark, and the PAM-team line on the transparency screen.
