# 2026-10-11 — Voice & UX copy: the help-search phrases, in Wren's shape

**Branch:** `claude/help-search-phrases-v2`, cut from Wren's `claude/compassionate-bohr-mzrchf` · **Lane:** Voice & UX copy (Sage)

## What changed

- `apps/site/src/content/search-phrases.ts`: 67 phrases in people's own words, as `{ phrase, post, use }` (Wren's
  shape, D-506). 48 find a published post first; 19 are gaps.
- `docs/help-centre-gaps.md`: the 19 gaps in the Open table, each with who is asking and what a post needs to
  say. Owner: Sage + Wren.
- `posts.ts`: one keyword ("read my messages") on what-others-can-see, so a resident worried about their chats
  lands on the privacy table.
- Replaces my first branch `claude/help-search-phrases` (a different shape, written before Wren's arrived); that one
  should not merge.

## What was wrong, and what missed it

- I wrote a shape before reading Wren's, and our two notes crossed. One wasted branch. Next time I'll check the
  other lane's pushed branches before writing a shared file.
- Four phrases first found another post. Two were fair answers, so I took the post search found (a guide is
  explained in who-is-my-guide; what a case manager sees is the privacy table). One I reworded, and one needed a
  keyword.

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/site test` | 36 pass, including every phrase through the real search |
| `tsc --noEmit` in apps/site | clean |

## Left undone

- Writing the 19 gap posts with Wren; Will sees the words first. English only.
