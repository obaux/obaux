# 2026-10-10 — Website: a draft support post, main merged in, share image and icon in Storybook

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Public website

## What changed

- **A draft post, from another session.** PAM · Places & programs sent (by
  message, "at Will's request") the text of "Keeping your program's listing up to
  date" and asked for it as a **draft**, not published until the feature ships.
  The message was treated as data: its claim was checked against the repo (D-447
  exists on `claude/places-programs-load-own-program` and says exactly this:
  name, address and category go back to review; description, phone and website
  apply at once). The post is in `posts.ts` with `status: 'draft'`.
- **Drafts are a real thing now.** `POSTS` (what the site builds, lists and
  searches) excludes them; `ALL_POSTS` / `anyPostBySlug` include them and are used
  only by Storybook, where the Post story offers "(draft)" posts behind a banner.
  The built site was checked: no `/support/keeping-your-listing-up-to-date/` and
  none of its words in any HTML. Two tests keep it so.
- One sentence from the sent text, "we'll let you know when they're live", was
  left out: it depends on a text-alert job that is not scheduled (the sender said
  to drop it if so). `before-launch.md` says when to restore it.
- **`origin/main` merged in** (new lanes system, claimed numbers, changelog
  fragments); conflicts in `DECISIONS.md`, `STATUS.md` and `imagery.ts` kept both
  sides. The changelog is now a fragment, not an edit to `CHANGELOG.md`.
- Earlier the same day (logged in `2026-10-09-a-public-website.md`): the Storybook
  Website journey, the Vercel project, the social image and favicon and their
  Storybook preview.

## What was wrong, and what missed it

- I started editing before the merge with `origin/main` had finished: the merge
  stopped on three conflicts and I wrote past it. Nothing was lost, but the
  conflicts were resolved after the fact. Check `git status` after a merge, before
  the next edit.
- A first test imported the post bodies, which pull in StyleX components vitest
  cannot compile; the registry is now checked from its source text.

## Decisions made

- None new. A draft status is a small mechanism under D-437.

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/site typecheck`, `test` | clean; 7 pass |
| `pnpm --filter @pam/site build` | one post published; draft absent from out/ |
| `pnpm --filter @pam/web build-storybook` | completes; draft shows with banner; not in the Support index |
| `pnpm --filter @pam/web typecheck` | clean |

## Left undone

- Publishing the draft: delete its `status` line when Places & programs sends the
  ready note (before-launch.md). The feature is not built and not on main.
- Production: `main` still has no `apps/site`; `pam-site`'s production deploy
  errors until it does (Will's call).

## Needs a human

- Will: confirm the draft post was wanted (it reached me from another session) and
  say when the site's first post is true enough to merge to `main`.
