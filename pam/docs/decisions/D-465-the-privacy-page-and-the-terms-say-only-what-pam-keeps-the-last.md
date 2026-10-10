# D-465 — The privacy page and the terms say only what Pam keeps: the last day, and blocking

**Date:** 2026-10-10 · **Branch:** `claude/lena-honest-promises`

Will, 10 October 2026, relayed by the merge desk: every screen that promises something Pam does not do is
built to keep the promise or rewritten. Wren, reading the privacy page, the terms and the transparency screen
against the code, found two lines that were not true. Mira (the merge desk) decided both, after reading my
findings against the live migrations; this is the wording half.

## 1. "The last day you used Pam. A program you joined sees this too."

`transparency.canSee.lastActive` told a member that a program sees the last day they used Pam. It does not.
A case manager does (`profiles_select_admin_caseload`, through `admin_covers()`). A program does not: 0062
dropped the policy that gave a program the profile row, and `provider_linked_members()` returns an id and a
first name only. What a program does get is *that* a member saved a new place, and when (0067
`people_activity()`, for members it can message), which is the next line, `canSee.saves`, and is true.

**Decided (Mira, 10 October):** "The last day you used Pam." for the case manager only, in all seven languages,
with the contract's `en`, its comment and a test; D-242's program half stays open. D-242 (Will, 3 October)
meant a program to see it; the database never did, and the migration that would make it so is the follow-up
the contract's own comment named. When it is live, the second sentence returns with a database test that says
so (`04_transparency_contract_test.sql` part 3 still holds the opposite).

Elsewhere the same promise was **not** repeated in the app: the privacy page's list of what a guide sees and
the case manager's onboarding line (`join.privacy.admin.1`) are about the case manager, and true. It is repeated
on the public site's "What others can see" table (`apps/site`, Wren's); reported to the merge desk.

## 2. "You can block anyone, and they will not know." / "Block someone … Both work from inside the chat."

There was no Block control: the database had blocking (0076, live) and nothing in the app called it. Mira
decided to change the words at once and have the control built; **the control landed the same day** (D-463,
Nico): a conversation's ⋯ menu has "Block this person"; neither person can send in that conversation or start
a new one; what was already said stays, and can still be reported; **the other person is told** (they see
that messages are blocked, `messages.blocked.theirs.*`); only the one who blocked can undo it, from the same
menu; staff can block too.

So the words came back, in their true form, saying where:
- privacy `your-choices.p3`: "Block someone, or report a message that is not safe. Both are in a conversation's ⋯ menu."
- terms `being-decent.p3`: "You can block someone you talk to, from a conversation's ⋯ menu. Neither of you can send
  messages there after that. They will see that messages are blocked." Not "anyone" (you can block only
  somebody you share a conversation with), and not "they will not know" (they are told).

## Tests and translations

`legal.test.ts`, "promises that are kept": the last-day line is one sentence, in every language, with no program in
it, and the saves line keeps its second sentence; the block sentences name the ⋯ menu in every language and never
say "block anyone" or "will not know". The contract's comments no longer say a program sees the last day. The six
translations are Claude's, written in each language's existing words for block and menu (matching
`messages.block.*`), and are promises: they need a native reader (`before-launch.md`).

## What a later session might reverse

Putting "A program you joined sees this too." back on the last-day line once the database hands it to a program
(and changing the site's table with it); calling the blocked person's notice "told" in the terms if it ever stops.

The mail-service paragraph on the privacy page is **not** part of this decision: its English is with Will for approval.
