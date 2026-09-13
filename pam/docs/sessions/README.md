# Session logs

One file per build session, named `YYYY-MM-DD-<short-slug>.md`. Never edit an
old one — they are a record of what was believed and done at the time, and their
value comes from being immutable.

## Why these exist

`STATUS.md` says where the project *is*. These say how it *got there*: what was
tried, what turned out to be wrong, and what was left half-finished. The next
session reads the most recent one so it does not have to reconstruct intent from
a diff.

The most useful thing in a session log is usually not the list of what was
built. It is the thing that went wrong and why it was not caught.

## What belongs in one

Write it for the next person, who has none of your context.

- **What changed** — enough to orient, not a commit list. Commits are in git.
- **What was wrong, and what missed it.** Every bug that survived a passing
  check earns a paragraph: what broke, why the tests said fine, and what now
  catches it. This is the highest-value section.
- **Decisions made** — one line each, pointing at the `DECISIONS.md` entry.
  Anything a future session might reasonably reverse belongs there in full.
- **Verified** — what was actually run and its result. Numbers, not adjectives.
  "133 unit tests, 83 database checks" beats "tests pass".
- **Left undone** — work started and not finished, and anything known to be
  broken. Be specific enough to resume.
- **Needs a human** — decisions or access the session could not supply.

## What does not belong

- A narration of every step. The diff has that.
- Anything secret: keys, tokens, phone numbers of real people, or the content of
  a member's data. This repository is public.
- Optimism. If something is unverified, say unverified. A log that overstates
  what works costs the next session more than it saves.

## Template

```markdown
# YYYY-MM-DD — <what the session was about>

**Phase:** <SOP phase> · **Sessions so far:** <n>

## What changed

## What was wrong, and what missed it

## Decisions

## Verified

| Check | Result |
|---|---|

## Left undone

## Needs a human
```
