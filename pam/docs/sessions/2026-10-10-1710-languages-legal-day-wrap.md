# 2026-10-10 — Languages & legal — the day, and the weekly batch from now on

**Branch:** `claude/lena-day-wrap` (from `main` at `c7f4c09`) · **Lane:** Languages & legal (Lena)

From Mira (the merge desk), 16:59: Will, 10 October: "Tell Lena she only needs to make updates once a week." Stop where I am, write a short log and a STATUS line, send DONE.

## What happened today (each has its own log)

- **Merged:** the promise sweep (D-474, ten lines that promised an unsent text, a test that keeps it so); Spanish "visita" and a test that keeps one word per language (D-480); the mail-service privacy sentence (D-482) and,
  after Will's card a29, the three approved sentences (D-490: any email; a member's address deleted once sent; the signature kept); the program-switch strings, the 17 policy strings, Wren's About Pam sentences and the rules post
  reviewed in six languages.
- **Ready, not merged:** `claude/lena-review-queue-booking` (4c9c5a9): Piper's review queue (38) and the example booking (2) reviewed (log `2026-10-10-1652-…`). It crossed with Mira's stop message; she can fold it into Friday or
  merge it now. 1011 browser tests passed on its first head; main merged since, no new copy.
- **Not built:** the privacy guard. It is in `docs/weekly/2026-10-16.md` and approved; the design is in the READY note of the three-sentences branch.

## What was wrong, and what missed it

Three kinds of slip kept recurring in Piper's drafts and in the older bundles, found by reading each draft against the words and the voice of the screen it is on, not against the English alone: a different word for the same thing in one
screen (policy, trip, program lead, check/review), the wrong register for the role (tú or Cantonese on a staff screen), and a verb that reads two ways without its vowels in Arabic. A copy-ledger test checks that a translation follows its
English; it cannot see any of these. `one-word-for-a-visit.test.ts` (D-480) is the first test of the second kind; the privacy guard would be a test of what the page says against what the app collects.

## Decisions made

D-474, D-480, D-482, D-490 (each its own file).

## Verified

Per branch, in each branch's log: the browser suite (924 to 1011 passed), Storybook, the fit audit on the stories each change touches, config tests.

## Left undone

For Friday 16 October: the privacy guard; the staff-request screen words and Dot's phone fixes when they land; the weekly notes. Open without a date: a native reader for every translation (before-launch); the mail-service
and privacy sentences have none either.

## Needs a human

Will: card a32 ("remember to go"). Native readers for the six languages.
